import { useDocument } from "@/hooks/use-document";
import { TabIconButton } from "@/xbook/ui/components/tab";
import { CommandKeys } from "xbook/constants/tokens";
import { commandService } from "xbook/services/commandService";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@chakra-ui/react";
import { AiOutlineMenuFold } from "react-icons/ai";
import {
  KeyCode,
  KeyMod,
  matchesKeybinding,
  ZenmarkEditor,
} from "zenmark-editor";
import { useGlobalSidecar } from "@/features/global-sidecar-providers";
import { AIAssistantIcon } from "@/components/icons/ai-assistant-icon";
import { cn } from "@/toolkit/utils/shadcn-utils";

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
  const { open, activePaneId, openPane, closePane } = useGlobalSidecar();

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) &&
        (event.key === "s" || event.key === "S") &&
        !event.shiftKey;

      if (
        isSaveShortcut &&
        editorRef.current?.contains(document.activeElement)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        flush();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
    };
  }, [flush]);

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
    };
  }, [loading, content]);

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

  const handleKeyDown = (event: {
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
    return false;
  };

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

  const aiAssistantActive = activePaneId === "global-chat" && open;
  const aiAssistantButton = rightButtonContainerRef.current ? (
    <button
      onClick={() => {
        if (aiAssistantActive) {
          closePane();
        } else {
          openPane("global-chat");
        }
      }}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out",
        aiAssistantActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
      title="AI Assistant"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AIAssistantIcon
        className={cn(
          "h-5 w-5 transition-transform duration-200",
          aiAssistantActive ? "scale-100" : "group-hover:scale-110"
        )}
      />
    </button>
  ) : null;

  return (
    <div
      ref={editorRef}
      style={{ height: "100%" }}
    >
      <ZenmarkEditor
        value={content}
        onChange={(newContent) => {
          setContent(newContent);
        }}
        onKeyDown={handleKeyDown}
      />
      {toolbarElement && createPortal(toggleButton, toolbarElement)}
      {rightButtonContainerRef.current && createPortal(aiAssistantButton, rightButtonContainerRef.current)}
    </div>
  );
};
