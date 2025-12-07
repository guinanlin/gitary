import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import type { CSSProperties, ReactNode } from "react";
import { MessageCircle, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/toolkit/utils/shadcn-utils";
import {
  getRegisteredGlobalSidecarPanes,
  subscribeGlobalSidecarPanes,
  type GlobalSidecarPaneDefinition,
} from "./sidecar-pane-registry";
import { GlobalSidecarContext } from "./global-sidecar-context";
import { MarkdownOutlinePanel } from "@/features/global-sidecar-providers/panes/markdown-outline-panel";

const PANEL_WIDTH = 400;
const SIDEBAR_ANIMATION_DURATION = 200;
const CONTENT_FADE_DURATION = 150;
const CONTENT_DELAY_OFFSET = -50;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Initial value
    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Fallback for older browsers
    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return;
  }, []);

  return isMobile;
}

export const GlobalSidecarProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const isMobile = useIsMobile();
  const [panes, setPanes] = useState<Map<string, GlobalSidecarPaneDefinition>>(
    () => getRegisteredGlobalSidecarPanes()
  );
  const [open, setOpen] = useState(false);
  const [activePaneId, setActivePaneId] = useState<string | undefined>(undefined);
  const [activePaneProps, setActivePaneProps] = useState<Record<string, unknown>>({});
  const [contentVisible, setContentVisible] = useState(false);
  const [isZenmarkEditor, setIsZenmarkEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "outline">("chat");
  const newConversationTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return subscribeGlobalSidecarPanes((next) => {
      setPanes(next);
      if (next.size === 0) {
        setActivePaneId(undefined);
        setOpen(false);
      } else if (activePaneId && !next.has(activePaneId)) {
        const first = next.values().next().value;
        setActivePaneId(first?.id);
      }
    });
  }, [activePaneId]);

  useEffect(() => {
    if (open) {
      setContentVisible(false);
      const contentDisplayDelay = SIDEBAR_ANIMATION_DURATION + CONTENT_DELAY_OFFSET;
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, contentDisplayDelay);
      return () => clearTimeout(timer);
    } else {
      setContentVisible(false);
    }
  }, [open]);

  useEffect(() => {
    const checkZenmarkEditor = () => {
      const pageBoxController = (window as any).pageBoxController;
      if (pageBoxController) {
        const pageList = pageBoxController.getPageList?.() || [];
        const currentPage = pageList.find((page: any) => page.active);
        const isZenmark = currentPage?.viewData?.type === "zenmark-editor";
        setIsZenmarkEditor(isZenmark);
      } else {
        setIsZenmarkEditor(false);
      }
    };

    checkZenmarkEditor();

    const intervalId = setInterval(checkZenmarkEditor, 200);

    const pageBoxController = (window as any).pageBoxController;
    if (pageBoxController?.subscribePageList) {
      const unsubscribe = pageBoxController.subscribePageList(() => {
        checkZenmarkEditor();
      });
      return () => {
        clearInterval(intervalId);
        unsubscribe?.();
      };
    }

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const openPane = useCallback(
    (id: string, props?: Record<string, unknown>) => {
      if (!panes.has(id)) return;
      setActivePaneId(id);
      setActivePaneProps(props || {});
      setOpen(true);
    },
    [panes]
  );

  const togglePane = useCallback(
    (id: string) => {
      if (!panes.has(id)) return;
      if (open && activePaneId === id) {
        setOpen(false);
      } else {
        setActivePaneId(id);
        setOpen(true);
      }
    },
    [activePaneId, open, panes]
  );

  const closePane = useCallback(() => {
    setOpen(false);
  }, []);

  const ctxValue = useMemo(
    () => ({
      open,
      activePaneId,
      openPane,
      togglePane,
      closePane,
    }),
    [open, activePaneId, openPane, togglePane, closePane]
  );

  const paneList = useMemo(() => [...panes.values()], [panes]);
  const orderedPanes = useMemo(
    () =>
      [...paneList].sort((a, b) => {
        const ao = a.order ?? 0;
        const bo = b.order ?? 0;
        return ao - bo;
      }),
    [paneList]
  );
  const activePane = orderedPanes.find((pane) => pane.id === activePaneId);
  const ActiveComponent = activePane?.component;

  return (
    <GlobalSidecarContext.Provider value={ctxValue}>
      <div className="flex h-full w-full overflow-hidden relative">
        <div className="flex-1 min-w-0">{children}</div>
        {orderedPanes.length > 0 && (
          <>
            {isMobile && (
              <div className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-3">
                {orderedPanes.map((pane) => {
                  const Icon = pane.icon ?? MessageCircle;
                  const active = pane.id === activePaneId && open;
                  return (
                    <button
                      key={pane.id}
                      onClick={() => {
                        if (active) {
                          closePane();
                        } else {
                          openPane(pane.id);
                        }
                      }}
                      className={cn(
                        "group flex h-11 w-11 items-center justify-center rounded-full shadow-md border bg-background/95 backdrop-blur-sm transition-all",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                      title={pane.title}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            )}
            {(!isMobile || (isMobile && open)) && (
              <div
                className={cn(
                  "bg-background/95 backdrop-blur-sm z-50",
                  isMobile ? "fixed inset-0 flex justify-end" : "flex h-full relative"
                )}
                style={
                  {
                    "--global-ai-sidebar-width": `clamp(280px, 80vw, ${PANEL_WIDTH}px)`,
                  } as CSSProperties
                }
              >
                {isMobile && open && (
                  <div
                    className="absolute inset-0 bg-black/40 z-0"
                    onClick={closePane}
                  />
                )}
                <div
                  className={cn(
                    "overflow-hidden flex flex-col bg-background border-l border-border/40 transition-all ease-in-out relative z-10",
                    isMobile
                      ? open && activePane
                        ? "w-full max-w-[480px] h-full translate-x-0"
                        : "w-0 h-full translate-x-full"
                      : open && activePane
                        ? "w-[--global-ai-sidebar-width]"
                        : "w-0"
                  )}
                  style={{
                    transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
                  }}
                >
                  {open && activePane && ActiveComponent ? (
                    <div
                      className={cn(
                        "h-full flex flex-col transition-opacity",
                        contentVisible ? "opacity-100" : "opacity-0"
                      )}
                      style={{
                        transitionDuration: `${CONTENT_FADE_DURATION}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between px-4 py-1 bg-gray-100 dark:bg-gray-800 backdrop-blur-md sticky top-0 z-10 border-b border-border/40 dark:border-gray-700">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {activePane.icon && (
                            <div className="w-5 h-5 flex-shrink-0">
                              <activePane.icon className="w-full h-full" />
                            </div>
                          )}
                          {isZenmarkEditor && activePaneId === "global-chat" ? (
                            <Tabs
                              value={activeTab}
                              onValueChange={(v) => setActiveTab(v as "chat" | "outline")}
                              className="flex-1 min-w-0"
                            >
                              <TabsList className="h-8">
                                <TabsTrigger value="chat" className="text-xs px-3">
                                  AI Assistant
                                </TabsTrigger>
                                <TabsTrigger value="outline" className="text-xs px-3">
                                  大纲
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          ) : (
                            <p className="text-sm font-medium text-foreground/90 tracking-tight truncate">
                              {activePane.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {activePaneId === "global-chat" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (newConversationTriggerRef.current) {
                                  newConversationTriggerRef.current();
                                }
                              }}
                              className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors flex-shrink-0"
                              title="开启新对话"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={closePane}
                            className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors flex-shrink-0"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        {isZenmarkEditor && activePaneId === "global-chat" ? (
                          <>
                            {activeTab === "chat" && (
                              <Suspense fallback={
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              }>
                                <ActiveComponent
                                  {...activePaneProps}
                                  closePane={closePane}
                                  onNewConversation={(handler) => {
                                    newConversationTriggerRef.current = handler;
                                  }}
                                />
                              </Suspense>
                            )}
                            {activeTab === "outline" && (
                              <MarkdownOutlinePanel />
                            )}
                          </>
                        ) : (
                          <Suspense fallback={
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          }>
                            <ActiveComponent
                              {...activePaneProps}
                              closePane={closePane}
                              onNewConversation={activePaneId === "global-chat" ? (handler) => {
                                newConversationTriggerRef.current = handler;
                              } : undefined}
                            />
                          </Suspense>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </GlobalSidecarContext.Provider>
  );
};
