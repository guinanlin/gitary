export type AIProviderName =
  | "openai"
  | "dashscope"
  | "openrouter"
  | "deepseek"
  | "kimi"
  | "glm";

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
