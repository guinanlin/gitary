import { tool } from 'ai';
import { z } from 'zod';
import {
  aiContextService,
  type AIContext,
} from "@/services/ai/context-service";

const workspaceContextParams = z.object({
  includeBrowserTab: z.boolean().optional().describe(
    "是否包含当前浏览器标签页信息（URL、标题等）。"
  ),
  includeEditor: z.boolean().optional().describe(
    "是否包含当前编辑器打开文件的内容和元信息。"
  ),
  includeProject: z.boolean().optional().describe(
    "是否包含项目级别的上下文（当前文件、最近文件等）。"
  ),
});

function formatWorkspaceContext(context: AIContext): string {
  const parts: string[] = [];

  if (context.browserTab) {
    parts.push(`🌐 浏览器标签页：${context.browserTab.title || '无标题'}`);
    if (context.browserTab.url) {
      parts.push(`   地址：${context.browserTab.url}`);
    }
  }

  if (context.editor) {
    parts.push(`📝 编辑器：${context.editor.fileName}`);
    if (context.editor.language) {
      parts.push(`   语言：${context.editor.language}`);
    }
    parts.push(`   行数：${context.editor.lineCount} 行`);
    if (context.editor.uri) {
      parts.push(`   路径：${context.editor.uri}`);
    }
    if (context.editor.selectedText) {
      parts.push(`   选中文本：${context.editor.selectedText.substring(0, 100)}${context.editor.selectedText.length > 100 ? '...' : ''}`);
    }
  }

  if (context.project) {
    if (context.project.currentFile) {
      parts.push(`📁 当前项目文件：${context.project.currentFile}`);
    }
    if (context.project.recentFiles && context.project.recentFiles.length > 0) {
      parts.push(`📋 最近文件（${context.project.recentFiles.length} 个）：`);
      context.project.recentFiles.slice(0, 5).forEach((file, index) => {
        parts.push(`   ${index + 1}. ${file}`);
      });
      if (context.project.recentFiles.length > 5) {
        parts.push(`   ... 还有 ${context.project.recentFiles.length - 5} 个文件`);
      }
    }
  }

  if (parts.length === 0) {
    return "当前工作区上下文：暂无可用信息";
  }

  return parts.join("\n");
}

export const getWorkspaceContextTool = tool({
  description: "获取当前浏览器标签页、编辑器和项目相关的上下文信息，用于更好地理解用户问题。",
  inputSchema: workspaceContextParams,
  execute: async ({ includeBrowserTab = true, includeEditor = true, includeProject = false }: z.infer<typeof workspaceContextParams>): Promise<string> => {
    const startTime = Date.now();
    console.log("[get_workspace_context] Called with:", { includeBrowserTab, includeEditor, includeProject });

    const fallbackMessage = "当前工作区上下文：获取失败，请稍后重试";

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`Timeout after 5000ms`));
        }, 5000)
      );

      const contextPromise = Promise.resolve().then(() =>
        aiContextService.getFullContext({
          includeBrowserTab,
          includeEditor,
          includeProject,
        })
      );

      const context = await Promise.race([contextPromise, timeoutPromise]);
      const elapsed = Date.now() - startTime;

      if (!context || typeof context !== "object") {
        console.warn("[get_workspace_context] Invalid context returned, using fallback");
        return fallbackMessage;
      }

      const result = formatWorkspaceContext(context);
      console.log(`[get_workspace_context] Successfully got context in ${elapsed}ms`);
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[get_workspace_context] Error after ${elapsed}ms:`, error);
      console.log("[get_workspace_context] Returning fallback message due to error");
      return fallbackMessage;
    }
  },
});
