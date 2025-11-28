import {
  type Context as AgentContext,
  type AgentEvent,
  type Tool as AgentTool,
  type IAgent,
  type RunAgentInput,
  ToolInvocationStatus,
  type UIMessage,
} from "@agent-labs/agent-chat";
import {
  convertOpenAIChunksToAgentEventObservable,
  type OpenAIChatChunk,
} from "@agent-labs/agent-toolkit";
import { Observable, type Unsubscribable } from "rxjs";
import { aiGateway, type AIMessage } from "./gateway";
import type { AIToolCall, AIToolDefinition } from "./types";
import { aiProviderStore } from "./ai-provider.store";
import { PROVIDER_CONFIGS } from "./providers";

/**
 * Bridge between @agent-labs/agent-chat's IAgent interface and our existing
 * aiGateway + agent-toolkit pipeline.
 *
 * - AgentChatController / useAgentChat 管理 UIMessage & 工具调用。
 * - 这里负责把 UIMessage + ToolDefinition + Context 转成 AIGatewayRequest，
 *   再用 agent-toolkit 把 OpenAI chunk 流转换为 AgentEvent 流。
 */
class AIGatewayAgent implements IAgent {
  run(input: RunAgentInput) {
    const messageId =
      input.runId || input.threadId || `agent-${Date.now().toString(36)}`;

    const aiMessages = truncateMessagesByChars(
      convertUIMessagesToAIMessages(input.messages, input.context)
    );
    const toolDefs = buildToolDefs(input.tools);

    return new Observable<AgentEvent>((subscriber) => {
      let innerSub: Unsubscribable | null = null;

      const currentProvider = aiProviderStore.getProvider();
      const providerConfig = PROVIDER_CONFIGS[currentProvider];
      const model = providerConfig
        ? `${currentProvider}/${providerConfig.defaultModel}`
        : undefined;

      aiGateway
        .chatStreamChunks({
          messages: aiMessages,
          tools: toolDefs,
          model,
        })
        .then((stream: AsyncIterable<OpenAIChatChunk>) => {
          const raw$ = convertOpenAIChunksToAgentEventObservable(
            stream,
            {
              messageId,
              threadId: input.threadId,
            } as any
          ) as unknown as Observable<AgentEvent>;

          const pendingToolCalls = new Map<string, { id: string; name: string; args: string }>();
          
          innerSub = raw$.subscribe({
            next: (evt) => {
              if (evt.type === "TOOL_CALL_START") {
                pendingToolCalls.set(evt.toolCallId, {
                  id: evt.toolCallId,
                  name: evt.toolName,
                  args: "",
                });
              }
              if (evt.type === "TOOL_CALL_ARGS_DELTA") {
                const tc = pendingToolCalls.get(evt.toolCallId);
                if (tc) tc.args += evt.argsDelta;
              }
              if (evt.type === "TOOL_CALL_END") {
                pendingToolCalls.delete(evt.toolCallId);
              }
              subscriber.next(evt);
            },
            error: (err) => subscriber.error(err),
            complete: () => {
              for (const tc of pendingToolCalls.values()) {
                console.log("[AIGatewayAgent] 补发 TOOL_CALL_END 事件:", tc.id);
                subscriber.next({
                  type: "TOOL_CALL_END",
                  toolCallId: tc.id,
                } as AgentEvent);
              }
              pendingToolCalls.clear();
              subscriber.complete();
            },
          });
        })
        .catch((err) => {
          subscriber.next({
            type: "RUN_ERROR",
            error: err instanceof Error ? err.message : String(err),
            threadId: input.threadId,
          } as AgentEvent);
          subscriber.error(err);
        });

      return () => {
        innerSub?.unsubscribe();
      };
    });
  }

  // 当前仅依赖 RxJS 取消订阅来停止 UI 更新。
  // 如需真正中断网络请求，可以在 aiGateway / Provider 层补充 abort 能力，并在这里调用。
  abortRun(): void {
    // no-op
  }
}

function convertUIMessagesToAIMessages(
  uiMessages: UIMessage[],
  contexts?: AgentContext[]
): AIMessage[] {
  const base: AIMessage[] = [];

  // Base system prompt for the in-app assistant.
  const baseSystemPrompt =
    "你是一个项目内的 AI 助手。你可以查看当前页面信息，并在需要时调用可用的工具来辅助用户操作。";
  base.push({ role: "system", content: baseSystemPrompt });

  if (contexts && contexts.length) {
    const ctxText = contexts
      .map((c) => `${c.description}:\n${c.value}`)
      .join("\n\n");
    base.push({ role: "system", content: ctxText });
  }

  const messages: AIMessage[] = uiMessages
    .filter((message) => message.role !== "data")
    .map((message) => {
      return message.parts
        .map((part, index) => {
          return convertUIPartToAIMessages(
            message as UIMessage & {
              role: "system" | "assistant" | "user";
            },
            part,
            index
          );
        })
        .flat();
    })
    .flat();

  return base.concat(messages);
}

function convertUIPartToAIMessages(
  message: UIMessage & { role: "system" | "assistant" | "user" },
  part: UIMessage["parts"][number],
  index: number
): AIMessage[] {
  const { role } = message;
  const messages: AIMessage[] = [];

  if (part.type === "text") {
    messages.push({
      role,
      content: part.text,
    });
  } else if (part.type === "tool-invocation") {
    const inv = part.toolInvocation;

    // Ensure function.arguments is always a valid JSON string representing an object.
    const rawArgs = inv.args;
    let argumentsJson: string;
    if (typeof rawArgs === "string") {
      try {
        // If it's valid JSON already, and parses to an object, pass through.
        const parsed = JSON.parse(rawArgs);
        if (parsed && typeof parsed === "object") {
          argumentsJson = rawArgs;
        } else {
          // Wrap primitive into an object to satisfy providers that expect objects.
          argumentsJson = JSON.stringify({ value: parsed });
        }
      } catch {
        // Not valid JSON; wrap raw string into an object.
        argumentsJson = JSON.stringify({ value: rawArgs });
      }
    } else {
        argumentsJson = JSON.stringify(rawArgs ?? {});
    }

    const toolCall: AIToolCall = {
      id: inv.toolCallId,
      type: "function",
      function: {
        name: inv.toolName,
        arguments: argumentsJson,
      },
    };

    const assistantToolCallMessage: AIMessage = {
      role: "assistant",
      content: "",
      toolCalls: [toolCall],
    };

    const toolResultMessage: AIMessage = {
      role: "tool",
      // For OpenAI-compatible providers, name is used as tool_call_id.
      name: inv.toolCallId,
      content: JSON.stringify(inv.result ?? {}),
    };
    messages.push(assistantToolCallMessage, toolResultMessage);
  }

  return messages;
}

// Rough character-level trimming to avoid sending overly large prompts.
// This is a safeguard on top of provider-side limits; it keeps the most
// recent non-system messages while always preserving system prompts and
// structural tool call history.
const MAX_TOTAL_CONTENT_CHARS = 30_000;
const MAX_PER_MESSAGE_CHARS = 10_000;

function truncateMessagesByChars(
  messages: AIMessage[],
  maxTotalChars: number = MAX_TOTAL_CONTENT_CHARS
): AIMessage[] {
  if (!messages.length) return messages;

  const systemMessages = messages.filter((m) => m.role === "system");
  const otherMessages = messages.filter((m) => m.role !== "system");

  const clampContent = (content: string, limit: number): string =>
    content.length > limit ? content.slice(0, limit) : content;

  let remaining = maxTotalChars;
  const result: AIMessage[] = [];

  const pushWithClamp = (msg: AIMessage): void => {
    // Always preserve structural messages (tool calls & tool role messages)
    // regardless of remaining char budget, since they rarely dominate token
    // usage but are required for a valid OpenAI tool_call history.
    if (msg.role === "tool" || (msg as any).toolCalls?.length) {
      result.push(msg);
      return;
    }

    const original = msg.content ?? "";

    // If we've exhausted the budget, keep the message but clear content.
    if (remaining <= 0) {
      result.push({ ...msg, content: "" });
      return;
    }

    if (!original) {
      result.push(msg);
      return;
    }

    let content = clampContent(original, MAX_PER_MESSAGE_CHARS);
    if (content.length > remaining) {
      // Keep the tail part when we are close to the limit; the latest
      // portion of a long message is usually more relevant.
      content = content.slice(content.length - remaining);
    }

    remaining -= content.length;
    result.push({ ...msg, content });
  };

  // 1) Preserve all system messages (in order), clamped per message.
  for (const msg of systemMessages) {
    pushWithClamp(msg);
    if (remaining <= 0) {
      return result;
    }
  }

  // 2) Add non-system messages from most recent backwards.
  const preserved: AIMessage[] = [];
  for (let i = otherMessages.length - 1; i >= 0; i--) {
    preserved.push(otherMessages[i]);
  }

  // Messages were collected from latest to oldest; restore chronological order,
  // then apply pushWithClamp which enforces the remaining char budget while
  // preserving structural tool/tool_call messages.
  preserved.reverse();
  for (const msg of preserved) {
    pushWithClamp(msg);
  }
  return result;
}

function buildToolDefs(
  tools?: AgentTool[]
): AIToolDefinition[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters as any,
    },
  }));
}

export const agent = new AIGatewayAgent();
