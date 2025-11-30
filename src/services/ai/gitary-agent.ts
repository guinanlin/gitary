import { stepCountIs } from 'ai';
import { getModelProvider, getModelName } from './ai-sdk-config';
import { aiProviderStore } from './ai-provider.store';
import { getWorkspaceContextTool } from '@/features/global-sidecar-providers/tools/workspace-context';
import { fsReaddirTool, fsReadFileTool, fsStatTool } from '@/features/global-sidecar-providers/tools/fs';
import { weatherTool } from '@/features/global-sidecar-providers/tools/weather';
import {
  excalidrawAnalyzeTool,
  excalidrawAIGenerateDiagramTool,
  excalidrawAIAppendDiagramTool,
  excalidrawCreateDiagramTool,
  excalidrawAppendDiagramTool,
  excalidrawModifyTool,
} from '@/features/global-sidecar-providers/tools/excalidraw';

/**
 * 获取所有 AI 助手工具
 */
export function getGitaryTools() {
  return {
    getWeather: weatherTool,
    get_workspace_context: getWorkspaceContextTool,
    fs_readdir: fsReaddirTool,
    fs_readFile: fsReadFileTool,
    fs_stat: fsStatTool,
    excalidraw_analyze: excalidrawAnalyzeTool,
    excalidraw_ai_generate_diagram: excalidrawAIGenerateDiagramTool,
    excalidraw_ai_append_diagram: excalidrawAIAppendDiagramTool,
    excalidraw_create_diagram: excalidrawCreateDiagramTool,
    excalidraw_append_diagram: excalidrawAppendDiagramTool,
    excalidraw_modify: excalidrawModifyTool,
  };
}

/**
 * 获取 AI 助手的系统提示词
 */
export function getGitarySystemPrompt(contexts?: Array<{ description: string; value: string }>) {
  return [
    '你是一个项目内的 AI 助手。你必须使用可用的工具来回答用户的问题。',
    '',
    '⚠️ 重要：当用户询问文件、目录、项目结构、天气等问题时，你必须调用相应的工具，不能猜测或假设答案。',
    '',
    '可用的工具：',
    '1. getWeather - 获取指定城市的天气信息',
    '   - 参数：city (必需，城市名称), unit (可选，C或F，默认C)',
    '   - 示例：当用户问"北京天气"或"上海天气怎么样"时，必须调用此工具',
    '',
    '2. fs_readdir - 列出指定目录下的文件和文件夹',
    '   - 参数：uri (可选，完整空间URI) 或 spaceId + path (可选)',
    '   - 示例：当用户问"当前目录有什么文件"时，必须调用此工具',
    '',
    '3. fs_readFile - 读取文件内容',
    '   - 参数：uri (可选) 或 spaceId + path (可选), maxBytes (可选)',
    '   - 示例：当用户问"某个文件的内容"时，必须调用此工具',
    '',
    '4. fs_stat - 获取文件或目录的详细信息',
    '   - 参数：uri (可选) 或 spaceId + path (可选)',
    '',
    '5. get_workspace_context - 获取当前工作空间上下文',
    '   - 参数：includeBrowserTab (可选), includeEditor (可选), includeProject (可选)',
    '   - 示例：当用户问"当前打开的文件"时，必须调用此工具',
    '',
    '强制规则：',
    '- 如果用户的问题涉及天气，你必须调用 getWeather 工具，调用成功后立即基于结果回答，不要重复调用',
    '- 如果用户的问题涉及文件系统（文件、目录、项目结构），你必须调用工具，调用成功后立即基于结果回答，不要重复调用',
    '- 如果用户的问题涉及当前工作空间状态，你必须调用 get_workspace_context 工具，调用成功后立即基于结果回答，不要重复调用',
    '- 不要在没有使用工具的情况下回答关于天气、文件系统或工作空间的问题',
    '- 工具调用成功后，立即基于工具返回的结果生成回答，不要再次调用相同的工具',
    '- 如果工具调用失败或返回错误，可以重试一次，但不要无限重试',
    '',
    ...(contexts || []).map(c => `${c.description}:\n${c.value}`),
  ].join('\n\n');
}

/**
 * 获取 AI 模型配置
 */
export function getGitaryModel() {
  const currentProvider = aiProviderStore.getProvider();
  const modelProvider = getModelProvider(currentProvider);
  const modelName = getModelName(currentProvider);
  return modelProvider.chat(modelName);
}

/**
 * 工具调用的最大步数
 * 注意：对于简单的工具调用（如天气查询），通常只需要1-2步即可完成
 */
export const MAX_TOOL_STEPS = 3;
