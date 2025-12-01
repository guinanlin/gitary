import { useDocument } from "@/hooks/use-document";
import { TabIconButton } from "@/xbook/ui/components/tab";
import { CommandKeys } from "xbook/constants/tokens";
import { commandService } from "xbook/services/commandService";
import { Loader2, Presentation } from "lucide-react";
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

const LazyCustomMonacoEditor = React.lazy(() =>
  import("@/components/custom-monaco-editor").then((m) => ({
    default: m.CustomMonacoEditor,
  }))
);
import { MonacoKeyCode, MonacoKeyMod } from "@/monaco/keys";

export const ZenmarkEditorComponent = (props: { uri: string }) => {
  const { t } = useTranslation();
  const { uri } = props;
  const { content, setContent, loading, flush } = useDocument(uri, {
    autosave: false,
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarElement, setToolbarElement] = useState<HTMLElement | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const rightButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const [rightButtonContainerElement, setRightButtonContainerElement] = useState<HTMLElement | null>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);

  const handleMonacoChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
    },
    [setContent]
  );

  const handleZenmarkChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
    },
    [setContent]
  );

  const monacoKeyBindings = useMemo(
    () => [
      {
        key: MonacoKeyMod.CtrlCmd | MonacoKeyCode.KeyS,
        action: () => {
          flush();
        },
      },
      {
        key: MonacoKeyMod.CtrlCmd | MonacoKeyCode.Slash,
        action: () => {
          setIsSourceMode(false);
        },
      },
    ],
    [flush]
  );

  const monacoOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: "on" as const,
    }),
    []
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
      onClick={() => {
        console.log("当前 Markdown 文档内容：");
        console.log("=".repeat(50));
        console.log(content);
        console.log("=".repeat(50));
        console.log("文档 URI:", uri);
      }}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out",
        "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
      title="生成PPT - 发送到 Gemini"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Presentation
        className={cn(
          "h-5 w-5 transition-transform duration-200",
          "group-hover:scale-110"
        )}
      />
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
            <LazyCustomMonacoEditor
              value={content}
              language="markdown"
              onChange={handleMonacoChange}
              keyBindings={monacoKeyBindings}
              options={monacoOptions}
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
    </div>
  );
};
