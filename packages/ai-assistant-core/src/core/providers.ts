export type AIProviderName =
  | "openai"
  | "dashscope"
  | "openrouter"
  | "deepseek"
  | "kimi"
  | "glm";

export interface ProviderConfig {
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

export type ProviderConfigs = Record<AIProviderName, ProviderConfig>;

