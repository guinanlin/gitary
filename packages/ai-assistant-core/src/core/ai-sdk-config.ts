import { createOpenAI } from '@ai-sdk/openai';
import type { AIProviderName, ProviderConfigs } from './providers';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

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

const providerClients = new Map<string, ReturnType<typeof createOpenAI>>();

export function getModelProvider(
  provider: AIProviderName,
  configs: ProviderConfigs
): ReturnType<typeof createOpenAI> {
  const cacheKey = `${provider}-${configs[provider]?.baseUrl}`;
  
  if (providerClients.has(cacheKey)) {
    return providerClients.get(cacheKey)!;
  }

  const config = configs[provider];
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

  providerClients.set(cacheKey, client);
  return client;
}

export function getModelName(provider: AIProviderName, configs: ProviderConfigs): string {
  const config = configs[provider];
  if (!config) {
    throw new Error(`未识别的 AI provider: ${provider}`);
  }
  return config.defaultModel;
}

