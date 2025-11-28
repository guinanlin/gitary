import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDocument } from "@/hooks/use-document";
import { MonacoKeyCode, MonacoKeyMod } from "@/monaco/keys";
import { CustomMonacoEditor } from "@/components/custom-monaco-editor";
import React from "react";
import { Icon } from "@chakra-ui/react";
import { AiOutlineCode, AiOutlineEye } from "react-icons/ai";
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
        </>
      )}
    </div>
  );
};

