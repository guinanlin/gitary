import {
  ProviderSource,
  isProbablyBinary,
  shouldIgnorePath,
} from "@/services/search/provider-source";
import { spaceHelper } from "@/helpers/space.helper";
import { FileType } from "@/toolkit/vscode/file-system";
import { folderTreeService } from "@/services/folder-tree.service";
import { spaceService } from "@/services/space.service";
import type {
  IFileSystemProvider,
  FileSystemEntry,
  FileReadResult,
  FileStatResult,
} from "@dty/ai-assistant-core";

const reader = new ProviderSource();

function resolveSpaceIdFromUri(uri?: string, spaceId?: string): string {
  if (uri) {
    return spaceHelper.getSpaceIdFromUri(uri);
  }

  if (spaceId) {
    return spaceId;
  }

  try {
    const focusedSpace = spaceService.getFocusedSpace();
    if (focusedSpace?.id) {
      return focusedSpace.id;
    }
  } catch (error) {
    console.warn(`[GitaryFileSystemProvider] 无法从 spaceService 获取 spaceId:`, error);
  }

  try {
    const currentViewId = folderTreeService.getCurrentViewId();
    if (currentViewId) {
      return currentViewId;
    }
  } catch (error) {
    console.warn(`[GitaryFileSystemProvider] 无法从 folderTreeService 获取 spaceId:`, error);
  }

  try {
    const hash = window.location.hash;
    const match = hash.match(/\/https:\/\/([^.]+)\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, platform, owner, repo] = match;
      return spaceHelper.generateSpaceId(platform, owner, repo);
    }
  } catch (error) {
    console.warn(`[GitaryFileSystemProvider] 无法从 URL hash 解析 spaceId:`, error);
  }

  throw new Error(
    "fs_* 工具需要空间信息。请在调用时提供 spaceId 或 uri，或者确保当前页面在某个空间中。"
  );
}

function resolvePathFromUri(uri?: string, path?: string): string {
  if (uri) {
    return spaceHelper.getInSpacePathFromUri(uri);
  }
  return path && path.length ? path : "/";
}

export class GitaryFileSystemProvider implements IFileSystemProvider {
  async readdir(uri?: string, spaceId?: string, path?: string): Promise<FileSystemEntry[]> {
    const resolvedSpaceId = resolveSpaceIdFromUri(uri, spaceId);
    const resolvedPath = resolvePathFromUri(uri, path);

    const entries = await reader.readDirectory(resolvedSpaceId, resolvedPath);

    return entries
      .map(([name, type]) => {
        const fullPath = resolvedPath === "/" ? name : `${resolvedPath}/${name}`;
        if (shouldIgnorePath(fullPath)) return null;
        let kind: "file" | "directory" | "other" = "other";
        if (type === FileType.File) kind = "file";
        else if (type === FileType.Directory) kind = "directory";
        return { name, type: kind };
      })
      .filter(Boolean) as FileSystemEntry[];
  }

  async readFile(uri?: string, spaceId?: string, path?: string, maxBytes?: number): Promise<FileReadResult> {
    const resolvedSpaceId = resolveSpaceIdFromUri(uri, spaceId);
    const resolvedPath = resolvePathFromUri(uri, path);

    if (!resolvedPath || resolvedPath === "/") {
      throw new Error("fs_readFile 需要提供具体文件路径 path，而不是目录。");
    }

    if (isProbablyBinary(resolvedPath)) {
      const stat = reader.stat ? await reader.stat(resolvedSpaceId, resolvedPath) : {};
      return {
        kind: "binary",
        path: resolvedPath,
        note: "目标看起来是二进制文件，跳过内容读取。",
        size: stat?.size,
      };
    }

    const bytes = await reader.readFile(resolvedSpaceId, resolvedPath);
    const text = new TextDecoder().decode(bytes);
    const limit = typeof maxBytes === "number" && maxBytes > 0 ? maxBytes : 8_000;

    let content = text;
    let truncated = false;
    if (text.length > limit) {
      content = text.slice(0, limit);
      truncated = true;
    }

    return {
      kind: "file",
      path: resolvedPath,
      content,
      truncated,
    };
  }

  async stat(uri?: string, spaceId?: string, path?: string): Promise<FileStatResult> {
    const resolvedSpaceId = resolveSpaceIdFromUri(uri, spaceId);
    const resolvedPath = resolvePathFromUri(uri, path);

    if (!reader.stat) {
      return { kind: "stat", path: resolvedPath };
    }

    const s = await reader.stat(resolvedSpaceId, resolvedPath);

    return {
      kind: "stat",
      path: resolvedPath,
      size: s.size,
      mtime: s.mtime,
    };
  }

  async resolveSpaceId(uri?: string, spaceId?: string): Promise<string> {
    return resolveSpaceIdFromUri(uri, spaceId);
  }

  async resolvePath(uri?: string, path?: string): Promise<string> {
    return resolvePathFromUri(uri, path);
  }

  isBinaryFile(path: string): boolean {
    return isProbablyBinary(path);
  }

  shouldIgnorePath(path: string): boolean {
    const parts = path.split("/");
    if (parts.some((p) => [".git", "node_modules", ".next", "dist", "build"].includes(p))) return true;
    const name = parts[parts.length - 1];
    if ([".DS_Store", "Thumbs.db"].includes(name)) return true;
    return false;
  }
}

