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
import { Octokit } from "octokit";
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

    const loadDefaultBranch = async () => {
      const space = spaceService.getSpace(spaceId);
      if (!space) return;

      try {
        const accessToken = authService.getAnyAuthInfo(space.platform, space.owner)?.accessToken;
        if (!accessToken) return;

        let gitClient: any;
        if (space.platform === "github") {
          gitClient = createGithubClient({ getAccessToken: () => accessToken });
        } else if (space.platform === "gitee") {
          gitClient = createGiteeClient({ getAccessToken: () => accessToken });
        } else if (space.platform === "gitcode") {
          gitClient = createGitcodeClient({ getAccessToken: () => accessToken });
        } else {
          return;
        }

        if (gitClient.Repo?.get) {
          const repoInfo = await gitClient.Repo.get({ owner: space.owner, repo: space.repo });
          let defaultBranch = repoInfo?.data?.default_branch || repoInfo?.data?.defaultBranch;
          if (!defaultBranch) {
            if (space.platform === "gitee") {
              defaultBranch = "master";
            } else {
              defaultBranch = "main";
            }
          }
          setBranch(defaultBranch);
        } else {
          if (space.platform === "gitee") {
            setBranch("master");
          } else {
            setBranch("main");
          }
        }
      } catch (error) {
        console.warn("[GitCommitPanel] Failed to load default branch, using 'main'", error);
        setBranch("main");
      }
    };

    loadDefaultBranch();

    return unsubscribe;
  }, [open, spaceId]);

  const extractErrorMessage = (error: any): string => {
    console.log("[GitCommitPanel] Error object:", error);
    
    const errorData = error?.response?.data;
    console.log("[GitCommitPanel] Error data:", errorData);
    
    if (errorData) {
      if (typeof errorData === "string") {
        return errorData;
      } else if (errorData.message) {
        return errorData.message;
      } else if (errorData.error) {
        return typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      } else if (errorData.error_description) {
        return errorData.error_description;
      } else {
        try {
          return JSON.stringify(errorData);
        } catch {
          return String(errorData);
        }
      }
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.response?.statusText) {
      return error.response.statusText;
    }
    
    return String(error);
  };

  const commitFileForGitHub = async (
    gitClient: any,
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string
  ): Promise<void> => {
    let fileSha: string | null = null;
    try {
      const pathInfo = await gitClient.File.get({
        owner,
        repo,
        path,
      });
      fileSha = pathInfo?.data?.sha || pathInfo?.sha || null;
    } catch (error: any) {
      const status = error?.response?.status || error?.status;
      if (status !== 404) {
        console.warn(`[GitCommitPanel] Failed to get file SHA for ${path}, will try to create:`, error);
      }
    }

    const octokit = new Octokit({
      auth: accessToken,
    });
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    
    const contentString = content || "";
    const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: normalizedPath,
      message,
      content: contentBase64,
      branch,
      ...(fileSha ? { sha: fileSha } : {}),
    });
    console.log(`[GitCommitPanel] ${fileSha ? "Updated" : "Created"} file: ${path}`);
  };

  const commitFileForGitee = async (
    gitClient: any,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string
  ): Promise<void> => {
    console.log(`[GitCommitPanel] Gitee commit: owner=${owner}, repo=${repo}, path=${path}, branch=${branch}`);
    
    try {
      const repoInfo = await gitClient.Repo.get({ owner, repo });
      console.log(`[GitCommitPanel] Repository found:`, repoInfo?.data?.name);
    } catch (repoError: any) {
      const repoStatus = repoError?.response?.status || repoError?.status;
      const repoErrorMessage = extractErrorMessage(repoError);
      console.error(`[GitCommitPanel] Repository check failed (${repoStatus}):`, repoErrorMessage);
      if (repoStatus === 404) {
        throw new Error(`Repository "${owner}/${repo}" not found or access denied. Please check the repository name and your permissions.`);
      }
      throw new Error(`Failed to access repository: ${repoErrorMessage}`);
    }

    try {
      const branchInfo = await gitClient.Branch.get({ owner, repo, branch });
      console.log(`[GitCommitPanel] Branch "${branch}" found:`, branchInfo?.data?.name);
    } catch (branchError: any) {
      const branchStatus = branchError?.response?.status || branchError?.status;
      const branchErrorMessage = extractErrorMessage(branchError);
      console.error(`[GitCommitPanel] Branch check failed (${branchStatus}):`, branchErrorMessage);
      if (branchStatus === 404) {
        throw new Error(`Branch "${branch}" not found in repository "${owner}/${repo}". Please check the branch name.`);
      }
      console.warn(`[GitCommitPanel] Branch check failed, but continuing:`, branchErrorMessage);
    }
    
    let fileExists = false;
    let fileSha: string | null = null;

    try {
      const pathInfo = await gitClient.File.get({
        owner,
        repo,
        path,
      });
      fileSha = pathInfo?.data?.sha || pathInfo?.sha || null;
      fileExists = !!fileSha;
      console.log(`[GitCommitPanel] File ${fileExists ? "exists" : "not found"}, SHA: ${fileSha}`);
    } catch (error: any) {
      const status = error?.response?.status || error?.status;
      console.log(`[GitCommitPanel] File.get failed with status ${status}:`, error);
      if (status !== 404) {
        console.warn(`[GitCommitPanel] Failed to get file info for ${path}, will try to create:`, error);
      }
    }

    if (fileExists && fileSha) {
      try {
        console.log(`[GitCommitPanel] Updating file with SHA: ${fileSha}`);
        await gitClient.File.update({
          owner,
          repo,
          path,
          content,
          message,
          branch,
          sha: fileSha,
        });
        console.log(`[GitCommitPanel] Updated file: ${path}`);
      } catch (updateError: any) {
        const status = updateError?.response?.status || updateError?.status;
        const errorMessage = extractErrorMessage(updateError);
        console.error(`[GitCommitPanel] Update failed (${status}):`, errorMessage);
        
        if (status === 404) {
          if (errorMessage.includes("Not Found") || errorMessage.includes("不存在") || errorMessage.includes("不存在")) {
            throw new Error(`Branch "${branch}" not found. Please check the branch name.`);
          }
        }
        throw new Error(`Failed to update file: ${errorMessage}`);
      }
    } else {
      try {
        console.log(`[GitCommitPanel] Creating new file on branch: ${branch}`);
        await gitClient.File.add({
          owner,
          repo,
          path,
          content,
          message,
          branch,
        });
        console.log(`[GitCommitPanel] Created file: ${path}`);
      } catch (addError: any) {
        const status = addError?.response?.status || addError?.status;
        const errorMessage = extractErrorMessage(addError);
        console.error(`[GitCommitPanel] Add failed (${status}):`, errorMessage, addError);
        
        if (status === 404) {
          const lowerMessage = errorMessage.toLowerCase();
          if (lowerMessage.includes("not found") || lowerMessage.includes("不存在") || lowerMessage.includes("project")) {
            throw new Error(`Branch "${branch}" not found or repository access denied. Please check the branch name and your permissions. Original error: ${errorMessage}`);
          }
          throw new Error(`Failed to create file (404): ${errorMessage || "Not Found"}`);
        }
        throw new Error(`Failed to create file: ${errorMessage}`);
      }
    }
  };

  const commitFileForGitCode = async (
    gitClient: any,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string
  ): Promise<void> => {
    let fileExists = false;
    let fileSha: string | null = null;

    try {
      const pathInfo = await gitClient.File.get({
        owner,
        repo,
        path,
      });
      fileSha = pathInfo?.data?.sha || pathInfo?.sha || null;
      fileExists = !!fileSha;
    } catch (error: any) {
      const status = error?.response?.status || error?.status;
      if (status !== 404) {
        console.warn(`[GitCommitPanel] Failed to get file info for ${path}, will try to create:`, error);
      }
    }

    if (fileExists && fileSha) {
      try {
        await gitClient.File.update({
          owner,
          repo,
          path,
          content,
          message,
          branch,
          sha: fileSha,
        });
        console.log(`[GitCommitPanel] Updated file: ${path}`);
      } catch (updateError: any) {
        const status = updateError?.response?.status || updateError?.status;
        if (status === 404) {
          console.log(`[GitCommitPanel] File not found, creating instead: ${path}`);
          await gitClient.File.add({
            owner,
            repo,
            path,
            content,
            message,
            branch,
          });
          console.log(`[GitCommitPanel] Created file: ${path}`);
        } else {
          const errorMessage = extractErrorMessage(updateError);
          throw new Error(`Failed to update file: ${errorMessage}`);
        }
      }
    } else {
      await gitClient.File.add({
        owner,
        repo,
        path,
        content,
        message,
        branch,
      });
      console.log(`[GitCommitPanel] Created file: ${path}`);
    }
  };

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

      const branchToUse = branch.trim() || "main";
      if (!branchToUse) {
        throw new Error("Branch name cannot be empty");
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
              branch: branchToUse,
            });
            console.log(`[GitCommitPanel] Deleted file: ${path}`);
          } else if (file.operation === "add") {
            if (space.platform === "github") {
              await commitFileForGitHub(
                gitClient,
                accessToken,
                space.owner,
                space.repo,
                path,
                file.content || "",
                commitMessage,
                branchToUse
              );
            } else if (space.platform === "gitee") {
              await commitFileForGitee(
                gitClient,
                space.owner,
                space.repo,
                path,
                file.content || "",
                commitMessage,
                branchToUse
              );
            } else if (space.platform === "gitcode") {
              await commitFileForGitCode(
                gitClient,
                space.owner,
                space.repo,
                path,
                file.content || "",
                commitMessage,
                branchToUse
              );
            }
          } else {
            if (space.platform === "github") {
              await commitFileForGitHub(
                gitClient,
                accessToken,
                space.owner,
                space.repo,
                path,
                file.content || "",
                commitMessage,
                branchToUse
              );
            } else if (space.platform === "gitee") {
              await commitFileForGitee(
                gitClient,
                space.owner,
                space.repo,
                path,
                file.content || "",
                commitMessage,
                branchToUse
              );
            } else if (space.platform === "gitcode") {
              await commitFileForGitCode(
                gitClient,
                space.owner,
                space.repo,
                path,
                file.content || "",
                commitMessage,
                branchToUse
              );
            }
          }
        } catch (fileError: any) {
          console.error(`[GitCommitPanel] Failed to commit file ${path}:`, fileError);
          const status = fileError?.response?.status || fileError?.status;
          const statusText = fileError?.response?.statusText || fileError?.statusText;
          const errorData = fileError?.response?.data;
          const errorMessage = errorData?.message || fileError?.message || String(fileError);
          throw new Error(`Failed to commit ${path} (${status || "unknown"}): ${errorMessage}`);
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

