import { tool } from 'ai';
import { z } from 'zod';
import {
  ProviderSource,
  isProbablyBinary,
  shouldIgnorePath,
} from "@/services/search/provider-source";
import { spaceHelper } from "@/helpers/space.helper";
import { FileType } from "@/toolkit/vscode/file-system";
import { aiContextService } from "@/services/ai/context-service";
import { folderTreeService } from "@/services/folder-tree.service";
import { spaceService } from "@/services/space.service";

const reader = new ProviderSource();

type FsCommonArgs = {
  /**
   * 完整空间 URI，例如 "space://<spaceId>/path/to/file.md"。
   * 若提供 uri，则可省略 spaceId/path。
   */
  uri?: string;
  /**
   * 空间 ID，必填（除非提供了 uri）。
   */
  spaceId?: string;
  /**
   * 空间内路径，例如 "README.md" 或 "src/index.ts"。
   * 对于目录，path 可以为 "/" 或空字符串。
   */
  path?: string;
};

type FsReadFileArgs = FsCommonArgs & {
  /**
   * 读取文件时最多返回的字符数，防止一次返回过长内容。
   * 默认约 8000 字符。
   */
  maxBytes?: number;
};

type FsFileResult =
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

type FsDirResult = {
  kind: "directory";
  path: string;
  entries: { name: string; type: "file" | "directory" | "other" }[];
};

type FsStatResult = {
  kind: "stat";
  path: string;
  size?: number;
  mtime?: number;
};

function resolveTarget(args: FsCommonArgs): { spaceId: string; path: string } {
  let spaceId = args.spaceId;
  let path = args.path;

  if (args.uri) {
    spaceId = spaceHelper.getSpaceIdFromUri(args.uri);
    path = spaceHelper.getInSpacePathFromUri(args.uri);
  }

  // 如果没有提供 spaceId，尝试从多个来源获取（按推荐优先级）
  if (!spaceId) {
    // 方法1: 从 SpaceService 获取当前聚焦的 space（推荐方式）
    try {
      const focusedSpace = spaceService.getFocusedSpace();
      if (focusedSpace?.id) {
        spaceId = focusedSpace.id;
        console.log(`[fs_*] 从 spaceService.getFocusedSpace() 获取 spaceId: ${spaceId}`);
      }
    } catch (error) {
      console.warn(`[fs_*] 无法从 spaceService 获取 spaceId:`, error);
    }

    // 方法2: 从 FolderTreeService 直接获取（最简单）
    if (!spaceId) {
      try {
        const currentViewId = folderTreeService.getCurrentViewId();
        if (currentViewId) {
          spaceId = currentViewId;
          console.log(`[fs_*] 从 folderTreeService.getCurrentViewId() 获取 spaceId: ${spaceId}`);
        }
      } catch (error) {
        console.warn(`[fs_*] 无法从 folderTreeService 获取 spaceId:`, error);
      }
    }

    // 方法3: 从 URL hash 中解析 spaceId（备用方案）
    if (!spaceId) {
      try {
        const hash = window.location.hash;
        // 匹配格式: #/https://gitee.com/dty2025/dty-doc
        const match = hash.match(/\/https:\/\/([^.]+)\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const [, platform, owner, repo] = match;
          spaceId = spaceHelper.generateSpaceId(platform, owner, repo);
          console.log(`[fs_*] 从 URL hash 解析 spaceId: ${spaceId} (platform: ${platform}, owner: ${owner}, repo: ${repo})`);
        }
      } catch (error) {
        console.warn(`[fs_*] 无法从 URL hash 解析 spaceId:`, error);
      }
    }
  }

  if (!spaceId) {
    throw new Error(
      "fs_* 工具需要空间信息。请在调用时提供 spaceId 或 uri，或者确保当前页面在某个空间中。"
    );
  }

  const effectivePath = path && path.length ? path : "/";
  return { spaceId, path: effectivePath };
}

export const fsReaddirTool = tool({
  description: "列出指定空间路径下的目录内容。对应 Node.js fs.readdir（只读）。",
  inputSchema: z.object({
    uri: z.string().optional().describe(
      "完整空间 URI，例如 \"space://<spaceId>/path/to/dir\"。若提供，则可省略 spaceId 和 path。"
    ),
    spaceId: z.string().optional().describe(
      "空间 ID。若未提供 uri 时，必须提供 spaceId + path。"
    ),
    path: z.string().optional().describe(
      "空间内路径，例如 \"/\"、\"src\" 或 \"src/components\"。默认值为 \"/\"。"
    ),
  }),
  execute: async ({ uri, spaceId, path }: {
    uri?: string;
    spaceId?: string;
    path?: string;
  }): Promise<FsDirResult> => {
    const callId = `fs_readdir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[fs_readdir] [${callId}] execute 开始，uri: ${uri}, spaceId: ${spaceId}, path: ${path}`);

    try {
      const resolved = resolveTarget({ uri, spaceId, path });
      const resolvedSpaceId = resolved.spaceId;
      const resolvedPath = resolved.path;
      console.log(`[fs_readdir] [${callId}] resolveTarget 成功: spaceId=${resolvedSpaceId}, path=${resolvedPath}`);

      const startTime = Date.now();
      const entries = await reader.readDirectory(resolvedSpaceId, resolvedPath);
      const elapsed = Date.now() - startTime;
      console.log(`[fs_readdir] [${callId}] readDirectory 成功，条目数: ${entries.length}，耗时: ${elapsed}ms`);

      const mapped = entries
        .map(([name, type]) => {
          const fullPath = resolvedPath === "/" ? name : `${resolvedPath}/${name}`;
          if (shouldIgnorePath(fullPath)) return null;
          let kind: "file" | "directory" | "other" = "other";
          if (type === FileType.File) kind = "file";
          else if (type === FileType.Directory) kind = "directory";
          return { name, type: kind };
        })
        .filter(Boolean) as {
          name: string;
          type: "file" | "directory" | "other";
        }[];

      const result = {
        kind: "directory" as const,
        path: resolvedPath,
        entries: mapped,
      };

      console.log(`[fs_readdir] [${callId}] execute 完成，返回 ${mapped.length} 个条目`);
      return result;
    } catch (error) {
      console.error(`[fs_readdir] [${callId}] execute 错误:`, error);
      throw error;
    }
  },
});

export const fsReadFileTool = tool({
  description: "读取指定空间中文件的文本内容。对应 Node.js fs.readFile（只读）。",
  inputSchema: z.object({
    uri: z.string().optional().describe(
      "完整空间 URI，例如 \"space://<spaceId>/path/to/file.md\"。若提供，则可省略 spaceId 和 path。"
    ),
    spaceId: z.string().optional().describe(
      "空间 ID。若未提供 uri 时，必须提供 spaceId + path。"
    ),
    path: z.string().optional().describe(
      "空间内文件路径，例如 \"README.md\" 或 \"src/index.ts\"。"
    ),
    maxBytes: z.number().optional().describe(
      "读取文件时最多返回的字符数，默认约 8000 字符。避免返回过长内容。"
    ),
  }),
  execute: async ({ uri, spaceId, path, maxBytes }: {
    uri?: string;
    spaceId?: string;
    path?: string;
    maxBytes?: number;
  }): Promise<FsFileResult> => {
    const callId = `fs_readFile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[fs_readFile] [${callId}] execute 开始，uri: ${uri}, spaceId: ${spaceId}, path: ${path}, maxBytes: ${maxBytes}`);

    try {
      const resolved = resolveTarget({ uri, spaceId, path });
      const resolvedSpaceId = resolved.spaceId;
      const resolvedPath = resolved.path;
      console.log(`[fs_readFile] [${callId}] resolveTarget 成功: spaceId=${resolvedSpaceId}, path=${resolvedPath}`);

      if (!resolvedPath || resolvedPath === "/") {
        const error = new Error(
          "fs_readFile 需要提供具体文件路径 path，而不是目录。"
        );
        console.error(`[fs_readFile] [${callId}] execute 错误:`, error);
        throw error;
      }

      if (isProbablyBinary(resolvedPath)) {
        console.log(`[fs_readFile] [${callId}] 检测到二进制文件: ${resolvedPath}`);
        const stat = reader.stat ? await reader.stat(resolvedSpaceId, resolvedPath) : {};
        const result = {
          kind: "binary" as const,
          path: resolvedPath,
          note: "目标看起来是二进制文件，跳过内容读取。",
          size: stat?.size,
        };
        console.log(`[fs_readFile] [${callId}] execute 完成，返回二进制文件信息`);
        return result;
      }

      const startTime = Date.now();
      const bytes = await reader.readFile(resolvedSpaceId, resolvedPath);
      const elapsed = Date.now() - startTime;
      console.log(`[fs_readFile] [${callId}] readFile 成功，文件大小: ${bytes.length} 字节，耗时: ${elapsed}ms`);

      const text = new TextDecoder().decode(bytes);
      const limit =
        typeof maxBytes === "number" && maxBytes > 0
          ? maxBytes
          : 8_000;

      let content = text;
      let truncated = false;
      if (text.length > limit) {
        content = text.slice(0, limit);
        truncated = true;
        console.log(`[fs_readFile] [${callId}] 内容已截断: ${text.length} -> ${limit} 字符`);
      }

      const result = {
        kind: "file" as const,
        path: resolvedPath,
        content,
        truncated,
      };

      console.log(`[fs_readFile] [${callId}] execute 完成，返回文件内容 (${content.length} 字符, truncated: ${truncated})`);
      return result;
    } catch (error) {
      console.error(`[fs_readFile] [${callId}] execute 错误:`, error);
      throw error;
    }
  },
});

export const fsStatTool = tool({
  description: "获取指定空间路径的文件或目录信息（size、mtime 等）。对应 Node.js fs.stat（只读）。",
  inputSchema: z.object({
    uri: z.string().optional().describe(
      "完整空间 URI，例如 \"space://<spaceId>/path/to/target\"。若提供，则可省略 spaceId 和 path。"
    ),
    spaceId: z.string().optional().describe(
      "空间 ID。若未提供 uri 时，必须提供 spaceId + path。"
    ),
    path: z.string().optional().describe(
      "空间内路径，例如 \"README.md\" 或 \"src\"。默认值为 \"/\"。"
    ),
  }),
  execute: async ({ uri, spaceId, path }: {
    uri?: string;
    spaceId?: string;
    path?: string;
  }): Promise<FsStatResult> => {
    const callId = `fs_stat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[fs_stat] [${callId}] execute 开始，uri: ${uri}, spaceId: ${spaceId}, path: ${path}`);

    try {
      const resolved = resolveTarget({ uri, spaceId, path });
      const resolvedSpaceId = resolved.spaceId;
      const resolvedPath = resolved.path;
      console.log(`[fs_stat] [${callId}] resolveTarget 成功: spaceId=${resolvedSpaceId}, path=${resolvedPath}`);

      if (!reader.stat) {
        console.log(`[fs_stat] [${callId}] reader.stat 不可用，返回基本信息`);
        const result = { kind: "stat" as const, path: resolvedPath };
        console.log(`[fs_stat] [${callId}] execute 完成`);
        return result;
      }

      const startTime = Date.now();
      const s = await reader.stat(resolvedSpaceId, resolvedPath);
      const elapsed = Date.now() - startTime;
      console.log(`[fs_stat] [${callId}] stat 成功，耗时: ${elapsed}ms`);

      const result = {
        kind: "stat" as const,
        path: resolvedPath,
        size: s.size,
        mtime: s.mtime,
      };

      console.log(`[fs_stat] [${callId}] execute 完成，size: ${s.size}, mtime: ${s.mtime}`);
      return result;
    } catch (error) {
      console.error(`[fs_stat] [${callId}] execute 错误:`, error);
      throw error;
    }
  },
});
