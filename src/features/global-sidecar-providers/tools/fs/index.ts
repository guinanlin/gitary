import type { Tool } from "@agent-labs/agent-chat";
import {
  ProviderSource,
  isProbablyBinary,
  shouldIgnorePath,
} from "@/services/search/provider-source";
import { spaceHelper } from "@/helpers/space.helper";
import { FileType } from "@/toolkit/vscode/file-system";

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

  if (!spaceId) {
    throw new Error(
      "fs_* 工具需要空间信息。请在调用时提供 spaceId 或 uri。如果 Context 中有 current_space_id，请使用它。"
    );
  }

  const effectivePath = path && path.length ? path : "/";
  return { spaceId, path: effectivePath };
}

export const fsReaddirTool: Tool<FsCommonArgs, FsDirResult> = {
  name: "fs_readdir",
  description:
    "列出指定空间路径下的目录内容。对应 Node.js fs.readdir（只读）。请优先使用 context 中的 current_space_id 作为 spaceId。",
  parameters: {
    type: "object",
    properties: {
      uri: {
        type: "string",
        description:
          "完整空间 URI，例如 \"space://<spaceId>/path/to/dir\"。若提供，则可省略 spaceId 和 path。",
      },
      spaceId: {
        type: "string",
        description:
          "空间 ID。若未提供 uri 时，必须提供 spaceId + path。",
      },
      path: {
        type: "string",
        description:
          "空间内路径，例如 \"/\"、\"src\" 或 \"src/components\"。默认值为 \"/\"。",
      },
    },
    required: [],
    additionalProperties: false,
  },
  async execute(args: FsCommonArgs): Promise<FsDirResult> {
    const startTime = Date.now();
    try {
      console.log("[fs_readdir] 开始执行，参数:", args);
      const { spaceId, path } = resolveTarget(args);
      console.log("[fs_readdir] 解析后的目标:", { spaceId, path });
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`fs_readdir 超时: 在 ${path} 上读取目录超时（10秒）`));
        }, 10000)
      );

      const readDirectoryPromise = reader.readDirectory(spaceId, path);
      
      const entries = await Promise.race([readDirectoryPromise, timeoutPromise]);
      console.log("[fs_readdir] 读取到的原始条目数:", entries.length);
      
      const mapped = entries
        .map(([name, type]) => {
          const fullPath = path === "/" ? name : `${path}/${name}`;
          if (shouldIgnorePath(fullPath)) {
            console.log("[fs_readdir] 忽略路径:", fullPath);
            return null;
          }
          let kind: "file" | "directory" | "other" = "other";
          if (type === FileType.File) kind = "file";
          else if (type === FileType.Directory) kind = "directory";
          return { name, type: kind };
        })
        .filter(Boolean) as {
          name: string;
          type: "file" | "directory" | "other";
        }[];

      const elapsed = Date.now() - startTime;
      console.log("[fs_readdir] 过滤后的条目数:", mapped.length);
      console.log(`[fs_readdir] 成功完成，耗时 ${elapsed}ms`);
      console.log("[fs_readdir] 返回结果:", { kind: "directory", path, entries: mapped });

      return {
        kind: "directory",
        path,
        entries: mapped,
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "未知错误";
      console.error(`[fs_readdir] 执行错误（耗时 ${elapsed}ms）:`, error);
      console.error("[fs_readdir] 错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
      throw new Error(`fs_readdir 执行失败: ${errorMessage}`);
    }
  },
};

export const fsReadFileTool: Tool<FsReadFileArgs, FsFileResult> = {
  name: "fs_readFile",
  description:
    "读取指定空间中文件的文本内容。对应 Node.js fs.readFile（只读）。请优先使用 context 中的 current_space_id 作为 spaceId。",
  parameters: {
    type: "object",
    properties: {
      uri: {
        type: "string",
        description:
          "完整空间 URI，例如 \"space://<spaceId>/path/to/file.md\"。若提供，则可省略 spaceId 和 path。",
      },
      spaceId: {
        type: "string",
        description:
          "空间 ID。若未提供 uri 时，必须提供 spaceId + path。",
      },
      path: {
        type: "string",
        description:
          "空间内文件路径，例如 \"README.md\" 或 \"src/index.ts\"。",
      },
      maxBytes: {
        type: "number",
        description:
          "读取文件时最多返回的字符数，默认约 8000 字符。避免返回过长内容。",
      },
    },
    required: [],
    additionalProperties: false,
  },
  async execute(args: FsReadFileArgs): Promise<FsFileResult> {
    const { spaceId, path } = resolveTarget(args);

    if (!path || path === "/") {
      throw new Error(
        "fs_readFile 需要提供具体文件路径 path，而不是目录。"
      );
    }

    if (isProbablyBinary(path)) {
      const stat = reader.stat ? await reader.stat(spaceId, path) : {};
      return {
        kind: "binary",
        path,
        note: "目标看起来是二进制文件，跳过内容读取。",
        size: stat?.size,
      };
    }

    const bytes = await reader.readFile(spaceId, path);
    const text = new TextDecoder().decode(bytes);
    const limit =
      typeof args.maxBytes === "number" && args.maxBytes > 0
        ? args.maxBytes
        : 8_000;

    let content = text;
    let truncated = false;
    if (text.length > limit) {
      content = text.slice(0, limit);
      truncated = true;
    }

    return {
      kind: "file",
      path,
      content,
      truncated,
    };
  },
};

export const fsStatTool: Tool<FsCommonArgs, FsStatResult> = {
  name: "fs_stat",
  description:
    "获取指定空间路径的文件或目录信息（size、mtime 等）。对应 Node.js fs.stat（只读）。请优先使用 context 中的 current_space_id 作为 spaceId。",
  parameters: {
    type: "object",
    properties: {
      uri: {
        type: "string",
        description:
          "完整空间 URI，例如 \"space://<spaceId>/path/to/target\"。若提供，则可省略 spaceId 和 path。",
      },
      spaceId: {
        type: "string",
        description:
          "空间 ID。若未提供 uri 时，必须提供 spaceId + path。",
      },
      path: {
        type: "string",
        description:
          "空间内路径，例如 \"README.md\" 或 \"src\"。默认值为 \"/\"。",
      },
    },
    required: [],
    additionalProperties: false,
  },
  async execute(args: FsCommonArgs): Promise<FsStatResult> {
    const { spaceId, path } = resolveTarget(args);
    if (!reader.stat) {
      return { kind: "stat", path };
    }
    const s = await reader.stat(spaceId, path);
    return {
      kind: "stat",
      path,
      size: s.size,
      mtime: s.mtime,
    };
  },
};
