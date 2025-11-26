import { BehaviorSubject } from "rxjs";
import type { AIProviderName } from "./providers";

const STORAGE_KEY = "ai-provider-selection";
const DEFAULT_PROVIDER: AIProviderName =
  (import.meta.env.VITE_AI_PROVIDER as AIProviderName) || "openai";

function getStoredProvider(): AIProviderName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AIProviderName;
      if (["openai", "dashscope", "openrouter", "deepseek", "kimi", "glm"].includes(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_PROVIDER;
}

export class AIProviderStore {
  readonly provider$ = new BehaviorSubject<AIProviderName>(getStoredProvider());

  constructor() {
    this.provider$.subscribe((provider) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(provider));
      } catch {
        // ignore
      }
    });
  }

  setProvider(provider: AIProviderName) {
    this.provider$.next(provider);
  }

  getProvider(): AIProviderName {
    return this.provider$.getValue();
  }
}

export const aiProviderStore = new AIProviderStore();

