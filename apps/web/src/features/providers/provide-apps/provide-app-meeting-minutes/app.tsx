import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDocument } from "@/hooks/use-document";
import { MonacoKeyCode, MonacoKeyMod } from "@/monaco/keys";
import { CustomMonacoEditor } from "@/components/custom-monaco-editor";
import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "@chakra-ui/react";
import { AiOutlineCode, AiOutlineEye } from "react-icons/ai";
import { Loader2, Sparkles } from "lucide-react";
import {
  KeyCode,
  KeyMod,
  matchesKeybinding,
  ZenmarkEditor,
} from "zenmark-editor";
import { cn } from "@/toolkit/utils/shadcn-utils";
import { streamText } from "ai";
import { getAIModel } from "@dty/ai-assistant-core";
import { aiProviderStore } from "@/services/ai/ai-provider.store";
import { PROVIDER_CONFIGS } from "@/services/ai/providers";
import type { ProviderConfigs } from "@dty/ai-assistant-core";
import xbook from "xbook/index";

const LazyCustomMonacoEditor = React.lazy(() =>
  import("@/components/custom-monaco-editor").then((m) => ({
    default: m.CustomMonacoEditor,
  }))
);

const MEETING_MINUTES_TEMPLATE = `# 会议纪要  

**会议主题：**  

**会议时间：**  

**会议地点 / 会议方式（线上/线下）：**  

**会议主持人：**  

**记录人：**  

**参会人员：**  



---

## 一、会议背景

> 简要说明召开本次会议的原因、目标。



---

## 二、讨论议题

### 议题 1：xxxx

- **讨论要点：**  

  -  

- **结论 / 决策：**  

  -  



### 议题 2：xxxx

- **讨论要点：**  

  -  

- **结论 / 决策：**  

  -  



### 议题 3：xxxx

- **讨论要点：**  

  -  

- **结论 / 决策：**  

  -  



---

## 三、行动项（Action Items）

| 序号 | 任务内容 | 负责人 | 截止时间 | 状态 |
|------|----------|--------|-----------|--------|
| 1 | | | | 未开始/进行中/完成 |
| 2 | | | | |
| 3 | | | | |



---

## 四、风险与待解决问题（若有）

- 风险点：  

- 需要额外确认的问题：  



---

## 五、下次会议事项（可选）

- 预计时间：  

- 需准备的资料 / 输入：  



---

## 六、附件（可选）

- 链接：  

- 文档：  

`;

export const AppMeetingMinutes: FC<{
  uri: string;
}> = ({ uri }) => {
  if (!uri) {
    return <div>uri is required</div>;
  }

  const { content, setContent, loading, flush } = useDocument(uri, {
    autosave: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const headerLeftContainerRef = useRef<HTMLDivElement | null>(null);
  const [headerLeftElement, setHeaderLeftElement] = useState<HTMLElement | null>(null);
  const [isBeautifying, setIsBeautifying] = useState(false);

  useEffect(() => {
    if (!loading && !isInitialized) {
      if (!content || content.trim() === "") {
        setContent(MEETING_MINUTES_TEMPLATE);
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    }
  }, [loading, content, isInitialized, setContent]);

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

  const handleKeyDown = useCallback(
    (event: {
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
    },
    [flush]
  );

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
    if (loading || isSourceMode) return;

    const findToolbar = () => {
      const toolbar = editorRef.current?.querySelector(
        ".zenmark-editor__header.zenmark-toolbar"
      ) as HTMLElement | null;
      if (toolbar) {
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
          } else if (headerLeftContainerRef.current.parentNode !== headerLeft) {
            headerLeft.appendChild(headerLeftContainerRef.current);
          }
          setHeaderLeftElement(headerLeftContainerRef.current);
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
      if (headerLeftContainerRef.current && headerLeftContainerRef.current.parentNode) {
        headerLeftContainerRef.current.parentNode.removeChild(headerLeftContainerRef.current);
        headerLeftContainerRef.current = null;
      }
      setHeaderLeftElement(null);
    };
  }, [loading, content, isSourceMode]);

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
      console.error("[MeetingMinutes] Failed to beautify markdown:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      xbook.notificationService.error(`美化失败：${errorMessage}`);
    } finally {
      setIsBeautifying(false);
    }
  }, [content, isBeautifying, setContent]);

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

  if (loading) {
    return <div>加载中...</div>;
  }

  const sourceModeToggleButton = (
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
      title={isSourceMode ? "切换到预览模式 (Ctrl+/)" : "切换到源码模式 (Ctrl+/)"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: "8px",
        right: "8px",
        zIndex: 10,
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

  return (
    <div ref={editorRef} style={{ height: "100%", position: "relative" }}>
      {isSourceMode ? (
        <div style={{ position: "relative", height: "100%" }}>
          {sourceModeToggleButton}
          <React.Suspense fallback={<div>加载编辑器中...</div>}>
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
          {sourceModeToggleButton}
          <ZenmarkEditor
            key={uri}
            value={content}
            onChange={handleZenmarkChange}
            onKeyDown={handleKeyDown}
          />
          {!isSourceMode && headerLeftElement && createPortal(
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
            </button>,
            headerLeftElement
          )}
        </>
      )}
    </div>
  );
};

