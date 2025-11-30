export interface FileSystemEntry {
  name: string;
  type: "file" | "directory" | "other";
}

export type FileReadResult =
  | {
      kind: "file";
      path: string;
      content: string;
      truncated: boolean;
    }
  | {
      kind: "binary";
      path: string;
      note: string;
      size?: number;
    };

export interface FileStatResult {
  kind: "stat";
  path: string;
  size?: number;
  mtime?: number;
}

export interface IFileSystemProvider {
  readdir(uri?: string, spaceId?: string, path?: string): Promise<FileSystemEntry[]>;
  readFile(uri?: string, spaceId?: string, path?: string, maxBytes?: number): Promise<FileReadResult>;
  stat(uri?: string, spaceId?: string, path?: string): Promise<FileStatResult>;
  resolveSpaceId(uri?: string, spaceId?: string): Promise<string>;
  resolvePath(uri?: string, path?: string): Promise<string>;
  isBinaryFile(path: string): boolean;
  shouldIgnorePath(path: string): boolean;
}

