# AI Agent 工具调用问题报告

## 问题概述

在使用 Vercel AI SDK 的 `Experimental_Agent` 实现 AI 助手工具调用功能时，工具调用存在以下问题：

1. **工具调用死循环**：工具被调用数百次，无法正常停止
2. **参数累积问题**：工具调用的 JSON 参数在 SSE 流中被分片传输，累积逻辑存在问题
3. **工具结果未正确返回**：工具执行后，结果可能未正确返回给 Agent，导致 Agent 重复调用工具

## 技术栈信息

### AI SDK
- **SDK 名称**：Vercel AI SDK
- **SDK 版本**：`^5.0.104`
- **使用的 API**：`Experimental_Agent`（实验性 API）
- **相关包**：
  - `ai`: `^5.0.104`
  - `@ai-sdk/openai`: `^2.0.74`

### UI 框架
- **前端框架**：React 18.2.0
- **UI 组件库**：Radix UI + 自定义组件
- **状态管理**：Zustand

### 模型提供商
- **提供商**：GitCode（兼容 OpenAI API）
- **模型**：Kimi（通过自定义 baseURL 配置）

## 问题详细描述

### 问题现象

1. **工具调用死循环**
   - 用户发送消息后，工具被调用数百次
   - Agent 的 `stopWhen: stepCountIs(5)` 配置似乎无效
   - 控制台显示大量重复的工具调用日志

2. **参数累积问题**
   - 工具调用的 JSON 参数在 SSE 流中被分成多个片段传输
   - 例如：`{"city": "北京"}` 被分成 `{"`, `"city"`, `":`, ` "`, `"北京"`, `"}` 等多个片段
   - 当前的参数累积逻辑在某些情况下会产生错误的 JSON，如 `"{}\"}"` 或 `"{}{\"city\": \"北京\"}"`

3. **工具结果处理**
   - 工具执行后，结果可能未正确返回给 Agent
   - Agent 可能无法识别工具执行完成，导致重复调用

### 测试用例：天气工具调用

**最简单的测试场景**：
- 用户输入："北京天气怎么样？" 或 "查询上海天气"
- 预期行为：调用 `getWeather` 工具，返回天气信息，显示在 UI 中
- 实际行为：工具被调用数百次，无法正常停止

**工具定义**（`src/features/global-sidecar-providers/tools/weather/index.ts`）：
```typescript
export const weatherTool = tool({
  description: '获取指定城市的天气信息',
  parameters: z.object({
    city: z.string().describe('要查询天气的城市名称'),
    unit: z.enum(['C', 'F']).describe('温度单位，C表示摄氏度，F表示华氏度').default('C').optional(),
  }),
  execute: async (args: { city: string; unit?: 'C' | 'F' }): Promise<string> => {
    // 返回天气信息
    return `${city}当前天气：${weather.description}，温度 ${temp}°${unit}`;
  },
});
```

## 相关代码位置

### 核心文件

1. **Agent 创建**：`src/services/ai/gitary-agent.ts`
   - 使用 `Experimental_Agent` 创建 Agent 实例
   - 注册所有工具（包括 `getWeather`）
   - 配置 `stopWhen: stepCountIs(5)`

2. **自定义 Fetch**：`src/services/ai/ai-sdk-config.ts`
   - 实现自定义 `fetch` 函数处理 SSE 流
   - 处理工具调用的参数累积逻辑
   - 构建最终响应对象

3. **UI 组件**：`src/features/global-sidecar-providers/panes/global-chat-panel.tsx`
   - 使用 `agent.generate()` 调用 Agent
   - 处理工具调用结果并显示在 UI 中

4. **工具定义**：
   - 天气工具：`src/features/global-sidecar-providers/tools/weather/index.ts`
   - 文件系统工具：`src/features/global-sidecar-providers/tools/fs/index.ts`
   - 工作空间上下文工具：`src/features/global-sidecar-providers/tools/workspace-context/index.ts`

### 关键代码片段

**Agent 创建**（`gitary-agent.ts`）：
```typescript
const agent = new Agent({
  model,
  system: systemPrompt,
  tools: {
    getWeather: weatherTool,
    // ... 其他工具
  },
  stopWhen: stepCountIs(5),
});
```

**参数累积逻辑**（`ai-sdk-config.ts`）：
```typescript
const toolCallArgsBuffer: Map<string, string> = new Map();

// 在 SSE 流处理中累积参数
for (const toolCall of lastChoice.delta.tool_calls) {
  const toolCallKey = `${toolCall.index}_${toolCall.id || 'unknown'}`;
  const newArgs = toolCall.function?.arguments || '';
  
  if (newArgs) {
    const currentBuffer = toolCallArgsBuffer.get(toolCallKey) || '';
    const updatedBuffer = currentBuffer + newArgs;
    toolCallArgsBuffer.set(toolCallKey, updatedBuffer);
  }
}
```

## 调试日志示例

### 正常的参数累积过程

```
[ai-sdk-config] Updated args buffer for 0_unknown: "" + "{" = "{"
[ai-sdk-config] Updated args buffer for 0_unknown: "{" + ""city"" = "{"city""
[ai-sdk-config] Updated args buffer for 0_unknown: "{"city"" + "":" = "{"city":"
[ai-sdk-config] Updated args buffer for 0_unknown: "{"city":" + " "" = "{"city": ""
[ai-sdk-config] Updated args buffer for 0_unknown: "{"city": "" + "北京" = "{"city": "北京"
[ai-sdk-config] Updated args buffer for 0_unknown: "{"city": "北京" + ""}" = "{"city": "北京"}"
[ai-sdk-config] Valid toolCalls: [{"index":0,"id":"functions.getWeather:0","type":"function","function":{"name":"getWeather","arguments":"{\"city\": \"北京\"}"}}]
[ai-sdk-config] Determined finish_reason: tool_calls
```

### 问题现象

- 工具被调用数百次
- 控制台显示大量重复的 `[ai-sdk-config]` 日志
- Agent 无法正常停止

## 参考实现

### 成功的参考项目

**项目路径**：`D:\github\rongguan\nextjs-frontend\packages\quick-action`

**关键差异**：
1. **使用的 API**：
   - 参考项目：`streamText` + `toUIMessageStreamResponse()`（标准 API）
   - 当前项目：`Experimental_Agent` + `agent.generate()`（实验性 API）

2. **工具定义**：
   - 参考项目：使用 `inputSchema`
   - 当前项目：使用 `parameters`

3. **工具调用处理**：
   - 参考项目：`streamText` 自动处理工具调用和结果返回
   - 当前项目：需要手动处理 SSE 流中的工具调用参数累积

**参考项目的工具定义**（`app/api/chat/route.ts`）：
```typescript
const tools = {
  getWeather: tool({
    description: '获取指定城市的天气信息',
    inputSchema: z.object({
      city: z.string().describe('要查询天气的城市名称'),
      unit: z.enum(['C', 'F']).describe('温度单位').default('C'),
    }),
    execute: async ({ city, unit }) => {
      // 返回天气信息
      return `${city}当前天气：${weather.description}，温度 ${temp}°${unit}`;
    },
  }),
};

const result = streamText({
  model: qwen.chat(model),
  system: systemPrompt,
  messages: convertToModelMessages(messages),
  stopWhen: stepCountIs(5),
  tools: availableTools,
});

return result.toUIMessageStreamResponse();
```

## 可能的问题原因

1. **SSE 流处理问题**
   - 自定义 `fetch` 函数可能没有正确处理工具调用的完整生命周期
   - 参数累积逻辑可能在某些边缘情况下产生错误的 JSON

2. **工具结果返回问题**
   - `Experimental_Agent` 可能需要特定的响应格式才能正确识别工具执行结果
   - 工具结果可能没有正确包含在响应中

3. **Agent 配置问题**
   - `stopWhen` 配置可能没有正确工作
   - Agent 可能无法识别工具执行完成，导致重复调用

4. **API 兼容性问题**
   - `Experimental_Agent` 是实验性 API，可能存在不稳定性
   - 与 GitCode（Kimi）的兼容性可能存在问题

## 建议的解决方案

### 方案 1：切换到标准 API（推荐）

参考成功的实现，将 `Experimental_Agent` 切换为 `streamText`：

```typescript
// 替换 agent.generate() 为 streamText
const result = streamText({
  model,
  system: systemPrompt,
  messages: convertToModelMessages(messages),
  stopWhen: stepCountIs(5),
  tools: availableTools,
});

return result.toUIMessageStreamResponse();
```

**优点**：
- 使用标准 API，更稳定
- `streamText` 自动处理工具调用和结果返回
- 参考项目已验证可行

**缺点**：
- 需要重构 UI 组件以处理流式响应
- 可能需要调整工具定义（`inputSchema` vs `parameters`）

### 方案 2：修复当前实现

1. **改进参数累积逻辑**
   - 确保参数累积逻辑能正确处理所有边缘情况
   - 添加更严格的 JSON 验证和修复

2. **修复工具结果返回**
   - 确保工具执行结果正确包含在响应中
   - 验证 `finish_reason` 的处理是否正确

3. **优化 Agent 配置**
   - 调整 `stopWhen` 条件
   - 添加更详细的日志以诊断问题

### 方案 3：使用不同的工具调用方式

考虑使用 AI SDK 的其他工具调用方式，如：
- `generateText` + `tools`（非流式）
- `streamText` + `tools`（流式，标准 API）

## 测试步骤

1. **启动应用**
   ```bash
   pnpm dev
   ```

2. **打开全局聊天面板**
   - 在应用中打开全局聊天面板

3. **发送测试消息**
   - 输入："北京天气怎么样？"
   - 或输入："查询上海天气"

4. **观察行为**
   - 查看控制台日志
   - 观察工具是否被调用
   - 检查是否有死循环
   - 验证工具结果是否正确显示

5. **检查日志**
   - `[ai-sdk-config]` 日志：参数累积过程
   - `[weather]` 日志：工具执行过程
   - `[GlobalChatPanel]` 日志：UI 处理过程

## 相关资源

- **Vercel AI SDK 文档**：https://sdk.vercel.ai/docs
- **AI SDK GitHub**：https://github.com/vercel/ai
- **参考项目**：`D:\github\rongguan\nextjs-frontend\packages\quick-action`
- **工具定义示例**：`D:\github\rongguan\nextjs-frontend\app\api\chat\route.ts`

## 优先级

**高优先级**：此问题阻止了 AI 助手工具调用功能的正常使用，需要尽快解决。

## 备注

- 当前实现已经过多次调试，但问题仍然存在
- 建议优先考虑切换到标准 API（`streamText`），因为参考项目已验证可行
- 如果必须使用 `Experimental_Agent`，需要深入分析 SSE 流处理和工具结果返回机制

