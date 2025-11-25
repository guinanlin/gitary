import { useGlobalContext } from "@/toolkit/components/context";
import { Action } from "@/toolkit/types";
import { Flex, HStack, IconButton, Text, Tooltip, VStack } from "@chakra-ui/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FC, ReactNode, useState } from "react";
import React from "react";
import { AiOutlineSetting } from "react-icons/ai";
import { GitCommit } from "lucide-react";
import xbook from "xbook/index";
import { EventKeys } from "@/constants/eventKeys";
import { GitCommitPanel } from "@/features/git-commit-panel/components/git-commit-panel";
import { spaceHelper } from "@/helpers/space.helper";
import { stagingService } from "@/services/staging.service";

export const SideCard: FC<{
  title: ReactNode;
  className?: string;
  actions: Action[];
  children: ReactNode;
  spaceId?: string;
}> = ({ title, children, className = "", actions, spaceId }) => {
  const context = useGlobalContext();
  const [commitPanelOpen, setCommitPanelOpen] = useState(false);
  const [stagedCount, setStagedCount] = useState(0);

  React.useEffect(() => {
    if (!spaceId) return;
    
    const updateStagedCount = () => {
      const files = stagingService.getStagedFiles(spaceId);
      setStagedCount(files.length);
    };

    updateStagedCount();
    const unsubscribe = stagingService.subscribe(spaceId, updateStagedCount);

    return unsubscribe;
  }, [spaceId]);

  return (
    <VStack
      className={["side-card", className].join(" ")}
      w="100%"
      h="100%"
      overflow={"hidden"}
      flexShrink={0}
      gap={0}
    >
      <DropdownMenu>
        <HStack
          w="100%"
          h="2.5rem"
          align={"center"}
          flexShrink={0}
          className="header"
          px={4}
          py={2}
          bg="gray.100"
          _dark={{ bg: "gray.800",borderColor: "gray.700"  }}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Flex align={"center"} w="100%">
            <Tooltip label={title}>
              <>
                {typeof title === "string" ? (
                  <Text
                    as="b"
                    textOverflow={"ellipsis"}
                    whiteSpace={"nowrap"}
                    overflow="hidden"
                    fontSize="lg"
                    color="gray.800"
                    _dark={{ color: "gray.200" }}
                  >
                    {title}
                  </Text>
                ) : (
                  title
                )}
              </>
            </Tooltip>
            <HStack gap={1} ml="auto">
              {spaceId && (
                <Tooltip label={stagedCount > 0 ? `${stagedCount} file(s) staged` : "No staged files"}>
                  <IconButton
                    aria-label="Commit"
                    icon={<GitCommit className="w-4 h-4" />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommitPanelOpen(true)}
                    isDisabled={stagedCount === 0}
                    _hover={{ bg: "gray.200", _dark: { bg: "gray.600" } }}
                    position="relative"
                  >
                    {stagedCount > 0 && (
                      <Text
                        position="absolute"
                        top="-1"
                        right="-1"
                        bg="blue.500"
                        color="white"
                        borderRadius="full"
                        fontSize="xs"
                        w="4"
                        h="4"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                        lineHeight="1"
                      >
                        {stagedCount > 9 ? "9+" : stagedCount}
                      </Text>
                    )}
                  </IconButton>
                </Tooltip>
              )}
              <DropdownMenuTrigger asChild>
                <IconButton
                  aria-label="Options"
                  icon={<AiOutlineSetting />}
                  variant="ghost"
                  size="sm"
                  _hover={{ bg: "gray.200", _dark: { bg: "gray.600" } }}
                />
              </DropdownMenuTrigger>
            </HStack>
          </Flex>
        </HStack>
        {/* Use shadcn dropdown for consistent popover styling across the app */}
        <DropdownMenuContent align="start" sideOffset={4} className="min-w-40">
          {actions.map((a) => {
            const eventMap = {};
            if (a.events && a.id) {
              a.events.forEach((e) =>
                // Emit both legacy and unified action events for compatibility
                (eventMap[`on${e}`] = (event: Event) => {
                  xbook.eventBus.emit(`${a.id}::${e}`, {
                    event,
                    context,
                  });
                  if (a.id && e.toLowerCase() === "click") {
                    xbook.eventBus.emit(EventKeys.Action.Clicked(a.id), {
                      event,
                      context,
                    });
                  }
                })
              );
            }

            return (
              <DropdownMenuItem
                key={a.title}
                {...eventMap}
              >
                {/* Optional leading icon (kept for compatibility with existing actions) */}
                {a.icon}
                {a.title}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {spaceId && (
        <GitCommitPanel
          spaceId={spaceId}
          open={commitPanelOpen}
          onOpenChange={setCommitPanelOpen}
        />
      )}
      <VStack m="0 !important" w="100%" flexGrow={1} overflow="hidden" gap={0}>
        <VStack
          w="100%"
          height={"100%"}
          overflowX={"hidden"}
          className="flex-container-limited"
          gap={0}
        >
          {children}
        </VStack>
      </VStack>
    </VStack>
  );
};

export default SideCard;
