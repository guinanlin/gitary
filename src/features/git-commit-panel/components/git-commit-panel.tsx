import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { stagingService, StagedFile } from "@/services/staging.service";
import { spaceHelper } from "@/helpers/space.helper";
import { spaceService } from "@/services/space.service";
import { authService } from "@/services/auth.service";
import { spacePlatformRegistry } from "@/services/space-platform.registry";
import { createGithubClient } from "libs/github-api";
import { createGiteeClient } from "libs/gitee-api";
import { createGitcodeClient } from "libs/gitcode-api/gitcode-client";
import xbook from "xbook/index";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Plus, Trash2, Edit } from "lucide-react";

interface GitCommitPanelProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitCommitPanel({ spaceId, open, onOpenChange }: GitCommitPanelProps) {
  const { t } = useTranslation();
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [branch, setBranch] = useState("main");
  const [isCommitting, setIsCommitting] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !spaceId) return;

    const updateStagedFiles = () => {
      const files = stagingService.getStagedFiles(spaceId);
      setStagedFiles(files);
    };

    updateStagedFiles();
    const unsubscribe = stagingService.subscribe(spaceId, updateStagedFiles);

    const space = spaceService.getSpace(spaceId);
    if (space) {
      setBranch("main");
    }

    return unsubscribe;
  }, [open, spaceId]);

  const handleCommit = async () => {
    if (stagedFiles.length === 0) {
      xbook.notificationService.warning("No files to commit");
      return;
    }

    if (!commitMessage.trim()) {
      xbook.notificationService.warning("Please enter a commit message");
      return;
    }

    setIsCommitting(true);

    try {
      const space = spaceService.getSpace(spaceId);
      if (!space) {
        throw new Error("Space not found");
      }

      const accessToken = authService.getAnyAuthInfo(space.platform, space.owner)?.accessToken;
      if (!accessToken) {
        throw new Error("Access token not found. Please re-authorize.");
      }

      let gitClient: any;
      if (space.platform === "github") {
        gitClient = createGithubClient({ getAccessToken: () => accessToken });
      } else if (space.platform === "gitee") {
        gitClient = createGiteeClient({ getAccessToken: () => accessToken });
      } else if (space.platform === "gitcode") {
        gitClient = createGitcodeClient({ getAccessToken: () => accessToken });
      } else {
        throw new Error(`Unsupported platform: ${space.platform}`);
      }

      for (const file of stagedFiles) {
        const path = file.path.startsWith("/") ? file.path.slice(1) : file.path;

        try {
          if (file.operation === "delete") {
            await gitClient.File.delete({
              owner: space.owner,
              repo: space.repo,
              path,
              message: commitMessage,
              branch,
            });
          } else if (file.operation === "add") {
            await gitClient.File.add({
              owner: space.owner,
              repo: space.repo,
              path,
              content: file.content || "",
              message: commitMessage,
              branch,
            });
          } else {
            await gitClient.File.update({
              owner: space.owner,
              repo: space.repo,
              path,
              content: file.content || "",
              message: commitMessage,
              branch,
            });
          }
          console.log(`[GitCommitPanel] Committed file: ${path} (${file.operation})`);
        } catch (fileError: any) {
          console.error(`[GitCommitPanel] Failed to commit file ${path}:`, fileError);
          throw new Error(`Failed to commit ${path}: ${fileError?.message || String(fileError)}`);
        }
      }

      stagingService.clearStagedFiles(spaceId);
      xbook.notificationService.success(`Successfully committed ${stagedFiles.length} file(s)`);
      onOpenChange(false);
      setCommitMessage("");
    } catch (error: any) {
      console.error("[GitCommitPanel] Commit failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || String(error);
      xbook.notificationService.error(`Commit failed: ${errorMessage}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRemoveFile = (uri: string) => {
    stagingService.removeFile(spaceId, uri);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "add":
        return <Plus className="h-3 w-3" />;
      case "delete":
        return <Trash2 className="h-3 w-3" />;
      default:
        return <Edit className="h-3 w-3" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "add":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "delete":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Commit Changes</DialogTitle>
          <DialogDescription>
            Review and commit your staged changes ({stagedFiles.length} file{stagedFiles.length !== 1 ? "s" : ""})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <div className="text-sm font-medium mb-2">Staged Files</div>
            <ScrollArea className="h-[200px] border rounded-md">
              {stagedFiles.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No files staged for commit
                </div>
              ) : (
                <div className="p-2">
                  {stagedFiles.map((file) => (
                    <div
                      key={file.uri}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                    >
                      <div className={`flex items-center justify-center w-5 h-5 rounded ${getOperationColor(file.operation)}`}>
                        {getOperationIcon(file.operation)}
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{file.path}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveFile(file.uri)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Commit Message</label>
            <Textarea
              placeholder="Enter commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="main"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCommitting}>
            Cancel
          </Button>
          <Button onClick={handleCommit} disabled={isCommitting || stagedFiles.length === 0}>
            {isCommitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Committing...
              </>
            ) : (
              `Commit ${stagedFiles.length} file${stagedFiles.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

