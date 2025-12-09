import { AIService as CoreAIService, type AIProviderStore } from "@dty/ai-assistant-core";
import { aiProviderStore } from './ai-provider.store';
import { PROVIDER_CONFIGS } from './providers';
import type { ProviderConfigs } from "@dty/ai-assistant-core";

const gitaryProviderStoreAdapter: AIProviderStore = {
  getProvider: () => aiProviderStore.getProvider(),
} as AIProviderStore;

export class AIService extends CoreAIService {
  constructor(model: string = "gpt-4o-mini") {
    super({
      providerStore: gitaryProviderStoreAdapter,
      providerConfigs: PROVIDER_CONFIGS as ProviderConfigs,
      defaultModel: model,
    });
  }

  async generateSceneDescription(input: string, history: string[]) {
    const historyContext = history.length
      ? "之前的情节：\n" + history.join("\n") + "\n\n"
      : "";

    const prompt = `${historyContext}基于以下内容，请详细描述一个完整的场景或情节：${input}
要求：
1. 保持与之前情节的连贯性
2. 添加细节描述，包括环境、人物状态、动作等
3. 控制在200字以内`;

    return this.generateText(prompt);
  }

  async generateDivergentOptions(scene: string, history: string[]) {
    const historyContext = history.length
      ? "之前的情节：\n" + history.join("\n") + "\n\n"
      : "";

    const prompt = `${historyContext}当前情节：${scene}
    
请提供3个合理的剧情发展方向：
1. 每个方向都要简短但具体
2. 确保与已有情节连贯
3. 每个方向都要有独特性`;

    return this.generateText(prompt);
  }
}
