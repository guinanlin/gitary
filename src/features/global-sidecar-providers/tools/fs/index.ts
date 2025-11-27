import type { Tool } from "@agent-labs/agent-chat";
import {
  ProviderSource,
  isProbablyBinary,
  shouldIgnorePath,
} from "@/services/search/provider-source";
import { spaceHelper } from "@/helpers/space.helper";
import { FileType } from "@/toolkit/vscode/file-system";
import { aiContextService } from "@/services/ai/context-service";

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

async function resolveTarget(args: FsCommonArgs): Promise<{ spaceId: string; path: string }> {
  console.log("[fs tools] resolveTarget called with args:", args);
  let spaceId = args.spaceId;
  let path = args.path;

  if (args.uri) {
    console.log("[fs tools] URI provided, extracting spaceId and path");
    spaceId = spaceHelper.getSpaceIdFromUri(args.uri);
    path = spaceHelper.getInSpacePathFromUri(args.uri);
    console.log("[fs tools] Extracted from URI - spaceId:", spaceId, "path:", path);
  }

  if (!spaceId) {
    console.log("[fs tools] No spaceId provided, trying to get from context");
    try {
      const pageContext = await aiContextService.getCurrentPageContext();
      console.log("[fs tools] Page context:", pageContext);
      if (pageContext?.uri) {
        const extractedSpaceId = spaceHelper.getSpaceIdFromUri(pageContext.uri);
        console.log("[fs tools] Extracted spaceId from context:", extractedSpaceId);
        if (extractedSpaceId) {
          spaceId = extractedSpaceId;
          if (!path) {
            path = spaceHelper.getInSpacePathFromUri(pageContext.uri);
            console.log("[fs tools] Extracted path from context:", path);
          }
        }
      }
    } catch (error) {
      console.warn("[fs tools] Failed to get current space from context:", error);
    }
  }

  if (!spaceId) {
    const error = new Error(
      "fs_* 工具需要空间信息。请在调用时提供 spaceId 或 uri，或者确保当前页面有打开的空间。"
    );
    console.error("[fs tools] No spaceId found, throwing error:", error);
    throw error;
  }

  const effectivePath = path && path.length ? path : "/";
  const result = { spaceId, path: effectivePath };
  console.log("[fs tools] resolveTarget resolved to:", result);
  return result;
}

export const fsReaddirTool: Tool<FsCommonArgs, FsDirResult> = {
  name: "fs_readdir",
  description:
    "列出指定空间路径下的目录内容。对应 Node.js fs.readdir（只读）。如果 context 中提供了 current_space_id，可以使用它作为默认的 spaceId。",
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
          "空间 ID。若未提供 uri 时，必须提供 spaceId + path。如果 context 中有 current_space_id，可以使用它。",
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
    console.log("[fs_readdir] Starting execution with args:", args);
    const startTime = Date.now();
    try {
      const { spaceId, path } = await resolveTarget(args);
      console.log("[fs_readdir] Resolved target - spaceId:", spaceId, "path:", path);
      
      const readDirectoryPromise = reader.readDirectory(spaceId, path);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`读取目录超时：操作超过 30 秒未完成。空间：${spaceId}，路径：${path}`));
        }, 30000);
      });
      
      const entries = await Promise.race([readDirectoryPromise, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      console.log(`[fs_readdir] Read directory successful, entries count: ${entries.length}, elapsed: ${elapsed}ms`);
      
      const mapped = entries
        .map(([name, type]) => {
          const fullPath = path === "/" ? name : `${path}/${name}`;
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
        path,
        entries: mapped,
      };
      const totalElapsed = Date.now() - startTime;
      console.log(`[fs_readdir] Execution successful, returning result. Total elapsed: ${totalElapsed}ms`);
      console.log("[fs_readdir] Result summary:", {
        kind: result.kind,
        path: result.path,
        entriesCount: result.entries.length,
        entries: result.entries.map(e => `${e.name} (${e.type})`),
      });
      return result;
    } catch (error) {
      console.error("[fs_readdir] Execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[fs_readdir] Error message:", errorMessage);
      console.error("[fs_readdir] Error stack:", errorStack);
      
      if (errorMessage.includes("No provider registered")) {
        const enhancedError = new Error(
          `无法读取目录：文件系统提供者未注册。请确保空间 ${args.spaceId || "未知"} 已正确加载。错误详情：${errorMessage}`
        );
        console.error("[fs_readdir] Enhanced error (No provider):", enhancedError);
        throw enhancedError;
      }
      if (errorMessage.includes("Invalid space ID")) {
        const enhancedError = new Error(
          `无法读取目录：无效的空间 ID。请检查 spaceId 参数是否正确。错误详情：${errorMessage}`
        );
        console.error("[fs_readdir] Enhanced error (Invalid space ID):", enhancedError);
        throw enhancedError;
      }
      if (errorMessage.includes("需要空间信息")) {
        const enhancedError = new Error(
          `${errorMessage} 提示：如果当前有打开的空间，可以在工具调用时使用 context 中的 current_space_id，或者明确提供 spaceId 或 uri 参数。`
        );
        console.error("[fs_readdir] Enhanced error (Missing space info):", enhancedError);
        throw enhancedError;
      }
      const enhancedError = new Error(
        `读取目录失败：${errorMessage}。路径：${args.path || "/"}，空间：${args.spaceId || "未提供"}`
      );
      console.error("[fs_readdir] Enhanced error (Generic):", enhancedError);
      throw enhancedError;
    }
  },
};

export const fsReadFileTool: Tool<FsReadFileArgs, FsFileResult> = {
  name: "fs_readFile",
  description:
    "读取指定空间中文件的文本内容。对应 Node.js fs.readFile（只读）。如果 context 中提供了 current_space_id，可以使用它作为默认的 spaceId。",
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
          "空间 ID。若未提供 uri 时，必须提供 spaceId + path。如果 context 中有 current_space_id，可以使用它。",
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
    try {
      const { spaceId, path } = await resolveTarget(args);

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("No provider registered")) {
        throw new Error(
          `无法读取文件：文件系统提供者未注册。请确保空间 ${args.spaceId || "未知"} 已正确加载。错误详情：${errorMessage}`
        );
      }
      if (errorMessage.includes("Invalid space ID")) {
        throw new Error(
          `无法读取文件：无效的空间 ID。请检查 spaceId 参数是否正确。错误详情：${errorMessage}`
        );
      }
      if (errorMessage.includes("需要空间信息")) {
        throw new Error(
          `${errorMessage} 提示：如果当前有打开的空间，可以在工具调用时使用 context 中的 current_space_id，或者明确提供 spaceId 或 uri 参数。`
        );
      }
      if (errorMessage.includes("需要提供具体文件路径")) {
        throw error;
      }
      throw new Error(
        `读取文件失败：${errorMessage}。路径：${args.path || "未提供"}，空间：${args.spaceId || "未提供"}`
      );
    }
  },
};

export const fsStatTool: Tool<FsCommonArgs, FsStatResult> = {
  name: "fs_stat",
  description:
    "获取指定空间路径的文件或目录信息（size、mtime 等）。对应 Node.js fs.stat（只读）。",
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
    try {
      const { spaceId, path } = await resolveTarget(args);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("No provider registered")) {
        throw new Error(
          `无法获取文件信息：文件系统提供者未注册。请确保空间 ${args.spaceId || "未知"} 已正确加载。错误详情：${errorMessage}`
        );
      }
      if (errorMessage.includes("Invalid space ID")) {
        throw new Error(
          `无法获取文件信息：无效的空间 ID。请检查 spaceId 参数是否正确。错误详情：${errorMessage}`
        );
      }
      if (errorMessage.includes("需要空间信息")) {
        throw new Error(
          `${errorMessage} 提示：如果当前有打开的空间，工具会自动使用当前空间，或者明确提供 spaceId 或 uri 参数。`
        );
      }
      throw new Error(
        `获取文件信息失败：${errorMessage}。路径：${args.path || "/"}，空间：${args.spaceId || "未提供"}`
      );
    }
  },
};
