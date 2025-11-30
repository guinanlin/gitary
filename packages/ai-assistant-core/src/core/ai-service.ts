import { generateText } from 'ai';
import { getAIModel } from './agent';
import type { AIProviderName, ProviderConfigs } from './providers';
import type { AIProviderStore } from './ai-provider-store';

export interface AIServiceConfig {
  providerStore: AIProviderStore;
  providerConfigs: ProviderConfigs;
  defaultModel?: string;
}

export class AIService {
  private model: string;
  private providerStore: AIProviderStore;
  private providerConfigs: ProviderConfigs;

  constructor(config: AIServiceConfig) {
    this.model = config.defaultModel || "gpt-4o-mini";
    this.providerStore = config.providerStore;
    this.providerConfigs = config.providerConfigs;
  }

  private async callAPI(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    responseFormat?: { type: string }
  ) {
    const currentProvider = this.providerStore.getProvider();
    const parsedModelName = this.parseModelName(this.model, currentProvider);
    const model = getAIModel(currentProvider, this.providerConfigs);

    const systemMessages = messages.filter(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    
    const systemPrompt = systemMessages.map(m => m.content).join('\n\n');
    const prompt = userMessages.map(m => m.content).join('\n\n');

    const result = await generateText({
      model,
      system: systemPrompt || undefined,
      prompt,
      ...(responseFormat?.type === 'json_object' ? { responseFormat: { type: 'json_object' } } : {}),
    });

    return result.text;
  }

  private parseModelName(modelString: string, defaultProvider: AIProviderName): string {
    const segments = modelString.split("/");
    if (segments.length > 1) {
      const providerCandidate = segments[0] as AIProviderName;
      if (this.providerConfigs[providerCandidate]) {
        return segments.slice(1).join("/");
      }
    }
    
    const providerConfig = this.providerConfigs[defaultProvider];
    if (providerConfig && modelString === providerConfig.defaultModel) {
      return modelString;
    }
    
    return modelString;
  }

  async generateText(prompt: string) {
    return this.callAPI([{ role: "user", content: prompt }]);
  }

  async generateJSONResponse(prompt: string) {
    return this.callAPI([{ role: "user", content: prompt }], {
      type: "json_object",
    });
  }
}

