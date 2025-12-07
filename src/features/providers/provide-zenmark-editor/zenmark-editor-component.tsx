import { useDocument } from "@/hooks/use-document";
import { TabIconButton } from "@/xbook/ui/components/tab";
import { CommandKeys } from "xbook/constants/tokens";
import { commandService } from "xbook/services/commandService";
import { Loader2, Presentation, Sparkles } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@chakra-ui/react";
import { AiOutlineMenuFold, AiOutlineCode, AiOutlineEye } from "react-icons/ai";
import {
  KeyCode,
  KeyMod,
  matchesKeybinding,
  ZenmarkEditor,
} from "zenmark-editor";
import { cn } from "@/toolkit/utils/shadcn-utils";
import { spaceHelper } from "@/helpers/space.helper";
import { t as i18nT } from "@/i18n/utils";
import xbook from "xbook/index";
import { Uri } from "@/toolkit/vscode/uri";
import { openerService } from "@/services/opener.service";
import { AIService } from "@/services/ai/ai-service";
import { streamText } from "ai";
import { getAIModel } from "@dty/ai-assistant-core";
import { aiProviderStore } from "@/services/ai/ai-provider.store";
import { PROVIDER_CONFIGS } from "@/services/ai/providers";
import type { ProviderConfigs } from "@dty/ai-assistant-core";

const LazyTextFileView = React.lazy(() =>
  import("@/features/providers/provide-common-text-file-opener/components/text-file-view").then((m) => ({
    default: m.TextFileView,
  }))
);

export const ZenmarkEditorComponent = (props: { uri: string }) => {
  const { t } = useTranslation();
  const { uri } = props;
  const { content, setContent, loading, flush } = useDocument(uri, {
    autosave: true,
    debounceMs: 3000,
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarElement, setToolbarElement] = useState<HTMLElement | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const rightButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const [rightButtonContainerElement, setRightButtonContainerElement] = useState<HTMLElement | null>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const headerLeftContainerRef = useRef<HTMLDivElement | null>(null);
  const [headerLeftElement, setHeaderLeftElement] = useState<HTMLElement | null>(null);
  const [isBeautifying, setIsBeautifying] = useState(false);

  const handleZenmarkChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
    },
    [setContent]
  );

  const handleSourceModeChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
    },
    [setContent]
  );

  const handleSourceModeSave = useCallback(
    (content: string) => {
      flush(content);
    },
    [flush]
  );

  const handleKeyDown = useCallback((event: {
    keyCode: number;
    code: string;
    key: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    const saveKeybinding = KeyMod.CtrlCmd | KeyCode.KEY_S;

    if (matchesKeybinding(event, saveKeybinding)) {
      event.preventDefault();
      event.stopPropagation();
      flush();
      return true;
    }

    const isToggleSource =
      (event.ctrlKey || event.metaKey) &&
      (event.key === "/" || event.code === "Slash") &&
      !event.shiftKey;

    if (isToggleSource) {
      event.preventDefault();
      event.stopPropagation();
      setIsSourceMode((prev) => !prev);
      return true;
    }

    return false;
  }, [flush]);

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) &&
        (event.key === "s" || event.key === "S") &&
        !event.shiftKey;

      const isToggleSourceShortcut =
        (event.metaKey || event.ctrlKey) &&
        (event.key === "/" || event.code === "Slash") &&
        !event.shiftKey;

      if (
        isToggleSourceShortcut &&
        editorRef.current?.contains(document.activeElement)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsSourceMode((prev) => !prev);
        return;
      }

      if (isSaveShortcut) {
        const isInEditor = editorRef.current?.contains(document.activeElement);
        if (isInEditor || isSourceMode) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          flush();
        }
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
    };
  }, [flush, isSourceMode]);

  useEffect(() => {
    if (loading) return;

    const findToolbar = () => {
      const toolbar = editorRef.current?.querySelector(
        ".zenmark-editor__header.zenmark-toolbar"
      ) as HTMLElement | null;
      if (toolbar) {
        if (!buttonContainerRef.current) {
          const container = document.createElement("div");
          container.style.display = "flex";
          container.style.alignItems = "center";
          container.style.height = "100%";
          container.style.flexShrink = "0";
          container.className = "zenmark-editor-toggle-button-container";
          toolbar.insertBefore(container, toolbar.firstChild);
          buttonContainerRef.current = container;
        } else if (buttonContainerRef.current.parentNode !== toolbar) {
          toolbar.insertBefore(buttonContainerRef.current, toolbar.firstChild);
        } else if (buttonContainerRef.current !== toolbar.firstChild) {
          toolbar.insertBefore(buttonContainerRef.current, toolbar.firstChild);
        }
        setToolbarElement(buttonContainerRef.current);

        if (!rightButtonContainerRef.current) {
          const rightContainer = document.createElement("div");
          rightContainer.style.display = "flex";
          rightContainer.style.alignItems = "center";
          rightContainer.style.height = "100%";
          rightContainer.style.flexShrink = "0";
          rightContainer.style.marginLeft = "auto";
          rightContainer.className = "zenmark-editor-right-button-container";
          toolbar.appendChild(rightContainer);
          rightButtonContainerRef.current = rightContainer;
        } else if (rightButtonContainerRef.current.parentNode !== toolbar) {
          toolbar.appendChild(rightButtonContainerRef.current);
        } else if (rightButtonContainerRef.current !== toolbar.lastChild) {
          toolbar.removeChild(rightButtonContainerRef.current);
          toolbar.appendChild(rightButtonContainerRef.current);
        }
        setRightButtonContainerElement(rightButtonContainerRef.current);

        const headerLeft = toolbar.querySelector(
          ".zenmark-editor__header-left"
        ) as HTMLElement | null;

        if (headerLeft) {
          if (!headerLeftContainerRef.current) {
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.height = "100%";
            container.style.flexShrink = "0";
            container.className = "zenmark-editor-beautify-button-container";
            headerLeft.appendChild(container);
            headerLeftContainerRef.current = container;
            console.log("[ZenmarkEditor] Beautify button container created and appended to header-left", container);
          } else if (headerLeftContainerRef.current.parentNode !== headerLeft) {
            headerLeft.appendChild(headerLeftContainerRef.current);
          }
          setHeaderLeftElement(headerLeftContainerRef.current);
          console.log("[ZenmarkEditor] headerLeftElement set:", headerLeftContainerRef.current);
        } else {
          console.log("[ZenmarkEditor] header-left element not found in toolbar");
        }

        return true;
      }
      return false;
    };

    if (findToolbar()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (findToolbar()) {
        observer.disconnect();
      }
    });

    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true,
      });
    }

    const timeout = setTimeout(() => {
      observer.disconnect();
    }, 5000);

    return () => {
      observer.disconnect();
      if (buttonContainerRef.current && buttonContainerRef.current.parentNode) {
        buttonContainerRef.current.parentNode.removeChild(buttonContainerRef.current);
        buttonContainerRef.current = null;
      }
      if (rightButtonContainerRef.current && rightButtonContainerRef.current.parentNode) {
        rightButtonContainerRef.current.parentNode.removeChild(rightButtonContainerRef.current);
        rightButtonContainerRef.current = null;
      }
      setRightButtonContainerElement(null);
      if (headerLeftContainerRef.current && headerLeftContainerRef.current.parentNode) {
        headerLeftContainerRef.current.parentNode.removeChild(headerLeftContainerRef.current);
        headerLeftContainerRef.current = null;
      }
      setHeaderLeftElement(null);
    };
  }, [loading, content]);

  useEffect(() => {
    if (loading || isSourceMode) return;

    const hideFrontmatter = () => {
      const contentElement = editorRef.current?.querySelector(
        ".zenmark-editor-content, .ProseMirror"
      ) as HTMLElement | null;

      if (!contentElement) return false;

      const children = Array.from(contentElement.children);
      if (children.length === 0) return false;

      // Strategy 1: Check for HR tags defining frontmatter
      const firstChild = children[0] as HTMLElement;

      if (firstChild.tagName === "HR") {
        const secondHrIndex = children.findIndex(
          (el, idx) => idx > 0 && el.tagName === "HR"
        );

        if (secondHrIndex !== -1) {
          // Check if content between HRs looks like YAML
          const frontmatterElements = children.slice(0, secondHrIndex + 1);

          // Heuristic: Frontmatter usually contains key-value pairs
          const textContent = frontmatterElements
            .map(el => el.textContent)
            .join("\n");

          const hasYamlIndicators =
            textContent.includes(":") &&
            (textContent.includes("title:") ||
              textContent.includes("description:") ||
              textContent.includes("layout:") ||
              textContent.includes("date:"));

          if (hasYamlIndicators) {
            frontmatterElements.forEach((el) => {
              (el as HTMLElement).style.display = "none";
            });
            return true;
          }
        }
      }

      // Strategy 2: Check for code block with YAML class or content
      const preElements = contentElement.querySelectorAll("pre");
      let hidden = false;

      preElements.forEach((pre) => {
        // Only consider if it's the first element or very close to top
        if (pre !== contentElement.firstElementChild && pre.previousElementSibling?.tagName !== "DIV") {
          // allow for some wrapper divs maybe? strict for now: must be first
          if (pre !== contentElement.firstElementChild) return;
        }

        const code = pre.querySelector("code");
        if (code) {
          const text = code.textContent || "";
          const classList = Array.from(code.classList);
          const isYaml =
            classList.some((cls) => cls.includes("yaml") || cls.includes("frontmatter")) ||
            (text.includes(":") &&
              (text.includes("title:") || text.includes("description:")) &&
              (text.trim().startsWith("---") || !text.trim().startsWith("#"))); // Allow if it looks like YAML even without ---

          if (isYaml) {
            (pre as HTMLElement).style.display = "none";
            hidden = true;
          }
        }
      });

      return hidden;
    };

    const findScrollContainer = (): HTMLElement | null => {
      const contentWrapper = editorRef.current?.querySelector(
        ".zenmark-editor-content-wrapper"
      ) as HTMLElement | null;

      if (contentWrapper) {
        return contentWrapper;
      }

      const contentElement = editorRef.current?.querySelector(
        ".zenmark-editor-content"
      ) as HTMLElement | null;

      if (contentElement) {
        const scrollContainer = contentElement.closest('[class*="scroll"]') as HTMLElement | null;
        if (scrollContainer) {
          return scrollContainer;
        }

        const parentWithScroll = contentElement.parentElement;
        if (parentWithScroll && parentWithScroll.scrollHeight > parentWithScroll.clientHeight) {
          return parentWithScroll;
        }
      }

      const proseMirror = editorRef.current?.querySelector(".ProseMirror") as HTMLElement | null;
      if (proseMirror) {
        const scrollContainer = proseMirror.closest('[class*="scroll"]') as HTMLElement | null;
        if (scrollContainer) {
          return scrollContainer;
        }
      }

      return null;
    };

    const scrollToTop = () => {
      const scrollContainer = findScrollContainer();
      if (!scrollContainer) {
        return false;
      }

      scrollContainer.scrollTop = 0;

      const contentElement = editorRef.current?.querySelector(
        ".zenmark-editor-content, .ProseMirror"
      ) as HTMLElement | null;

      if (contentElement) {
        const allElements = contentElement.querySelectorAll("hr, h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote");
        if (allElements.length > 0) {
          const firstElement = allElements[0] as HTMLElement;
          const rect = firstElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();

          if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
            setTimeout(() => {
              firstElement.scrollIntoView({ behavior: "auto", block: "start" });
            }, 50);
          }
        } else {
          const firstChild = contentElement.firstElementChild as HTMLElement | null;
          if (firstChild) {
            setTimeout(() => {
              firstChild.scrollIntoView({ behavior: "auto", block: "start" });
            }, 50);
          }
        }
      }

      return true;
    };

    const attemptScroll = () => {
      const frontmatterHidden = hideFrontmatter();
      return scrollToTop() || frontmatterHidden;
    };

    if (attemptScroll()) {
      const retryTimeout = setTimeout(() => {
        attemptScroll();
      }, 100);
      return () => clearTimeout(retryTimeout);
    }

    const observer = new MutationObserver(() => {
      if (attemptScroll()) {
        observer.disconnect();
      }
    });

    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true,
      });
    }

    const timeout = setTimeout(() => {
      observer.disconnect();
      attemptScroll();
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [loading, content, isSourceMode, uri]);

  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);

  const handleGeneratePPT = useCallback(async () => {
    if (isGeneratingPPT) {
      return; // Prevent multiple clicks
    }

    setIsGeneratingPPT(true);
    try {
      const spaceId = spaceHelper.getSpaceIdFromUri(uri);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const fileName = `/${year}-${month}-${day}-${hours}${minutes}${seconds}-${milliseconds}-${randomSuffix}.ppt.md`;

      const pptUriObj = spaceHelper.getUri(spaceId, fileName);
      const pptUri = pptUriObj.toString();

      // Wait for provider to be registered (max 3 seconds)
      const maxWaitTime = 3000;
      const checkInterval = 100;
      let waited = 0;

      while (!xbook.fs.hasProvider(pptUriObj) && waited < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      // Final check
      if (!xbook.fs.hasProvider(pptUriObj)) {
        throw new Error(
          `文件系统提供者未就绪。请稍后再试。\n` +
          `Space ID: ${spaceId}\n` +
          `如果问题持续存在,请尝试刷新页面。`
        );
      }

      const pptContent = JSON.stringify({
        markdown: content,
        presentation: {
          title: "",
          slides: []
        },
        theme: "MINIMAL_LIGHT",
        audience: "Professional Team",
        tone: "Inspirational",
        length: "medium"
      }, null, 2);

      console.log("[ZenmarkEditor] Writing PPT file:", pptUri);
      await xbook.fs.writeFile(
        Uri.parse(pptUri),
        new TextEncoder().encode(pptContent),
        {
          create: true,
          overwrite: true
        }
      );
      console.log("[ZenmarkEditor] PPT file written successfully");

      const opener = openerService.getOpeners().find((o) => o.id === "make-ppt");
      if (!opener) {
        throw new Error("make-ppt opener 未找到，请确保插件已正确加载");
      }

      console.log("[ZenmarkEditor] Opening PPT file with opener:", { openerId: opener.id, uri: pptUri });
      opener.init(pptUri);

      xbook.notificationService.success("Markdown 内容已发送到 PPT 应用");
    } catch (error) {
      console.error("[ZenmarkEditor] Failed to generate PPT:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      xbook.notificationService.error(`创建 PPT 失败：${errorMessage}`);
    } finally {
      setIsGeneratingPPT(false);
    }
  }, [content, uri, isGeneratingPPT]);

  const handleBeautifyMarkdown = useCallback(async () => {
    if (isBeautifying || !content.trim()) {
      return;
    }

    setIsBeautifying(true);
    try {
      const currentProvider = aiProviderStore.getProvider();
      const model = getAIModel(currentProvider, PROVIDER_CONFIGS as ProviderConfigs);

      const systemPrompt = `你是一个专业的 Markdown 格式化助手。你的任务是将用户提供的 Markdown 内容进行美化和格式化。

要求：
1. 保持原始内容的语义和结构不变
2. 优化 Markdown 语法，确保格式规范
3. 统一标题层级，确保层次清晰（# ## ###）
4. 规范列表格式（统一使用 - 或 *），规范嵌套
5. 优化代码块格式，确保语言标识正确
6. 确保链接和图片格式正确
7. 优化段落间距和换行，保持合理间距
8. 处理转义字符和特殊符号
9. 保持原有的语言（中文/英文），不翻译
10. 不要添加额外的内容，只进行格式化

输出要求：
- 只返回格式化后的 Markdown 内容
- 不要添加任何解释性文字
- 不要使用代码块包裹输出`;

      const userPrompt = `请美化以下 Markdown 内容：

\`\`\`markdown
${content}
\`\`\``;

      const result = streamText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
      });

      let beautifiedContent = "";
      for await (const chunk of result.textStream) {
        beautifiedContent += chunk;
      }

      let finalContent = beautifiedContent.trim();
      if (finalContent.startsWith("```markdown")) {
        finalContent = finalContent.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
      } else if (finalContent.startsWith("```")) {
        finalContent = finalContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      if (finalContent) {
        setContent(finalContent);
        xbook.notificationService.success("Markdown 美化完成");
      } else {
        throw new Error("AI 返回的内容为空");
      }
    } catch (error) {
      console.error("[ZenmarkEditor] Failed to beautify markdown:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      xbook.notificationService.error(`美化失败：${errorMessage}`);
    } finally {
      setIsBeautifying(false);
    }
  }, [content, isBeautifying, setContent]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 h-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/70" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-foreground/90">
              {t("zenmark.loading")}
            </p>
            <p className="text-xs text-muted-foreground/60 truncate max-w-xs">
              {uri.split("/").pop()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleButton = (
    <TabIconButton
      className="zenmark-editor-toggle-button"
      onClick={() => {
        commandService.executeCommand(CommandKeys.ToggleHome);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minWidth: "40px",
      }}
    >
      <Icon fontSize={"lg"} as={AiOutlineMenuFold} />
    </TabIconButton>
  );

  const generatePptButtonElement = (
    <button
      onClick={handleGeneratePPT}
      disabled={isGeneratingPPT}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out",
        isGeneratingPPT
          ? "cursor-not-allowed opacity-50"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
      title={isGeneratingPPT ? "正在生成 PPT..." : "生成PPT - 发送到 Gemini"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isGeneratingPPT ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Presentation
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            "group-hover:scale-110"
          )}
        />
      )}
    </button>
  );

  const sourceModeToggleButtonElement = (
    <button
      onClick={() => {
        setIsSourceMode((prev) => !prev);
      }}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out",
        isSourceMode
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
      title={isSourceMode ? "Switch to Preview Mode (Ctrl+/)" : "Switch to Source Mode (Ctrl+/)"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        fontSize={"lg"}
        as={isSourceMode ? AiOutlineEye : AiOutlineCode}
        className={cn(
          "h-5 w-5 transition-transform duration-200",
          isSourceMode ? "scale-100" : "group-hover:scale-110"
        )}
      />
    </button>
  );

  const beautifyButtonElement = (
    <button
      onClick={handleBeautifyMarkdown}
      disabled={isBeautifying || !content.trim()}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out",
        isBeautifying || !content.trim()
          ? "cursor-not-allowed opacity-50"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
      title={isBeautifying ? "正在美化中..." : "美化 Markdown - 使用 AI 格式化"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "40px",
        height: "40px",
        minWidth: "40px",
        minHeight: "40px",
      }}
    >
      {isBeautifying ? (
        <Loader2 className="h-5 w-5 animate-spin text-current" />
      ) : (
        <Sparkles
          className={cn(
            "h-5 w-5 transition-transform duration-200 text-current",
            "group-hover:scale-110"
          )}
        />
      )}
    </button>
  );

  const sourceModeToggleButton = rightButtonContainerElement
    ? sourceModeToggleButtonElement
    : null;

  return (
    <div
      ref={editorRef}
      style={{ height: "100%" }}
    >
      {isSourceMode ? (
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 10,
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {sourceModeToggleButtonElement}
          </div>
          <React.Suspense fallback={<div>{t("file.loadingEditor")}</div>}>
            <LazyTextFileView
              uri={uri}
              value={content}
              onChange={handleSourceModeChange}
              onSave={handleSourceModeSave}
            />
          </React.Suspense>
        </div>
      ) : (
        <>
          <ZenmarkEditor
            key={uri}
            value={content}
            onChange={handleZenmarkChange}
            onKeyDown={handleKeyDown}
          />
          {toolbarElement && createPortal(toggleButton, toolbarElement)}
        </>
      )}
      {rightButtonContainerElement && (
        <>
          {createPortal(generatePptButtonElement, rightButtonContainerElement)}
          {createPortal(sourceModeToggleButtonElement, rightButtonContainerElement)}
        </>
      )}
      {!isSourceMode && headerLeftElement && createPortal(beautifyButtonElement, headerLeftElement)}
    </div>
  );
};
