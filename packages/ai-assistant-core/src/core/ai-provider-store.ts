import { BehaviorSubject } from "rxjs";
import type { AIProviderName } from "./providers";

export interface AIProviderStoreConfig {
  defaultProvider?: AIProviderName;
  storageKey?: string;
}

export class AIProviderStore {
  readonly provider$: BehaviorSubject<AIProviderName>;
  private storageKey: string;

  constructor(config: AIProviderStoreConfig = {}) {
    const { defaultProvider = "openai", storageKey = "ai-provider-selection" } = config;
    this.storageKey = storageKey;
    this.provider$ = new BehaviorSubject<AIProviderName>(this.getStoredProvider(defaultProvider));

    this.provider$.subscribe((provider) => {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(provider));
      } catch {
      }
    });
  }

  private getStoredProvider(defaultProvider: AIProviderName): AIProviderName {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as AIProviderName;
        if (["openai", "dashscope", "openrouter", "deepseek", "kimi", "glm"].includes(parsed)) {
          return parsed;
        }
      }
    } catch {
    }
    return defaultProvider;
  }

  setProvider(provider: AIProviderName) {
    this.provider$.next(provider);
  }

  getProvider(): AIProviderName {
    return this.provider$.getValue();
  }
}

