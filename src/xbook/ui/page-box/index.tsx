import {
  Box,
  Flex,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  VStack,
  forwardRef,
} from "@chakra-ui/react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineClose,
  AiOutlineCloseCircle,
  AiOutlineMenu,
  AiOutlineMenuFold,
} from "react-icons/ai";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { device } from "xbook/common/device";
import { CommandKeys } from "xbook/constants/tokens";
import { commandService } from "xbook/services/commandService";
import { DragSortItem, moveItem } from "xbook/ui/components/DragSort";
import { PageActions } from "xbook/ui/page-box/components/page-actions";
import { PageBoxController } from "xbook/ui/page-box/controller";
import { componentService } from "../componentService";
import { Tab, TabIconButton } from "../components/tab";
import { BottomScrollbar } from "./components/bottom-scrollbar";
import { useGlobalSidecar } from "xbook/global-sidecar/global-sidecar-context";
import { AIAssistantIcon } from "@/components/icons/ai-assistant-icon";
import { cn } from "@/toolkit/utils/shadcn-utils";

export const createPageBox = (): {
  proxy: ReturnType<typeof PageBoxController.create>;
  instance: ReactNode;
} => {
  const pageBoxController = PageBoxController.create();
  (window as any).pageBoxController = pageBoxController;

  const PageBoxView = () => {
    const proxy = pageBoxController;
    const {
      maxTabWidth,
      minTabWidth,
      usePageList,
      getPageList,
      setPageList,
      useTabBarCapacity,
      useTabBarVisible,
      useVisible,
    } = proxy;
    const pageList = usePageList();
    const tabBarCapacity = useTabBarCapacity();
    const tabBarVisible = useTabBarVisible();
    const visible = useVisible();
    const tabBarRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const [sidebarLeftOffset, setSidebarLeftOffset] = useState(0);
    const { open, activePaneId, openPane, closePane } = useGlobalSidecar();
    
    const tabBarRightOffset = useMemo(() => {
      if (open && activePaneId) {
        return "var(--global-ai-sidebar-width, clamp(280px, 80vw, 400px))";
      }
      return 0;
    }, [open, activePaneId]);
    
    useEffect(() => {
      if (tabBarRef.current) {
        return proxy.observeTabBar(tabBarRef.current);
      }
      return () => {};
    }, []);

    useEffect(() => {
      const updateSidebarOffset = () => {
        const pageBoxElement = document.querySelector(".page-box") as HTMLElement;
        if (pageBoxElement) {
          const rect = pageBoxElement.getBoundingClientRect();
          setSidebarLeftOffset(rect.left);
        } else {
          const rightPane = document.querySelector(".split-pane .right.pane") as HTMLElement;
          if (rightPane) {
            const rect = rightPane.getBoundingClientRect();
            setSidebarLeftOffset(rect.left);
          } else {
            const splitPane = document.querySelector(".split-pane");
            if (splitPane) {
              const leftPane = splitPane.querySelector(".left.pane") as HTMLElement;
              const resizer = splitPane.querySelector(".resizer-wrapper") as HTMLElement;
              if (leftPane) {
                const leftWidth = leftPane.offsetWidth;
                const resizerWidth = resizer ? resizer.offsetWidth : 0;
                const activityBar = document.querySelector(".activity-bar") as HTMLElement;
                const activityBarWidth = activityBar ? activityBar.offsetWidth : 0;
                const totalWidth = activityBarWidth + leftWidth + resizerWidth;
                setSidebarLeftOffset(totalWidth);
              } else {
                const activityBar = document.querySelector(".activity-bar") as HTMLElement;
                const activityBarWidth = activityBar ? activityBar.offsetWidth : 0;
                setSidebarLeftOffset(activityBarWidth);
              }
            } else {
              const activityBar = document.querySelector(".activity-bar") as HTMLElement;
              const activityBarWidth = activityBar ? activityBar.offsetWidth : 0;
              setSidebarLeftOffset(activityBarWidth);
            }
          }
        }
      };

      updateSidebarOffset();

      const resizeObserver = new ResizeObserver(() => {
        updateSidebarOffset();
      });

      const pageBoxElement = document.querySelector(".page-box");
      const splitPane = document.querySelector(".split-pane");
      const activityBar = document.querySelector(".activity-bar");
      
      if (pageBoxElement) {
        resizeObserver.observe(pageBoxElement);
      }
      if (splitPane) {
        resizeObserver.observe(splitPane);
      }
      if (activityBar) {
        resizeObserver.observe(activityBar);
      }

      const intervalId = setInterval(updateSidebarOffset, 100);

      return () => {
        resizeObserver.disconnect();
        clearInterval(intervalId);
      };
    }, [tabBarVisible, visible]);

    useEffect(() => {
      if (tabBarRef.current && !device.isMobile()) {
        const simplebarContent = tabBarRef.current.querySelector(
          ".simplebar-content"
        ) as HTMLElement;
        if (simplebarContent) {
          scrollContainerRef.current = simplebarContent;
        }
      }
    }, [tabBarVisible, pageList]);

    const getPageActions = (id: string) => {
      return [
        {
          label: "关闭右侧标签页",
          icon: AiOutlineArrowRight,
          onClick: () => {
            const currentIndex = pageList.findIndex((page) => page.id === id);
            const rightPages = pageList.slice(currentIndex + 1);
            rightPages.forEach((page) => proxy.removePage(page.id));
          },
        },
        {
          label: "关闭左侧标签页",
          icon: AiOutlineArrowLeft,
          onClick: () => {
            const currentIndex = pageList.findIndex((page) => page.id === id);
            const leftPages = pageList.slice(0, currentIndex);
            leftPages.forEach((page) => proxy.removePage(page.id));
          },
        },
        {
          label: "关闭其它标签页",
          icon: AiOutlineClose,
          onClick: () => {
            pageList.forEach((page) => {
              if (page.id !== id) {
                proxy.removePage(page.id);
              }
            });
          },
        },
        {
          label: "关闭所有标签页",
          icon: AiOutlineCloseCircle,
          onClick: () => {
            pageList.forEach((page) => {
              proxy.removePage(page.id);
            });
          },
        },
      ];
    };

    const tabsView = useMemo(
      () =>
        pageList.map(({ id, title, active, status }, index) => {
          return device.isMobile() ? (
            <Tab
              minWidth={minTabWidth}
              maxWidth={maxTabWidth}
              key={id}
              title={title}
              status={status}
              isActive={active}
              onClick={() => {
                proxy.showPage(id);
              }}
              onClose={() => {
                proxy.removePage(id);
              }}
              actions={getPageActions(id)}
            />
          ) : (
            <DragSortItem
              style={{ height: "100%" }}
              key={id}
              id={id}
              index={index}
              moveItem={(idx1: number, idx2: number) => {
                setPageList(moveItem(getPageList(), idx1, idx2));
              }}
            >
              <Tab
                minWidth={minTabWidth}
                maxWidth={maxTabWidth}
                key={id}
                title={title}
                status={status}
                isActive={active}
                onClick={() => {
                  proxy.showPage(id);
                }}
                onClose={() => {
                  proxy.removePage(id);
                }}
                actions={getPageActions(id)}
              />
            </DragSortItem>
          );
        }),
      [pageList, minTabWidth, maxTabWidth, proxy]
    );

    const tabBarRight = useMemo(
      () => {
        const aiAssistantActive = activePaneId === "global-chat" && open;
        return (
          <>
            <>
              <Flex
                align={"center"}
                h="100%"
                flexShrink={0}
                flexGrow={0}
                className="tab-bar-right-extra"
              >
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
                <PageActions />
                {pageList.length > tabBarCapacity && (
                  <Menu>
                    <MenuButton
                      as={forwardRef((props, ref) => (
                        <TabIconButton {...props} ref={ref}>
                          <Icon fontSize={"lg"} as={AiOutlineMenu} />
                        </TabIconButton>
                      ))}
                    ></MenuButton>
                    <MenuList maxW="400px" className="right-list" zIndex={100}>
                      {pageList.slice(0).map(({ title, id, active, status }) => (
                        <MenuItem key={id}>
                          <Tab
                            minWidth={minTabWidth}
                            title={title}
                            isActive={active}
                            onClick={() => proxy.showPage(id)}
                            onClose={() => proxy.removePage(id)}
                            status={status}
                            stretch
                            actions={getPageActions(id)}
                          />
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                )}
              </Flex>
            </>
          </>
        );
      },
      [pageList, tabBarCapacity, open, activePaneId, openPane, closePane]
    );

    const bodiesView = useMemo(
      () =>
        pageList.map((page) => {
          const { id, active, viewData } = page;
          let finalView;
          if (viewData) {
            finalView = componentService.render(viewData);
          }
          return (
            <Box
              key={id}
              m="0 !important"
              h="100%"
              w="100%"
              id={id}
              overflow={"auto"}
              display={active ? "block" : "none"}
            >
              {finalView}
            </Box>
          );
        }),
      [pageList]
    );

    return (
      <PageBoxController.Provider value={pageBoxController}>
        <VStack
          w="100%"
          h="100%"
          align="stretch"
          className="page-box"
          overflow={"hidden"}
          display={visible ? "flex" : "none"}
          gap={0}
          position="relative"
        >
          <>
            {
              <Box
                key="body"
                flexBasis={"100%"}
                m="0 !important"
                className={"content-area"}
                h="100%"
                overflow={"hidden"}
                pb={tabBarVisible ? "40px" : 0}
              >
                {bodiesView}
              </Box>
            }
          </>
          <>
            {tabBarVisible && (
              <HStack
                ref={tabBarRef}
                key={"tab-bar"}
                h={"40px"}
                minH={"40px"}
                className="tab-bar"
                gap={0}
                zIndex={999999}
                position="fixed"
                bottom={0}
                left={`${sidebarLeftOffset}px`}
                right={tabBarRightOffset === 0 ? 0 : undefined}
                bg="var(--chakra-colors-chakra-body-bg, white)"
                borderTop="1px solid"
                borderColor="var(--chakra-colors-gray-200, #E2E8F0)"
                style={{
                  ...(tabBarRightOffset !== 0 && {
                    right: tabBarRightOffset,
                  }),
                }}
              >
                <TabIconButton
                  className="tab-bar-left-extra"
                  onClick={() => {
                    commandService.executeCommand(CommandKeys.ToggleHome);
                  }}
                >
                  <Icon fontSize={"lg"} as={AiOutlineMenuFold} />
                </TabIconButton>
                <HStack
                  className="tab-bar-content scroll scroll-9"
                  flexGrow={1}
                  h="100%"
                  overflowY={"hidden"}
                  overflowX="hidden"
                  gap={0}
                  position="relative"
                >
                  {device.isMobile() ? (
                    tabsView
                  ) : (
                    <>
                      <SimpleBar
                        autoHide={false}
                        style={{
                          width: "100%",
                          display: "flex",
                          height: "100%",
                          flexFlow: "row",
                        }}
                      >
                        {tabsView}
                      </SimpleBar>
                      <BottomScrollbar
                        scrollContainerRef={scrollContainerRef}
                      />
                    </>
                  )}
                </HStack>
                {tabBarRight}
              </HStack>
            )}
          </>
        </VStack>
      </PageBoxController.Provider>
    );
  };
  return {
    proxy: pageBoxController,
    instance: <PageBoxView />,
  };
};
