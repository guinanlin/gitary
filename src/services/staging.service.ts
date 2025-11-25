import { Uri } from "@/toolkit/vscode/uri";

export type StagedFileOperation = "add" | "update" | "delete";

export interface StagedFile {
  uri: string;
  path: string;
  content?: string;
  operation: StagedFileOperation;
  spaceId: string;
  timestamp: number;
}

class StagingService {
  private stagedFiles: Map<string, StagedFile[]> = new Map();

  addFile(spaceId: string, uri: Uri, content: Uint8Array, operation: StagedFileOperation = "update"): void {
    const files = this.getStagedFiles(spaceId);
    const path = uri.path;
    const uriString = uri.toString();

    const existingIndex = files.findIndex((f) => f.uri === uriString);
    const stagedFile: StagedFile = {
      uri: uriString,
      path,
      content: operation !== "delete" ? new TextDecoder().decode(content) : undefined,
      operation,
      spaceId,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      files[existingIndex] = stagedFile;
    } else {
      files.push(stagedFile);
    }

    this.stagedFiles.set(spaceId, files);
    this.notifyChange(spaceId);
  }

  removeFile(spaceId: string, uri: string): void {
    const files = this.getStagedFiles(spaceId);
    const filtered = files.filter((f) => f.uri !== uri);
    this.stagedFiles.set(spaceId, filtered);
    this.notifyChange(spaceId);
  }

  getStagedFiles(spaceId: string): StagedFile[] {
    return this.stagedFiles.get(spaceId) || [];
  }

  clearStagedFiles(spaceId: string): void {
    this.stagedFiles.delete(spaceId);
    this.notifyChange(spaceId);
  }

  hasStagedFiles(spaceId: string): boolean {
    return this.getStagedFiles(spaceId).length > 0;
  }

  getAllStagedFiles(): Map<string, StagedFile[]> {
    return new Map(this.stagedFiles);
  }

  private listeners: Map<string, Set<() => void>> = new Map();

  subscribe(spaceId: string, callback: () => void): () => void {
    if (!this.listeners.has(spaceId)) {
      this.listeners.set(spaceId, new Set());
    }
    this.listeners.get(spaceId)!.add(callback);

    return () => {
      this.listeners.get(spaceId)?.delete(callback);
    };
  }

  private notifyChange(spaceId: string): void {
    this.listeners.get(spaceId)?.forEach((callback) => callback());
  }
}

export const stagingService = new StagingService();

