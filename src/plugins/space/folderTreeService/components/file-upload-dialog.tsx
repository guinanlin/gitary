import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/toolkit/utils/shadcn-utils";
import { Upload, X, File as FileIcon } from "lucide-react";
import { FolderTreeNode } from "@/plugins/space/folderTreeService/types";
import { joinPath } from "@/toolkit/utils/path";
import { fs } from "xbook/services";
import { spaceHelper } from "@/helpers/space.helper";
import { TreeServicePoints } from "@/plugins/space/folderTreeService/tokens";
import xbook from "xbook/index";

interface FileUploadItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNode: FolderTreeNode;
  spaceId: string;
  serviceBus: any;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  targetNode,
  spaceId,
  serviceBus,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteHandlerRef = useRef<((e: ClipboardEvent) => void) | null>(null);

  useEffect(() => {
    if (open) {
      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const fileItems: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              fileItems.push(file);
            }
          }
        }

        if (fileItems.length > 0) {
          e.preventDefault();
          addFiles(fileItems);
        }
      };

      pasteHandlerRef.current = handlePaste;
      document.addEventListener("paste", handlePaste);
      return () => {
        if (pasteHandlerRef.current) {
          document.removeEventListener("paste", pasteHandlerRef.current);
        }
      };
    }
  }, [open]);

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileUploadItem[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ${t("tree.fileTooLarge")}`);
        return;
      }

      if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) {
        return;
      }

      validFiles.push({
        file,
        status: "pending",
      });
    });

    if (errors.length > 0) {
      errors.forEach((error) => {
        xbook.notificationService.error(error);
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  }, [files, t]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [addFiles]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }, []);

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) {
      xbook.notificationService.warning(t("tree.noFilesSelected"));
      return;
    }

    setIsUploading(true);
    const treeService = serviceBus.createProxy(TreeServicePoints.TreeService);
    const parentNodeId = targetNode.id;

    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    const uploadResults: Array<{ success: boolean; error?: string }> = [];

    const uploadPromises = pendingFiles.map(async (fileItem, pendingIndex) => {
      const originalIndex = files.findIndex(
        (f) => f.file === fileItem.file
      );

      setFiles((prev) => {
        const newFiles = [...prev];
        if (newFiles[originalIndex]) {
          newFiles[originalIndex] = { ...newFiles[originalIndex], status: "uploading" };
        }
        return newFiles;
      });

      try {
        const targetPath = joinPath(targetNode.path || "/", fileItem.file.name);
        const uri = spaceHelper.getUri(spaceId, targetPath);

        console.log(`[FileUpload] Uploading file:`, {
          targetNode: {
            id: targetNode.id,
            path: targetNode.path,
            name: targetNode.name,
            type: targetNode.type,
          },
          fileName: fileItem.file.name,
          targetPath,
          uri: uri.toString(),
          spaceId,
        });

        const arrayBuffer = await fileItem.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        await fs.writeFile(uri, bytes, {
          create: true,
          overwrite: false,
        });

        console.log(`[FileUpload] File uploaded successfully: ${targetPath}`);

        uploadResults[pendingIndex] = { success: true };

        setFiles((prev) => {
          const newFiles = [...prev];
          if (newFiles[originalIndex]) {
            newFiles[originalIndex] = { ...newFiles[originalIndex], status: "success" };
          }
          return newFiles;
        });
      } catch (error: any) {
        console.error(`[FileUpload] Failed to upload file ${fileItem.file.name}:`, error);
        
        const errorMessage = 
          error?.response?.data?.message || 
          error?.message || 
          String(error);
        
        uploadResults[pendingIndex] = { success: false, error: errorMessage };

        setFiles((prev) => {
          const newFiles = [...prev];
          if (newFiles[originalIndex]) {
            newFiles[originalIndex] = {
              ...newFiles[originalIndex],
              status: "error",
              error: errorMessage,
            };
          }
          return newFiles;
        });
        
        xbook.notificationService.error(
          `${fileItem.file.name}: ${t("tree.uploadFailed")} - ${errorMessage}`
        );
      }
    });

    await Promise.all(uploadPromises);

    setIsUploading(false);

    const hasErrors = uploadResults.some((r) => !r.success);
    if (!hasErrors) {
      await treeService.deepRefresh(parentNodeId);
      xbook.notificationService.success(t("tree.uploadSuccess"));
      onSuccess?.();
      onOpenChange(false);
      setFiles([]);
    }
  }, [files, targetNode, spaceId, serviceBus, t, onSuccess, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      setFiles([]);
      onOpenChange(false);
    }
  }, [isUploading, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("tree.uploadFileTitle")}</DialogTitle>
          <DialogDescription>{t("tree.dragFilesHere")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {t("tree.dragFilesHere")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("tree.selectFile")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("tree.filesToUpload")}</p>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      {fileItem.status === "uploading" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("tree.uploading")}
                        </p>
                      )}
                      {fileItem.status === "error" && fileItem.error && (
                        <p className="text-xs text-destructive mt-1">
                          {fileItem.error}
                        </p>
                      )}
                      {fileItem.status === "success" && (
                        <p className="text-xs text-green-600 mt-1">
                          {t("tree.uploadSuccess")}
                        </p>
                      )}
                    </div>
                    {fileItem.status === "pending" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading
              ? t("tree.uploading")
              : files.length > 0
              ? `${t("tree.uploadFile")} (${files.filter((f) => f.status === "pending").length})`
              : t("tree.uploadFile")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

