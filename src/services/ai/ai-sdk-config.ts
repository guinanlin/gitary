import { createOpenAI } from '@ai-sdk/openai';
import { PROVIDER_CONFIGS, type AIProviderName } from './providers';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

/**
 * 创建自定义 fetch 函数
 * 主要用于移除 GitCode 不支持的 x-stainless-* 请求头
 */
function createCustomFetch(): typeof fetch {
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // 非 GitCode 请求,直接转发
    if (!url.includes("gitcode.com")) {
      return fetch(input, init);
    }

    // GitCode 兼容性: 移除 x-stainless-* 请求头
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

    // 直接返回原始响应,streamText 会自动处理流式数据
    return fetch(input, customInit);
  };

  return customFetch as typeof fetch;
}

const providerClients = new Map<AIProviderName, ReturnType<typeof createOpenAI>>();

export function getModelProvider(provider: AIProviderName) {
  if (providerClients.has(provider)) {
    return providerClients.get(provider)!;
  }

  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    throw new Error(`未识别的 AI provider: ${provider}`);
  }

  const baseUrl = trimTrailingSlash(config.baseUrl || "https://api.openai.com/v1");
  const apiKey = config.apiKey || "";

  const needsCustomFetch = baseUrl.includes("gitcode.com");
  const customFetch = needsCustomFetch ? createCustomFetch() : undefined;

  const client = createOpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    fetch: customFetch,
  });

  providerClients.set(provider, client);
  return client;
}

export function getModelName(provider: AIProviderName): string {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    throw new Error(`未识别的 AI provider: ${provider}`);
  }
  return config.defaultModel;
}
