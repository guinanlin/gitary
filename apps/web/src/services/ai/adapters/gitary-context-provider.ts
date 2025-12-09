import { layoutService } from "xbook/services";
import { fileSystemHelper } from "@/helpers/file-system.helper";
import i18n from "@/i18n/config";
import type {
  IContextProvider,
  BrowserTabContext,
  EditorContext,
  ProjectContext,
  AIContext,
} from "@dty/ai-assistant-core";

export class GitaryContextProvider implements IContextProvider {
  async getCurrentPageContext(): Promise<{ uri?: string; openerId?: string } | undefined> {
    try {
      console.log("[GitaryContextProvider] Getting current page context...");

      if (!layoutService || !layoutService.pageBox) {
        console.warn("[GitaryContextProvider] layoutService or pageBox not available");
        return undefined;
      }

      let page = layoutService.pageBox.getCurrentPage?.();

      if (!page) {
        console.warn("[GitaryContextProvider] layoutService.pageBox.getCurrentPage() returned undefined. Trying to find active page from list.");
        const pageList = layoutService.pageBox.getPageList?.() || [];
        page = pageList.find(p => p.active);
      }

      if (!page) {
        console.warn("[GitaryContextProvider] No active page found.");
        return undefined;
      }

      console.log("[GitaryContextProvider] Found active page:", page);

      const viewData = (page as any).viewData as { type?: string; props?: { uri?: string } } | undefined;
      const uri = viewData?.props?.uri as string | undefined;
      const openerId = viewData?.type as string | undefined;

      console.log("[GitaryContextProvider] Extracted URI:", uri, "OpenerID:", openerId);

      return { uri, openerId };
    } catch (error) {
      console.error("[GitaryContextProvider] Error in getCurrentPageContext:", error);
      return undefined;
    }
  }

  async getEditorContext(): Promise<EditorContext | undefined> {
    console.log("[GitaryContextProvider] getEditorContext called");
    try {
      if (!fileSystemHelper || !fileSystemHelper.service) {
        console.warn("[GitaryContextProvider] fileSystemHelper not available");
        return undefined;
      }

      const pageContext = await this.getCurrentPageContext();
      if (!pageContext?.uri) {
        console.warn("[GitaryContextProvider] No URI in page context, skipping editor context.");
        return undefined;
      }

      const uri = pageContext.uri;
      console.log(`[GitaryContextProvider] Reading file content for URI: ${uri}`);

      const startTime = Date.now();
      const content = await Promise.race([
        fileSystemHelper.service.read(uri),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("文件读取超时")), 2000)
        ),
      ]);

      console.log(`[GitaryContextProvider] File read successful. Size: ${content.length} chars. Time: ${Date.now() - startTime}ms`);

      const fileName = uri.split("/").pop() || uri;
      const language = this.detectLanguage(fileName);
      const lines = content.split("\n");

      return {
        uri,
        fileName,
        content,
        language,
        lineCount: lines.length,
      };
    } catch (error) {
      console.error("[GitaryContextProvider] Failed to read file for context:", error);
      return undefined;
    }
  }

  async getBrowserTabContext(): Promise<BrowserTabContext | undefined> {
    try {
      if (typeof window === "undefined") {
        return undefined;
      }

      const win = window as any;
      const chromeApi = win.chrome;

      if (chromeApi && chromeApi.tabs && typeof chromeApi.tabs.query === 'function') {
        try {
          const queryPromise = chromeApi.tabs.query({ active: true, currentWindow: true });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("浏览器标签页查询超时")), 2000)
          );

          const tabs = await Promise.race([queryPromise, timeoutPromise]) as any[];
          if (tabs && tabs.length > 0 && tabs[0]?.url) {
            return {
              url: tabs[0].url,
              title: tabs[0].title || "",
            };
          }
        } catch (e) {
          console.warn("[GitaryContextProvider] Chrome tabs query failed, falling back to window location:", e);
        }
      }

      if (window.location && window.location.href) {
        return {
          url: window.location.href,
          title: document.title || "",
        };
      }

      return undefined;
    } catch (error) {
      console.warn("[GitaryContextProvider] Failed to get browser tab context:", error);
      return undefined;
    }
  }

  async getFullContext(options?: {
    includeBrowserTab?: boolean;
    includeEditor?: boolean;
    includeProject?: boolean;
  }): Promise<AIContext> {
    const startTime = Date.now();
    console.log("[GitaryContextProvider] getFullContext called with options:", options);

    try {
      const {
        includeBrowserTab = true,
        includeEditor = true,
        includeProject = false,
      } = options || {};

      const context: AIContext = {
        timestamp: Date.now(),
      };

      const promises: Promise<void>[] = [];

      if (includeBrowserTab) {
        const browserTabPromise = this.getBrowserTabContext()
          .then((browserTab) => {
            console.log("[GitaryContextProvider] Browser tab context resolved");
            context.browserTab = browserTab;
          })
          .catch((error) => {
            console.warn("[GitaryContextProvider] Failed to get browser tab context:", error);
            context.browserTab = undefined;
          });
        promises.push(browserTabPromise);
      }

      let editorContextPromise: Promise<EditorContext | undefined> | undefined;
      if (includeEditor) {
        editorContextPromise = this.getEditorContext()
          .then((editor) => {
            console.log("[GitaryContextProvider] Editor context resolved");
            return editor;
          })
          .catch((error) => {
            console.warn("[GitaryContextProvider] Failed to get editor context:", error);
            return undefined;
          });
        promises.push(
          editorContextPromise
            .then((editor) => {
              context.editor = editor;
            })
            .catch((error) => {
              console.warn("[GitaryContextProvider] Failed to set editor context:", error);
              context.editor = undefined;
            })
        );
      }

      if (includeProject) {
        const projectPromise = this.getProjectContext(editorContextPromise)
          .then((project) => {
            console.log("[GitaryContextProvider] Project context resolved");
            context.project = project;
          })
          .catch((error) => {
            console.warn("[GitaryContextProvider] Failed to get project context:", error);
            context.project = undefined;
          });
        promises.push(projectPromise);
      }

      console.log(`[GitaryContextProvider] Waiting for ${promises.length} promises to settle`);
      await Promise.allSettled(promises);
      const elapsed = Date.now() - startTime;
      console.log(`[GitaryContextProvider] getFullContext completed in ${elapsed}ms`);

      return context;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[GitaryContextProvider] getFullContext failed after ${elapsed}ms:`, error);
      return {
        timestamp: Date.now(),
        editor: undefined,
        browserTab: undefined,
        project: undefined,
      };
    }
  }

  formatContextForPrompt(context: AIContext): string {
    const t = i18n.t.bind(i18n);
    const parts: string[] = [];

    if (context.browserTab) {
      parts.push(`## ${t("globalChat.currentBrowserTab")}`);
      parts.push(`- ${t("globalChat.url")}: ${context.browserTab.url}`);
      parts.push(`- ${t("globalChat.title")}: ${context.browserTab.title}`);
      if (context.browserTab.selectedText) {
        parts.push(`- ${t("globalChat.selectedText")}: ${context.browserTab.selectedText}`);
      }
      parts.push("");
    }

    if (context.editor) {
      parts.push(`## ${t("globalChat.currentEditor")}`);
      parts.push(`- ${t("globalChat.file")}: ${context.editor.fileName}`);
      parts.push(`- ${t("globalChat.path")}: ${context.editor.uri}`);
      if (context.editor.language) {
        parts.push(`- ${t("globalChat.language")}: ${context.editor.language}`);
      }
      parts.push(`- ${t("globalChat.lineCount")}: ${context.editor.lineCount}`);
      if (context.editor.selectedText) {
        parts.push(`- ${t("globalChat.selectedText")}: ${context.editor.selectedText}`);
      }
      parts.push("");
      parts.push(`### ${t("globalChat.fileContent")}`);
      parts.push("```" + (context.editor.language || "") + "\n" + context.editor.content + "\n```");
      parts.push("");
    }

    if (context.project) {
      if (context.project.currentFile) {
        parts.push(`## ${t("globalChat.currentProjectFile")}: ${context.project.currentFile}`);
      }
      if (context.project.recentFiles && context.project.recentFiles.length > 0) {
        parts.push(`## ${t("globalChat.recentFiles")}`);
        context.project.recentFiles.forEach((file) => {
          parts.push(`- ${file}`);
        });
        parts.push("");
      }
    }

    return parts.join("\n");
  }

  private detectLanguage(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
      swift: "swift",
      kt: "kotlin",
      md: "markdown",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      xml: "xml",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      sql: "sql",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      vue: "vue",
    };
    return languageMap[ext || ""] || "text";
  }

  private async getProjectContext(
    editorContextPromise?: Promise<EditorContext | undefined>
  ): Promise<ProjectContext> {
    try {
      const editorContext = editorContextPromise
        ? await editorContextPromise
        : await this.getEditorContext();

      let recentFiles: string[] = [];
      try {
        if (layoutService && layoutService.pageBox) {
          const pageList = layoutService.pageBox.getPageList?.() || [];
          recentFiles = pageList
            .map(page => {
              const viewData = page.viewData as { props?: { uri?: string } } | undefined;
              return viewData?.props?.uri;
            })
            .filter((uri): uri is string => !!uri)
            .slice(0, 10);
        }
      } catch (e) {
        console.warn("[GitaryContextProvider] Failed to get recent files:", e);
      }

      return {
        currentFile: editorContext?.uri,
        recentFiles,
      };
    } catch (error) {
      console.error("[GitaryContextProvider] Error in getProjectContext:", error);
      return {
        currentFile: undefined,
        recentFiles: [],
      };
    }
  }
}

