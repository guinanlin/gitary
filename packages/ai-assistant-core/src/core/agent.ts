import { tool } from 'ai';
import { getModelProvider, getModelName } from './ai-sdk-config';
import type { AIProviderName, ProviderConfigs } from './providers';
import type { ITool, IToolContext } from '../interfaces/tool.interface';

export interface AgentConfig {
  provider: AIProviderName;
  providerConfigs: ProviderConfigs;
  tools: ITool[];
  toolContext: IToolContext;
  systemPrompt?: string | ((contexts?: Array<{ description: string; value: string }>) => string);
  maxSteps?: number;
  contexts?: Array<{ description: string; value: string }>;
}

export function createAITools(tools: ITool[], toolContext: IToolContext): Record<string, any> {
  return tools.reduce((acc, toolDef) => {
    acc[toolDef.name] = tool({
      description: toolDef.description,
      parameters: toolDef.inputSchema as any,
      execute: async (args: any) => {
        return toolDef.execute(args, toolContext);
      },
    } as any);
    return acc;
  }, {} as Record<string, any>);
}

export function getAIModel(provider: AIProviderName, providerConfigs: ProviderConfigs): any {
  const modelProvider = getModelProvider(provider, providerConfigs);
  const modelName = getModelName(provider, providerConfigs);
  return modelProvider.chat(modelName);
}

