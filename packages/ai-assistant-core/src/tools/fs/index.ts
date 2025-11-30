import { tool } from 'ai';
import { z } from 'zod';
import { generateText } from 'ai';
import type { IToolContext } from "../../interfaces/tool.interface";

async function resolveTarget(context: IToolContext, args: { uri?: string; spaceId?: string; path?: string }): Promise<{ spaceId: string; path: string }> {
  if (!context.fileSystem) {
    throw new Error("fileSystem is not available in context");
  }
  const spaceId = await context.fileSystem.resolveSpaceId(args.uri, args.spaceId);
  const path = await context.fileSystem.resolvePath(args.uri, args.path);
  return { spaceId, path };
}

export function createFsReaddirTool(context: IToolContext) {
  return tool({
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
    execute: async (args: {
      uri?: string;
      spaceId?: string;
      path?: string;
    }) => {
      const callId = `fs_readdir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[fs_readdir] [${callId}] execute 开始，uri: ${args.uri}, spaceId: ${args.spaceId}, path: ${args.path}`);

      try {
        if (!context.fileSystem) {
          throw new Error("fileSystem is not available in context");
        }
        const resolved = await resolveTarget(context, args);
        const resolvedPath = resolved.path;
        console.log(`[fs_readdir] [${callId}] resolveTarget 成功: spaceId=${resolved.spaceId}, path=${resolvedPath}`);

        const startTime = Date.now();
        const entries = await context.fileSystem.readdir(args.uri, resolved.spaceId, resolvedPath);
        const elapsed = Date.now() - startTime;
        console.log(`[fs_readdir] [${callId}] readdir 成功，条目数: ${entries.length}，耗时: ${elapsed}ms`);

        const result = {
          kind: "directory" as const,
          path: resolvedPath,
          entries: entries,
        };

        console.log(`[fs_readdir] [${callId}] execute 完成，返回 ${entries.length} 个条目`);
        return result;
      } catch (error) {
        console.error(`[fs_readdir] [${callId}] execute 错误:`, error);
        throw error;
      }
    },
  });
}

export function createFsReadFileTool(context: IToolContext) {
  return tool({
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
    execute: async (args: {
      uri?: string;
      spaceId?: string;
      path?: string;
      maxBytes?: number;
    }) => {
      const callId = `fs_readFile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[fs_readFile] [${callId}] execute 开始，uri: ${args.uri}, spaceId: ${args.spaceId}, path: ${args.path}, maxBytes: ${args.maxBytes}`);

      try {
        if (!context.fileSystem) {
          throw new Error("fileSystem is not available in context");
        }
        const resolved = await resolveTarget(context, args);
        const resolvedPath = resolved.path;
        console.log(`[fs_readFile] [${callId}] resolveTarget 成功: spaceId=${resolved.spaceId}, path=${resolvedPath}`);

        if (!resolvedPath || resolvedPath === "/") {
          const error = new Error(
            "fs_readFile 需要提供具体文件路径 path，而不是目录。"
          );
          console.error(`[fs_readFile] [${callId}] execute 错误:`, error);
          throw error;
        }

        const startTime = Date.now();
        const result = await context.fileSystem.readFile(args.uri, resolved.spaceId, resolvedPath, args.maxBytes);
        const elapsed = Date.now() - startTime;
        console.log(`[fs_readFile] [${callId}] readFile 成功，耗时: ${elapsed}ms`);

        if (result.kind === "file") {
          console.log(`[fs_readFile] [${callId}] execute 完成，返回文件内容 (${result.content.length} 字符, truncated: ${result.truncated})`);
        } else {
          console.log(`[fs_readFile] [${callId}] execute 完成，返回二进制文件信息`);
        }
        return result;
      } catch (error) {
        console.error(`[fs_readFile] [${callId}] execute 错误:`, error);
        throw error;
      }
    },
  });
}

export function createFsStatTool(context: IToolContext) {
  return tool({
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
    execute: async (args: {
      uri?: string;
      spaceId?: string;
      path?: string;
    }) => {
      const callId = `fs_stat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[fs_stat] [${callId}] execute 开始，uri: ${args.uri}, spaceId: ${args.spaceId}, path: ${args.path}`);

      try {
        if (!context.fileSystem) {
          throw new Error("fileSystem is not available in context");
        }
        const resolved = await resolveTarget(context, args);
        const resolvedPath = resolved.path;
        console.log(`[fs_stat] [${callId}] resolveTarget 成功: spaceId=${resolved.spaceId}, path=${resolvedPath}`);

        const startTime = Date.now();
        const result = await context.fileSystem.stat(args.uri, resolved.spaceId, resolvedPath);
        const elapsed = Date.now() - startTime;
        console.log(`[fs_stat] [${callId}] stat 成功，耗时: ${elapsed}ms`);

        console.log(`[fs_stat] [${callId}] execute 完成，size: ${result.size}, mtime: ${result.mtime}`);
        return result;
      } catch (error) {
        console.error(`[fs_stat] [${callId}] execute 错误:`, error);
        throw error;
      }
    },
  });
}

export function createFsAnalyzeFileTool(context: IToolContext) {
  return tool({
    description: "分析文件内容，提供结构化的文档摘要和概括。注意：此工具需要文件内容作为输入，应该先使用 fs_readFile 读取文件内容，然后将内容传递给此工具进行分析。",
    inputSchema: z.object({
      content: z.string().describe(
        "要分析的文件内容。此内容应该通过先调用 fs_readFile 工具获取。"
      ),
      path: z.string().optional().describe(
        "文件路径（可选），用于在分析结果中显示文件位置。"
      ),
      truncated: z.boolean().optional().describe(
        "文件内容是否被截断（可选）。如果为 true，会在分析结果中说明。"
      ),
    }),
    execute: async (args: {
      content: string;
      path?: string;
      truncated?: boolean;
    }) => {
      const callId = `fs_analyzeFile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[fs_analyzeFile] [${callId}] execute 开始，path: ${args.path}, content长度: ${args.content.length}, truncated: ${args.truncated}`);

      try {
        if (!args.content || !args.content.trim()) {
          return `文件内容为空，无法进行分析。${args.path ? `文件路径：${args.path}` : ""}`;
        }

        console.log(`[fs_analyzeFile] [${callId}] 开始调用 AI 分析内容，内容长度: ${args.content.length} 字符`);

        const analyzeStartTime = Date.now();
        
        if (!context.getAIModel) {
          throw new Error("getAIModel is not available in context");
        }
        const model = context.getAIModel();

        const systemPrompt = `你是一个专业的文档分析助手。你的任务是对文件内容进行简洁、准确的概括和分析。

要求：
1. 用中文回答
2. 提供文档的主要内容和要点
3. 如果文档有明确的结构（如章节、段落），简要说明结构
4. 突出关键信息
5. 保持简洁，控制在 300 字以内
6. 如果内容被截断，请在分析末尾说明"（注：内容已截断，分析基于部分内容）"`;

        const userPrompt = `请分析以下文件内容，提供简洁的概括和要点：

${args.path ? `文件路径：${args.path}\n` : ""}${args.truncated ? "（注意：内容已截断）\n" : ""}

文件内容：
\`\`\`
${args.content}
\`\`\`

请提供结构化的分析结果，包括：
1. 文档主要内容
2. 关键要点
3. 文档结构（如果有）`;

        const analysisResult = await generateText({
          model,
          system: systemPrompt,
          prompt: userPrompt,
        });

        const analyzeElapsed = Date.now() - analyzeStartTime;
        console.log(`[fs_analyzeFile] [${callId}] AI 分析完成，耗时: ${analyzeElapsed}ms`);

        const fileInfo = args.path ? `📄 文件分析：${args.path}\n\n` : "📄 文件分析：\n\n";
        const result = `${fileInfo}${analysisResult.text}${args.truncated ? "\n\n（注：文件内容已截断，分析基于部分内容）" : ""}`;

        console.log(`[fs_analyzeFile] [${callId}] execute 完成，总耗时: ${analyzeElapsed}ms`);
        return result;
      } catch (error) {
        console.error(`[fs_analyzeFile] [${callId}] execute 错误:`, error);
        const errorMessage = error instanceof Error ? error.message : "未知错误";
        return `分析文件时出错：${errorMessage}`;
      }
    },
  });
}

