import type { OpenAIChatChunk } from "@agent-labs/agent-toolkit";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import type {
  AIGatewayRequest,
  AIGatewayResponse,
  AIMessage
} from "./types";

export type AIProviderName =
  | "openai"
  | "dashscope"
  | "openrouter"
  | "deepseek"
  | "kimi"
  | "glm";

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  chat(req: Partial<AIGatewayRequest>): Promise<AIGatewayResponse>;
  /**
   * Streaming as OpenAI-compatible chunks for agent-style orchestration.
   */
  chatStream(
    req: Partial<AIGatewayRequest>
  ): Promise<AsyncIterable<OpenAIChatChunk>>;
}

export interface OpenAICompatibleProviderOptions {
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
  headers?: Record<string, string>;
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

function createCustomFetch(): typeof fetch {
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    
    if (!url.includes("gitcode.com")) {
      return fetch(input, init);
    }
    
    const customInit: RequestInit = { ...init };
    
    if (customInit.headers) {
      const headers = new Headers();
      const originalHeaders = new Headers(customInit.headers);
      
      originalHeaders.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if (!lowerName.startsWith("x-stainless-")) {
          headers.set(name, value);
        }
      });
      
      customInit.headers = headers;
    } else if (init?.headers) {
      const headers = new Headers();
      const originalHeaders = new Headers(init.headers);
      
      originalHeaders.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if (!lowerName.startsWith("x-stainless-")) {
          headers.set(name, value);
        }
      });
      
      customInit.headers = headers;
    }
    
    return fetch(input, customInit);
  };
  
  return customFetch as typeof fetch;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  private baseUrl: string;
  private apiKey?: string;
  private client: OpenAI;

  constructor(name: string, options?: OpenAICompatibleProviderOptions) {
    this.name = name;
    this.baseUrl = trimTrailingSlash(
      options?.baseUrl || "https://api.openai.com/v1"
    );
    this.apiKey = options?.apiKey;
    this.defaultModel = options?.defaultModel || "gpt-4o-mini";
    
    const needsCustomFetch = this.baseUrl.includes("gitcode.com");
    const customFetch = needsCustomFetch ? createCustomFetch() : undefined;
    
    this.client = new OpenAI({
      apiKey: this.apiKey || "",
      baseURL: this.baseUrl,
      defaultHeaders:
        options?.headers && Object.keys(options.headers).length
          ? options.headers
          : undefined,
      dangerouslyAllowBrowser: true,
      fetch: customFetch,
    });
  }

  private mapMessage(message: AIMessage): ChatCompletionMessageParam {
    switch (message.role) {
      case "system":
      case "user":
        return {
          role: message.role,
          content: message.content,
        };
      case "assistant":
        return {
          role: "assistant",
          content: message.content,
          name: message.name,
          // Forward tool_calls history if present so the model can
          // see prior tool invocations in structured form.
          tool_calls: message.toolCalls as any,
        };
      case "tool":
        return {
          role: "tool",
          content: message.content,
          tool_call_id:
            message.name || `tool-call-${Math.random().toString(36).slice(2)}`,
        };
      default:
        return {
          role: "user",
          content: message.content,
        };
    }
  }

  async chat(req: Partial<AIGatewayRequest>): Promise<AIGatewayResponse> {
    const model = req.model || this.defaultModel;
    if (!model) {
      throw new Error(`Provider "${this.name}" 未配置模型`);
    }

    if (!this.apiKey) {
      throw new Error(`Provider "${this.name}" 未配置 API Key`);
    }

    const completion = await this.client.chat.completions.create({
      model,
      messages: (req.messages || []).map((message) =>
        this.mapMessage(message)
      ),
      tools: req.tools?.map((tool) => ({
        type: tool.type,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      })),
    });

    const choice = completion.choices?.[0];
    const msg = choice?.message;

    const result: AIGatewayResponse = {
      messages: [],
    };

    if (msg) {
      const name = (msg as { name?: string }).name;
      result.messages.push({
        role: msg.role,
        content: msg.content ?? "",
        name,
      });

      if (msg.tool_calls && msg.tool_calls.length) {
        result.toolCalls = msg.tool_calls.map((c: ChatCompletionMessageToolCall) => ({
          id: c.id,
          type: c.type,
          function: {
            name: c.function.name,
            arguments: c.function.arguments,
          },
        }));
      }
    }

    return result;
  }

  async chatStream(
    req: Partial<AIGatewayRequest>
  ): Promise<AsyncIterable<OpenAIChatChunk>> {
    const model = req.model || this.defaultModel;
    if (!model) {
      throw new Error(`Provider "${this.name}" 未配置模型`);
    }

    if (!this.apiKey) {
      throw new Error(`Provider "${this.name}" 未配置 API Key`);
    }

    console.log(`[AI Provider] ${this.name} - Request:`, {
      baseUrl: this.baseUrl,
      model,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10),
      messageCount: req.messages?.length || 0,
    });

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: (req.messages || []).map((message) =>
          this.mapMessage(message)
        ),
        tools: req.tools?.map((tool) => ({
          type: tool.type,
          function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          },
        })),
        stream: true,
      });

      // Wrap ChatCompletionStream into a minimal, toolkit-compatible chunk shape.
      const providerName = this.name;
      const providerBaseUrl = this.baseUrl;
      async function* mapStream(): AsyncIterable<OpenAIChatChunk> {
        try {
          for await (const chunk of stream as any) {
            yield {
              choices: chunk.choices?.map((choice: any) => ({
                delta: {
                  content: choice.delta?.content,
                  tool_calls: choice.delta?.tool_calls?.map((tc: any) => ({
                    id: tc.id,
                    index: tc.index ?? 0,
                    type: tc.type,
                    function: {
                      name: tc.function?.name,
                      arguments: tc.function?.arguments,
                    },
                  })),
                },
                finish_reason: choice.finish_reason,
              })),
            };
          }
        } catch (error) {
          console.error(`[AI Provider] ${providerName} - Stream error:`, error);
          throw error;
        }
      }

      return mapStream();
    } catch (error: any) {
      console.error(`[AI Provider] ${this.name} - Request error:`, {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        baseUrl: this.baseUrl,
        model,
      });
      throw error;
    }
  }
}

interface ProviderConfig {
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

export const PROVIDER_CONFIGS: Record<AIProviderName, ProviderConfig> = {
  openai: {
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: import.meta.env.VITE_AI_API_KEY,
    defaultModel: "gpt-4o-mini",
  },
  dashscope: {
    baseUrl: import.meta.env.VITE_DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: import.meta.env.VITE_AI_DASHSCOPE_API_KEY,
    defaultModel: "qwen3-max",
  },
  openrouter: {
    baseUrl: import.meta.env.VITE_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    defaultModel: "gpt-4o-mini",
  },
  deepseek: {
    baseUrl: import.meta.env.VITE_DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    defaultModel: "deepseek-3.2",
  },
  kimi: {
    baseUrl: import.meta.env.VITE_KIMI_BASE_URL || "https://api.moonshot.cn/v1",
    apiKey: import.meta.env.VITE_KIMI_API_KEY,
    defaultModel: "Kimi-K2",
  },
  glm: {
    baseUrl: import.meta.env.VITE_GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
    apiKey: import.meta.env.VITE_GLM_API_KEY,
    defaultModel: "glm-4.6",
  },
};
