import type { Tool } from "@agent-labs/agent-chat";
import {
  aiContextService,
  type AIContext,
} from "@/services/ai/context-service";

/**
 * 获取当前工作区上下文（浏览器标签页、编辑器、项目文件等）。
 * 这是一个只读工具，用于给模型提供更丰富的环境信息。
 */
export const getWorkspaceContextTool: Tool<
  {
    includeBrowserTab?: boolean;
    includeEditor?: boolean;
    includeProject?: boolean;
  },
  AIContext
> = {
  name: "get_workspace_context",
  description:
    "获取当前浏览器标签页、编辑器和项目相关的上下文信息，用于更好地理解用户问题。",
  parameters: {
    type: "object",
    properties: {
      includeBrowserTab: {
        type: "boolean",
        description: "是否包含当前浏览器标签页信息（URL、标题等）。",
      },
      includeEditor: {
        type: "boolean",
        description: "是否包含当前编辑器打开文件的内容和元信息。",
      },
      includeProject: {
        type: "boolean",
        description: "是否包含项目级别的上下文（当前文件、最近文件等）。",
      },
    },
    additionalProperties: false,
  },
  async execute(args) {
    const startTime = Date.now();
    console.log("[get_workspace_context] Called with args:", JSON.stringify(args));

    // Fallback context to return in case of any failure
    const fallbackContext: AIContext = {
      timestamp: Date.now(),
      editor: undefined,
      browserTab: undefined,
      project: undefined,
    };

    try {
      let normalizedArgs: {
        includeBrowserTab?: boolean;
        includeEditor?: boolean;
        includeProject?: boolean;
      } = {};

      if (args && typeof args === "object") {
        if ("includeBrowserTab" in args && typeof args.includeBrowserTab === "boolean") {
          normalizedArgs.includeBrowserTab = args.includeBrowserTab;
        }
        if ("includeEditor" in args && typeof args.includeEditor === "boolean") {
          normalizedArgs.includeEditor = args.includeEditor;
        }
        if ("includeProject" in args && typeof args.includeProject === "boolean") {
          normalizedArgs.includeProject = args.includeProject;
        }
      }

      const {
        includeBrowserTab = true,
        includeEditor = true,
        includeProject = false,
      } = normalizedArgs;

      console.log("[get_workspace_context] Resolved options:", {
        includeBrowserTab,
        includeEditor,
        includeProject,
      });

      // Create a promise that rejects after a strict timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`Timeout after 5000ms`));
        }, 5000)
      );

      // Wrap the service call to ensure it's a promise
      const contextPromise = Promise.resolve().then(() =>
        aiContextService.getFullContext({
          includeBrowserTab,
          includeEditor,
          includeProject,
        })
      );

      // Race against the timeout
      const context = await Promise.race([contextPromise, timeoutPromise]);
      const elapsed = Date.now() - startTime;

      if (!context || typeof context !== "object") {
        console.warn("[get_workspace_context] Invalid context returned, using fallback");
        return fallbackContext;
      }

      const result: AIContext = {
        timestamp: context.timestamp || Date.now(),
        editor: context.editor,
        browserTab: context.browserTab,
        project: context.project,
      };

      console.log(`[get_workspace_context] Successfully got context in ${elapsed}ms`);
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[get_workspace_context] Error after ${elapsed}ms:`, error);

      // Always return a valid object, never throw, to prevent the tool call from hanging the UI
      console.log("[get_workspace_context] Returning fallback context due to error");
      return fallbackContext;
    }
  },
};

