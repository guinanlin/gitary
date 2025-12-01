import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, Square, Copy, Check, Plus } from "lucide-react";
import { useColorMode } from "@chakra-ui/react";
import { AIAssistantIcon } from "@/components/icons/ai-assistant-icon";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/toolkit/utils/shadcn-utils";
import { useStickyAutoScroll } from "@/hooks/use-sticky-autoscroll";
import { useObservable } from "@/features/search/hooks/useObservable";
import { aiProviderStore } from "@/services/ai/ai-provider.store";
import { PROVIDER_CONFIGS, type AIProviderName } from "@/services/ai/providers";
import { aiContextService } from "@/services/ai/context-service";
import { spaceHelper } from "@/helpers/space.helper";
import { ToolInvocationList } from "@/features/global-sidecar-providers/components/tool-invocation-list";
import { getGitaryModel, getGitarySystemPrompt, getGitaryTools, MAX_TOOL_STEPS } from "@/services/ai/gitary-agent";
import { streamText, stepCountIs } from "ai";
import { chatCacheService } from "@/services/ai/chat-cache.service";
import type { ChatMessage } from "@dty/ai-assistant-core";

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts?: Array<{
    type: string;
    text?: string;
    toolInvocation?: any;
    [key: string]: any;
  }>;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    status: string;
    args: unknown;
    result?: unknown;
    error?: string;
  }>;
}

const PROVIDER_OPTIONS = Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
  value: key as AIProviderName,
  label: config.defaultModel || key,
}));

const CopyButton = ({ content, isGenerating }: { content: string; isGenerating?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={isGenerating}
      className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
      title="复制内容"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

function extractTextFromUIMessage(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .filter((part) => part.type === "text")
    .map((part: any) => part.text as string)
    .join("\n\n");
}

function convertUIMessageToAIMessage(message: UIMessage): Array<any> {
  const messages: Array<any> = [];
  let textContent = extractTextFromUIMessage(message);
  
  if (message.role === "assistant" && message.toolInvocations && message.toolInvocations.length > 0) {
    const completedInvocations = message.toolInvocations.filter(
      inv => inv.status === 'result' || inv.status === 'error'
    );
    
    if (completedInvocations.length > 0) {
      const toolResultsText: string[] = [];
      
      for (const inv of completedInvocations) {
        if (inv.status === 'result' && inv.result !== undefined) {
          let resultContent: string;
          if (typeof inv.result === 'string') {
            resultContent = inv.result;
          } else if (inv.result && typeof inv.result === 'object') {
            if ('kind' in inv.result && inv.result.kind === 'file') {
              const fileResult = inv.result as any;
              if (fileResult.content) {
                resultContent = fileResult.content;
              } else {
                resultContent = JSON.stringify(inv.result, null, 2);
              }
            } else {
              resultContent = JSON.stringify(inv.result, null, 2);
            }
          } else {
            resultContent = String(inv.result);
          }
          
          toolResultsText.push(`[工具 ${inv.toolName} 的结果]:\n${resultContent}`);
        } else if (inv.status === 'error' && inv.error) {
          toolResultsText.push(`[工具 ${inv.toolName} 错误]: ${inv.error}`);
        }
      }
      
      const combinedContent = textContent 
        ? `${textContent}\n\n${toolResultsText.join('\n\n')}`
        : toolResultsText.join('\n\n');
      
      messages.push({
        role: "assistant" as const,
        content: combinedContent,
      });
    } else {
      if (textContent) {
        messages.push({
          role: "assistant" as const,
          content: textContent,
        });
      }
    }
  } else {
    if (textContent || message.role === "user") {
      messages.push({
        role: message.role,
        content: textContent || "",
      });
    }
  }
  
  return messages;
}

interface GlobalChatPanelProps {
  closePane?: () => void;
  onNewConversation?: (handler: () => void) => void;
}

export const GlobalChatPanel = ({ closePane, onNewConversation }: GlobalChatPanelProps = {}) => {
  const { t } = useTranslation();
  const { colorMode } = useColorMode();
  const [input, setInput] = useState("");
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>("global");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentProvider = useObservable(
    aiProviderStore.provider$,
    aiProviderStore.getProvider()
  );

  const { containerRef, notifyNewItem, scrollToBottom } = useStickyAutoScroll({ threshold: 80 });

  const lastAssistantId = useMemo(() => {
    const reversed = [...messages].reverse();
    const last = reversed.find((m) => m.role === "assistant");
    return last?.id;
  }, [messages]);

  const defaultConversationId = useMemo(() => {
    return currentSpaceId ? `default-${currentSpaceId}` : "global";
  }, [currentSpaceId]);

  useEffect(() => {
    let cancelled = false;

    const updateContext = async () => {
      try {
        const pageCtx = await aiContextService.getCurrentPageContext();
        const uri = pageCtx?.uri;

        if (cancelled) return;

        if (uri) {
          const spaceId = spaceHelper.getSpaceIdFromUri(uri);
          if (!cancelled) {
            setCurrentSpaceId(spaceId);
            const newDefaultConversationId = spaceId ? `default-${spaceId}` : "global";
            setConversationId(newDefaultConversationId);
          }
        } else {
          if (!cancelled) {
            setCurrentSpaceId(null);
            setConversationId("global");
          }
        }
      } catch {
        if (!cancelled) {
          setCurrentSpaceId(null);
          setConversationId("global");
        }
      }
    };

    updateContext();

    const layoutService = (window as any).xbook?.layoutService;
    const pageBox = layoutService?.pageBox;
    const subscription = pageBox?.currentPage$?.subscribe(() => {
      if (!cancelled) {
        updateContext();
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const cachedMessages = chatCacheService.getMessages(conversationId);
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages as UIMessage[]);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    notifyNewItem();
  }, [messages, notifyNewItem]);

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (messages.length > 0) {
      saveTimerRef.current = setTimeout(() => {
        chatCacheService.setMessages(conversationId, messages as ChatMessage[], currentSpaceId);
      }, 500);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages, conversationId, currentSpaceId]);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isAgentResponding) return;

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAgentResponding(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const model = getGitaryModel();
      const tools = getGitaryTools();
      const systemPrompt = getGitarySystemPrompt(
        currentSpaceId ? [{ description: "current_space_id", value: currentSpaceId }] : []
      );

      const MAX_HISTORY_MESSAGES = 10;
      const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);
      
      const historyMessages = recentMessages.flatMap(msg => convertUIMessageToAIMessage(msg));
      
      const result = streamText({
        model,
        system: systemPrompt,
        messages: [
          ...historyMessages,
          { role: "user" as const, content: prompt },
        ],
        tools,
        stopWhen: stepCountIs(MAX_TOOL_STEPS),
        abortSignal: abortController.signal,
      });

      const assistantMessage: UIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        parts: [],
        toolInvocations: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const processedToolCallIds = new Set<string>();
      let lastToolCheckTime = 0;
      const TOOL_CHECK_INTERVAL = 100;

      const getToolCallingMessage = (toolName: string, args: any): string => {
        if (toolName === 'getWeather') {
          const city = typeof args === 'object' && args?.city ? args.city : '指定城市';
          return `正在调用工具为您查询${city}的天气信息，请稍候...`;
        }
        if (toolName === 'fs_readdir') {
          const path = typeof args === 'object' && args?.path ? args.path : '当前目录';
          return `正在调用工具查询${path}下的文件和目录，请稍候...`;
        }
        if (toolName === 'fs_readFile') {
          const path = typeof args === 'object' && args?.path ? args.path : '文件';
          return `正在调用工具读取${path}的内容，请稍候...`;
        }
        if (toolName === 'fs_stat') {
          const path = typeof args === 'object' && args?.path ? args.path : '文件';
          return `正在调用工具获取${path}的详细信息，请稍候...`;
        }
        if (toolName === 'get_workspace_context') {
          return `正在调用工具获取当前工作空间上下文，请稍候...`;
        }
        return `正在调用工具处理您的请求，请稍候...`;
      };

      const updateToolInvocations = async () => {
        try {
          const currentToolCalls = await result.toolCalls;
          const currentToolResults = await result.toolResults;
          
          if (currentToolCalls && currentToolCalls.length > 0) {
            const toolResultsMap = new Map();
            if (currentToolResults && currentToolResults.length > 0) {
              for (const tr of currentToolResults) {
                toolResultsMap.set(tr.toolCallId, tr);
              }
            }
            
            const newToolInvocations = currentToolCalls
              .filter((tc) => !processedToolCallIds.has(tc.toolCallId))
              .map((tc) => {
                processedToolCallIds.add(tc.toolCallId);
                const args = "args" in tc ? tc.args : ("input" in tc ? tc.input : {});
                const toolResult = toolResultsMap.get(tc.toolCallId);
                
                let resultValue: any = undefined;
                let errorValue: string | undefined = undefined;
                let status: string = toolResult ? 'result' : 'call';
                
                if (toolResult) {
                  if (toolResult.type === 'tool-error') {
                    status = 'error';
                    errorValue = String(toolResult.error || toolResult.result || toolResult.output || 'Unknown error');
                  } else {
                    status = 'result';
                    resultValue = toolResult.output !== undefined ? toolResult.output : 
                                 (toolResult.result !== undefined ? toolResult.result : 
                                  (toolResult.value !== undefined ? toolResult.value : undefined));
                  }
                }
                
                return {
                  toolCallId: tc.toolCallId,
                  toolName: tc.toolName,
                  status,
                  args,
                  result: resultValue,
                  error: errorValue,
                };
              });
            
            if (newToolInvocations.length > 0) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantMessage.id) {
                  const existingInvocations = last.toolInvocations || [];
                  const updatedInvocations = [...existingInvocations];
                  let hasNewCall = false;
                  
                  for (const newInv of newToolInvocations) {
                    const existingIdx = updatedInvocations.findIndex(
                      (inv) => inv.toolCallId === newInv.toolCallId
                    );
                    if (existingIdx >= 0) {
                      updatedInvocations[existingIdx] = newInv;
                    } else {
                      updatedInvocations.push(newInv);
                      if (newInv.status === 'call') {
                        hasNewCall = true;
                      }
                    }
                  }
                  
                  let updatedMessage = { ...last, toolInvocations: updatedInvocations };
                  
                  if (hasNewCall) {
                    const callingMessages = newToolInvocations
                      .filter(inv => inv.status === 'call')
                      .map(inv => getToolCallingMessage(inv.toolName, inv.args));
                    
                    if (callingMessages.length > 0) {
                      const existingTextParts = updatedMessage.parts?.filter((p) => p.type === "text") || [];
                      const existingText = existingTextParts[0]?.text || '';
                      const newText = callingMessages.join('\n');
                      
                      if (!existingText || !existingText.includes('正在调用工具')) {
                        const otherParts = updatedMessage.parts?.filter((p) => p.type !== "text") || [];
                        updatedMessage.parts = [
                          ...otherParts,
                          { type: "text", text: existingText ? `${existingText}\n\n${newText}` : newText },
                        ];
                      }
                    }
                  }
                  
                  return [
                    ...prev.slice(0, -1),
                    updatedMessage,
                  ];
                }
                return prev;
              });
            }
          }
        } catch (e) {
          console.warn('[GlobalChatPanel] Error processing tool calls during streaming:', e);
        }
      };

      for await (const chunk of result.textStream) {
        if (abortController.signal.aborted) break;

        let filteredChunk = chunk;
        
        filteredChunk = filteredChunk.replace(/<\|tool_call_end\|>/g, '');
        filteredChunk = filteredChunk.replace(/<\|tool_calls_section_end\|>/g, '');
        
        if (filteredChunk.trim() && !/^[\s\n]*[{}[\]]+[\s\n]*$/.test(filteredChunk)) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantMessage.id) {
              const textParts = last.parts?.filter((p) => p.type === "text") || [];
              const otherParts = last.parts?.filter((p) => p.type !== "text") || [];
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  parts: [
                    ...otherParts,
                    { type: "text", text: (textParts[0]?.text || "") + filteredChunk },
                  ],
                },
              ];
            }
            return prev;
          });
        }

        const now = Date.now();
        if (now - lastToolCheckTime >= TOOL_CHECK_INTERVAL) {
          lastToolCheckTime = now;
          updateToolInvocations();
        }
      }

      await updateToolInvocations();

      const finalResult = await result;
      const toolCalls = await finalResult.toolCalls;
      const toolResults = await finalResult.toolResults;
      let finalText = await finalResult.text;
      
      console.log('[GlobalChatPanel] Final result:', {
        text: finalText,
        toolCalls: toolCalls,
        toolResults: toolResults,
        steps: finalResult.steps,
      });
      
      console.log('[GlobalChatPanel] Tool calls received:', toolCalls);
      console.log('[GlobalChatPanel] Tool results received:', toolResults);
      
      if (toolCalls && toolCalls.length > 0 && finalText) {
        const toolArgsSet = new Set<string>();
        
        for (const tc of toolCalls) {
          const args = "args" in tc ? tc.args : ("input" in tc ? tc.input : {});
          try {
            const argsJson = typeof args === 'string' ? args : JSON.stringify(args);
            toolArgsSet.add(argsJson);
            toolArgsSet.add(argsJson.replace(/\s+/g, ''));
            toolArgsSet.add(argsJson.replace(/\s+/g, ' '));
            toolArgsSet.add(JSON.stringify(args, null, 2));
          } catch (e) {
            console.warn('[GlobalChatPanel] Failed to serialize args:', e);
          }
        }
        
        let cleanedText = finalText;
        for (const argsJson of toolArgsSet) {
          if (argsJson && cleanedText.includes(argsJson)) {
            cleanedText = cleanedText.replace(new RegExp(argsJson.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
          }
        }
        
        cleanedText = cleanedText.replace(/<\|tool_call_end\|>/g, '').replace(/<\|tool_calls_section_end\|>/g, '').trim();
        
        if (cleanedText.trim() === '' || /^[\s\n]*[{}[\]]+[\s\n]*$/.test(cleanedText)) {
          finalText = '';
        } else {
          finalText = cleanedText;
        }
      }
      
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === assistantMessage.id) {
          let updatedMessage = { ...last };
          
          const existingTextParts = updatedMessage.parts?.filter((p) => p.type === "text") || [];
          const existingText = existingTextParts[0]?.text || '';
          
          if (finalText && finalText.trim() && finalText !== existingText) {
            const otherParts = updatedMessage.parts?.filter((p) => p.type !== "text") || [];
            updatedMessage.parts = [
              ...otherParts,
              { type: "text", text: finalText.trim() },
            ];
          } else if (!finalText || !finalText.trim()) {
            updatedMessage.parts = updatedMessage.parts?.filter((p) => p.type !== "text") || [];
          }
          
          if (toolCalls && toolCalls.length > 0) {
            console.log('[GlobalChatPanel] Processing', toolCalls.length, 'tool calls');
            
            const toolResultsMap = new Map();
            if (toolResults && toolResults.length > 0) {
              for (const tr of toolResults) {
                toolResultsMap.set(tr.toolCallId, tr);
              }
            }
            
            const toolInvocations = toolCalls.map((tc) => {
              const args = "args" in tc ? tc.args : ("input" in tc ? tc.input : {});
              const toolResult = toolResultsMap.get(tc.toolCallId);
              
              console.log('[GlobalChatPanel] Tool call:', {
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                args,
                hasResult: !!toolResult,
                toolResultFull: toolResult,
                toolResultType: toolResult?.type,
                toolResultOutput: toolResult?.output,
                toolResultKeys: toolResult ? Object.keys(toolResult) : [],
              });
              
              let resultValue: any = undefined;
              let errorValue: string | undefined = undefined;
              let status: string = 'call';
              
              if (toolResult) {
                if (toolResult.type === 'tool-error') {
                  status = 'error';
                  errorValue = String(toolResult.error || toolResult.result || toolResult.output || 'Unknown error');
                } else {
                  status = 'result';
                  resultValue = toolResult.output !== undefined ? toolResult.output : 
                               (toolResult.result !== undefined ? toolResult.result : 
                                (toolResult.value !== undefined ? toolResult.value : 
                                 (typeof toolResult === 'string' ? toolResult : 
                                  (toolResult && typeof toolResult === 'object' && !toolResult.type ? toolResult : undefined))));
                }
              }
              
              return {
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                status,
                args,
                result: resultValue,
                error: errorValue,
              };
            });

            console.log('[GlobalChatPanel] Setting tool invocations:', toolInvocations);
            updatedMessage.toolInvocations = toolInvocations;
          }
          
          return [
            ...prev.slice(0, -1),
            updatedMessage,
          ];
        }
        return prev;
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Global AI assistant error:", error);
    } finally {
      setIsAgentResponding(false);
      abortControllerRef.current = null;
    }
  }, [messages, currentSpaceId, isAgentResponding]);

  const abortAgentRun = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAgentResponding(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    abortAgentRun();
    setMessages([]);
    setInput("");
    chatCacheService.setMessages(conversationId, [], currentSpaceId);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  }, [conversationId, currentSpaceId, abortAgentRun]);

  useEffect(() => {
    if (onNewConversation) {
      onNewConversation(startNewConversation);
    }
  }, [onNewConversation, startNewConversation]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = "40px";
    const newHeight = Math.min(Math.max(target.scrollHeight, 40), 200);
    target.style.height = `${newHeight}px`;
  };

  const handleSend = async () => {
    if (isAgentResponding) {
      abortAgentRun();
      return;
    }
    if (!input.trim()) return;
    const prompt = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
    try {
      await sendMessage(prompt);
    } catch (error) {
      console.error("Global AI assistant error:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
      scrollToBottom();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        ref={containerRef}
      >
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 mb-6">
                <AIAssistantIcon className="w-full h-full" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">
                {t("globalChat.welcomeTitle") || "How can I help you today?"}
              </h3>
              <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                {t("globalChat.welcomeDesc") ||
                  "I'm your global AI assistant. Whether it's code problems, creative writing, or everyday chat, I'm happy to help."}
              </p>
            </div>
          )}
          <div className="py-4 space-y-6">
            {messages
              .filter((msg) => msg.role === "user" || msg.role === "assistant")
              .map((msg) => {
                const contentText = extractTextFromUIMessage(msg);
                const hasContent = contentText.trim().length > 0;
                const isAssistant = msg.role === "assistant";
                const hasTools =
                  (msg.parts || []).some(
                    (part) => (part as any).type === "tool-invocation"
                  ) || (msg.toolInvocations && msg.toolInvocations.length > 0);
                const isLastAssistant =
                  isAssistant && msg.id === lastAssistantId;
                const showTyping =
                  isLastAssistant &&
                  isAgentResponding &&
                  !hasContent &&
                  !hasTools;

                return (
                  <div
                    key={msg.id}
                    className="w-full group animate-in slide-in-from-bottom-2 duration-300"
                  >
                    {isAssistant ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="px-4 group/content relative">
                          {showTyping ? (
                            <div className="flex items-center gap-2 text-muted-foreground h-7">
                              <span className="w-1.5 h-1.5 bg-violet-500/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 bg-violet-500/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 bg-violet-500/40 rounded-full animate-bounce" />
                            </div>
                          ) : hasContent ? (
                            <>
                              <MarkdownRenderer
                                content={contentText}
                                isDark={colorMode === "dark"}
                              />
                              <div className="mt-2 opacity-0 group-hover/content:opacity-100 transition-opacity">
                                <CopyButton
                                  content={contentText}
                                  isGenerating={isAgentResponding && isLastAssistant}
                                />
                              </div>
                            </>
                          ) : null}

                          <ToolInvocationList message={msg} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 items-end">
                        <div className="px-4 w-full flex justify-end">
                          <div className="bg-secondary/80 text-secondary-foreground px-4 py-2.5 rounded-[20px] rounded-tr-md shadow-sm max-w-full inline-block border border-border/5">
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {contentText}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-background z-10">
        <div className="max-w-3xl mx-auto w-full p-4">
          <div className="relative flex items-end gap-2 rounded-md bg-background border border-border p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t("globalChat.placeholder") || "输入消息..."}
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2.5 text-[15px] placeholder:text-muted-foreground/50 overflow-y-auto"
              style={{ height: "40px", minHeight: "40px", maxHeight: "200px" }}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() && !isAgentResponding}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-200 flex-shrink-0 mb-0.5 mr-0.5",
                !input.trim()
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-gradient-to-br from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 shadow-sm"
              )}
            >
              {isAgentResponding ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <Select
              value={String(currentProvider)}
              onValueChange={(value) => {
                aiProviderStore.setProvider(value as AIProviderName);
              }}
            >
              <SelectTrigger className="h-6 w-[100px] text-[10px] px-1.5 py-0.5 border-border/50 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100] min-w-[100px]">
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                    className="text-[11px] py-1.5 h-7"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
