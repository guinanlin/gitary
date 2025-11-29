# AI Assistant 功能与技术文档

## 一、概述

AI Assistant 是 Gitary 项目中的核心功能模块，提供全局 AI 对话能力，支持多 AI 提供商、工具调用和上下文感知。它通过 xbook 插件系统集成到应用中，作为全局侧边栏面板提供跨页面的 AI 助手服务。

### 1.1 核心特性

- **全局对话界面**：通过全局侧边栏提供跨页面的 AI 对话能力
- **多提供商支持**：支持 OpenAI、Dashscope、OpenRouter、DeepSeek、Kimi、GLM 等多个 AI 提供商
- **工具调用能力**：AI 可以调用文件系统、工作空间上下文等工具来执行实际操作
- **上下文感知**：自动获取当前页面、编辑器、工作空间等上下文信息
- **流式响应**：支持实时流式输出，提供更好的用户体验
- **工具执行可视化**：展示工具调用过程和结果

### 1.2 架构定位

AI Assistant 采用跨层架构设计：

```
┌─────────────────────────────────────────┐
│         应用层 (Application)            │
│  - features/global-sidecar-providers/   │
│    └── panes/global-chat-panel.tsx      │  ← UI 组件层
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│       插件层 (Plugin System)           │
│  - featureGlobalSidecar (插件)          │  ← 插件注册
│    └── 注册为全局侧边栏面板             │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│       服务层 (Service Layer)             │
│  - services/ai/                         │  ← 核心服务层
│    ├── gateway.ts (AI网关服务)          │
│    ├── providers.ts (多提供商支持)       │
│    ├── ai-agent-runner.ts (Agent运行器) │
│    ├── ai-tool-registry.ts (工具注册表)  │
│    ├── context-service.ts (上下文服务)   │
│    └── types.ts (类型定义)               │
└─────────────────────────────────────────┘
```

## 二、核心组件详解

### 2.1 AIGatewayService (AI 网关服务)

**文件位置**：`src/services/ai/gateway.ts`

**职责**：统一的 AI 网关，封装与 AI 提供商的通信，提供统一的接口。

**核心功能**：

1. **提供商管理**
   - 支持多个 AI 提供商（OpenAI、Dashscope、OpenRouter、DeepSeek、Kimi、GLM）
   - 提供商缓存机制，避免重复创建实例
   - 动态提供商解析和切换

2. **消息处理**
   - 统一的消息格式转换
   - 支持工具调用（Function Calling）
   - 流式和非流式响应

3. **核心方法**：

```typescript
// 非流式聊天
async chat(req: Partial<AIGatewayRequest>): Promise<AIGatewayResponse>

// 流式聊天（带回调）
async chatStream(
  req: Partial<AIGatewayRequest>,
  onChunk: (chunk: string) => void
): Promise<AIGatewayResponse>

// 流式聊天（返回原始 chunk 流，用于 Agent 编排）
async chatStreamChunks(
  req: Partial<AIGatewayRequest>
): Promise<AsyncIterable<OpenAIChatChunk>>
```

**设计特点**：
- ✅ 统一接口：屏蔽不同提供商的差异
- ✅ 提供商缓存：提高性能，减少实例创建开销
- ✅ 模型解析：支持 `provider/model` 格式的模型名称
- ✅ 流式支持：完整的流式响应处理

### 2.2 AIProvider (AI 提供商实现)

**文件位置**：`src/services/ai/providers.ts`

**职责**：实现具体的 AI 提供商接口，封装与各 AI 平台的通信。

**支持的提供商**：

| 提供商 | 标识 | 默认模型 | 配置环境变量 |
|--------|------|----------|--------------|
| OpenAI | `openai` | `gpt-4o-mini` | `VITE_OPENAI_BASE_URL`, `VITE_AI_API_KEY` |
| Dashscope (Qwen) | `dashscope` | `qwen3-max` | `VITE_DASHSCOPE_BASE_URL`, `VITE_AI_DASHSCOPE_API_KEY` |
| OpenRouter | `openrouter` | `gpt-4o-mini` | `VITE_OPENROUTER_BASE_URL`, `VITE_OPENROUTER_API_KEY` |
| DeepSeek | `deepseek` | `deepseek-3.2` | `VITE_DEEPSEEK_BASE_URL`, `VITE_DEEPSEEK_API_KEY` |
| Kimi (Moonshot) | `kimi` | `Kimi-K2` | `VITE_KIMI_BASE_URL`, `VITE_KIMI_API_KEY` |
| GLM (Zhipu) | `glm` | `glm-4.6` | `VITE_GLM_BASE_URL`, `VITE_GLM_API_KEY` |

**核心实现**：

```typescript
export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  private client: OpenAI;

  // 非流式聊天
  async chat(req: Partial<AIGatewayRequest>): Promise<AIGatewayResponse>

  // 流式聊天（返回 OpenAI 兼容的 chunk 流）
  async chatStream(
    req: Partial<AIGatewayRequest>
  ): Promise<AsyncIterable<OpenAIChatChunk>>
}
```

**设计特点**：
- ✅ OpenAI 兼容：所有提供商都实现 OpenAI 兼容的接口
- ✅ 统一消息格式：自动转换消息格式
- ✅ 工具调用支持：完整的 Function Calling 支持
- ✅ 错误处理：完善的错误处理和日志记录

### 2.3 AIGatewayAgent (Agent 运行器)

**文件位置**：`src/services/ai/ai-agent-runner.ts`

**职责**：桥接 `@agent-labs/agent-chat` 框架与现有的 AI 服务，实现 `IAgent` 接口。

**核心功能**：

1. **消息转换**
   - 将 `UIMessage` 转换为 `AIMessage`
   - 处理工具调用历史记录
   - 添加系统提示词和上下文

2. **流式处理**
   - 使用 `@agent-labs/agent-toolkit` 将 OpenAI chunk 流转换为 `AgentEvent` 流
   - 处理工具调用的增量参数
   - 管理工具调用的生命周期事件

3. **消息截断**
   - 智能截断长消息，保留最近的对话
   - 保护系统提示词和工具调用历史
   - 字符级别限制（默认 30,000 字符）

**核心实现**：

```typescript
class AIGatewayAgent implements IAgent {
  run(input: RunAgentInput): Observable<AgentEvent> {
    // 1. 转换消息格式
    const aiMessages = convertUIMessagesToAIMessages(
      input.messages,
      input.context
    );
    
    // 2. 构建工具定义
    const toolDefs = buildToolDefs(input.tools);
    
    // 3. 调用 AI 网关获取流式响应
    // 4. 转换为 AgentEvent 流
    // 5. 处理工具调用事件
  }
}
```

**设计特点**：
- ✅ 框架集成：无缝集成 `@agent-labs/agent-chat` 框架
- ✅ 事件流处理：完整的 AgentEvent 流处理
- ✅ 工具调用管理：跟踪和管理工具调用状态
- ✅ 错误恢复：完善的错误处理和恢复机制

### 2.4 AIContextService (上下文服务)

**文件位置**：`src/services/ai/context-service.ts`

**职责**：获取和管理当前工作空间的上下文信息，为 AI 提供环境感知能力。

**支持的上下文类型**：

1. **浏览器标签页上下文** (`BrowserTabContext`)
   - 当前 URL
   - 页面标题
   - 选中的文本（可选）

2. **编辑器上下文** (`EditorContext`)
   - 当前打开的文件 URI
   - 文件内容
   - 文件语言类型
   - 行数统计
   - 选中的文本（可选）

3. **项目上下文** (`ProjectContext`)
   - 当前文件
   - 最近打开的文件列表
   - 项目结构（可选）

**核心方法**：

```typescript
export class AIContextService {
  // 获取当前页面上下文（URI 和 openerId）
  async getCurrentPageContext(): Promise<{ uri?: string; openerId?: string }>

  // 获取编辑器上下文
  async getEditorContext(): Promise<EditorContext | undefined>

  // 获取浏览器标签页上下文
  async getBrowserTabContext(): Promise<BrowserTabContext | undefined>

  // 获取完整上下文（可配置包含哪些部分）
  async getFullContext(options?: {
    includeBrowserTab?: boolean;
    includeEditor?: boolean;
    includeProject?: boolean;
  }): Promise<AIContext>

  // 格式化上下文为提示词
  formatContextForPrompt(context: AIContext): string
}
```

**设计特点**：
- ✅ 多源上下文：支持浏览器、编辑器、项目等多种上下文
- ✅ 异步获取：所有上下文获取都是异步的，支持超时控制
- ✅ 容错处理：完善的错误处理，确保上下文获取失败不影响主流程
- ✅ 格式化输出：提供上下文格式化方法，便于生成提示词

### 2.5 AIToolRegistry (工具注册表)

**文件位置**：`src/services/ai/ai-tool-registry.ts`

**职责**：管理 AI 可用的工具，支持按 openerId 注册和获取工具。

**核心功能**：

1. **工具注册**
   - 按 openerId（页面类型）注册工具提供者
   - 支持动态注册和获取

2. **工具获取**
   - 根据 openerId 获取对应的工具列表
   - 支持工具提供者模式

**核心实现**：

```typescript
export class AIToolRegistry {
  private providers = new Map<string, AIToolProvider>();

  // 注册工具提供者
  register(openerId: string, provider: AIToolProvider): void

  // 获取指定 openerId 的工具列表
  getToolsForOpener(openerId: string): AITool[]
}
```

**设计特点**：
- ✅ 按需加载：根据页面类型动态加载工具
- ✅ 扩展性：支持新增工具提供者
- ✅ 隔离性：不同页面类型的工具相互隔离

### 2.6 GlobalChatPanel (全局聊天面板)

**文件位置**：`src/features/global-sidecar-providers/panes/global-chat-panel.tsx`

**职责**：提供 AI Assistant 的用户界面，处理用户交互和消息展示。

**核心功能**：

1. **对话界面**
   - 消息列表展示（用户消息和 AI 回复）
   - Markdown 渲染支持
   - 流式响应展示
   - 工具调用可视化

2. **用户交互**
   - 消息输入框（支持多行输入）
   - 发送按钮（支持中断响应）
   - 提供商选择下拉框
   - 复制消息内容

3. **上下文管理**
   - 自动获取当前 Space ID
   - 监听页面变化，更新上下文
   - 将上下文传递给 AI Agent

4. **工具集成**
   - 加载全局工具列表
   - 工具执行结果展示
   - 工具调用过程可视化

**核心实现**：

```typescript
export const GlobalChatPanel = () => {
  // 1. 状态管理
  const [input, setInput] = useState("");
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const currentProvider = useObservable(
    aiProviderStore.provider$,
    aiProviderStore.getProvider()
  );

  // 2. 工具配置
  const agentTools: AgentTool[] = useMemo(
    () => GLOBAL_AGENT_TOOLS as AgentTool[],
    []
  );
  const { toolDefs, toolExecutors } = useParseTools(agentTools);

  // 3. Agent 聊天 Hook
  const {
    messages: uiMessages,
    isAgentResponding,
    sendMessage,
    abortAgentRun,
  } = useAgentChat({
    agent,
    toolDefs,
    toolExecutors,
    contexts: currentSpaceId ? [{ description: "current_space_id", value: currentSpaceId }] : [],
    initialMessages: [],
  });

  // 4. 上下文监听
  useEffect(() => {
    // 监听页面变化，更新上下文
  }, []);

  // 5. UI 渲染
  return (
    <div>
      {/* 消息列表 */}
      {/* 输入框 */}
      {/* 提供商选择 */}
    </div>
  );
};
```

**设计特点**：
- ✅ 响应式设计：适配不同屏幕尺寸
- ✅ 实时更新：流式响应实时展示
- ✅ 工具可视化：清晰展示工具调用过程
- ✅ 用户体验：流畅的交互和动画效果

## 三、工具系统

### 3.1 全局工具列表

AI Assistant 提供以下全局工具：

#### 3.1.1 文件系统工具

**位置**：`src/features/global-sidecar-providers/tools/fs/index.ts`

**工具列表**：

1. **fs_readdir** - 列出目录内容
   - 功能：列出指定空间路径下的目录内容
   - 参数：`uri` 或 `spaceId` + `path`
   - 返回：目录条目列表（文件/目录名称和类型）

2. **fs_readFile** - 读取文件内容
   - 功能：读取指定空间中文件的文本内容
   - 参数：`uri` 或 `spaceId` + `path`，可选的 `maxBytes`（默认 8000 字符）
   - 返回：文件内容（文本）或二进制文件提示
   - 特性：自动检测二进制文件，避免读取二进制内容

3. **fs_stat** - 获取文件/目录信息
   - 功能：获取文件或目录的元信息（大小、修改时间等）
   - 参数：`uri` 或 `spaceId` + `path`
   - 返回：文件/目录的统计信息

**设计特点**：
- ✅ 智能 Space ID 解析：支持从 URI、SpaceService、FolderTreeService、URL hash 等多种方式获取
- ✅ 二进制文件检测：自动跳过二进制文件，避免读取错误
- ✅ 路径过滤：自动过滤 `.git`、`node_modules` 等不需要的路径
- ✅ 内容截断：大文件自动截断，避免返回过长内容

#### 3.1.2 工作空间上下文工具

**位置**：`src/features/global-sidecar-providers/tools/workspace-context/index.ts`

**工具**：**get_workspace_context** - 获取工作空间上下文

- **功能**：获取当前浏览器标签页、编辑器和项目相关的上下文信息
- **参数**：
  - `includeBrowserTab?: boolean` - 是否包含浏览器标签页信息
  - `includeEditor?: boolean` - 是否包含编辑器信息
  - `includeProject?: boolean` - 是否包含项目信息
- **返回**：完整的 `AIContext` 对象

**使用场景**：
- AI 需要了解当前打开的文件内容
- AI 需要了解当前浏览器标签页信息
- AI 需要了解项目结构

### 3.2 工具执行流程

```
用户消息
  ↓
AI Agent 分析
  ↓
决定调用工具
  ↓
工具调用开始 (TOOL_CALL_START)
  ↓
工具参数增量更新 (TOOL_CALL_ARGS_DELTA)
  ↓
工具调用结束 (TOOL_CALL_END)
  ↓
工具执行 (execute)
  ↓
工具结果返回 (TOOL_RESULT)
  ↓
AI 继续处理
  ↓
最终回复
```

### 3.3 工具扩展

要添加新工具，需要：

1. **定义工具**：实现 `Tool` 接口
   ```typescript
   export const myTool: Tool<Args, Result> = {
     name: "my_tool",
     description: "工具描述",
     parameters: { /* JSON Schema */ },
     async execute(args: Args): Promise<Result> {
       // 工具执行逻辑
     }
   };
   ```

2. **注册工具**：添加到 `GLOBAL_AGENT_TOOLS` 数组
   ```typescript
   export const GLOBAL_AGENT_TOOLS: Tool[] = [
     // ... 现有工具
     myTool,
   ];
   ```

3. **工具会自动可用**：工具会自动注册到 AI Agent，AI 可以根据需要调用

## 四、提供商管理

### 4.1 AIProviderStore

**文件位置**：`src/services/ai/ai-provider.store.ts`

**职责**：管理当前选择的 AI 提供商，提供响应式状态管理。

**核心功能**：

1. **提供商选择**
   - 使用 RxJS `BehaviorSubject` 管理提供商状态
   - 持久化到 LocalStorage
   - 支持响应式订阅

2. **默认提供商**
   - 从环境变量 `VITE_AI_PROVIDER` 读取
   - 如果没有配置，默认使用 `openai`
   - 支持从 LocalStorage 恢复上次选择

**核心实现**：

```typescript
export class AIProviderStore {
  readonly provider$ = new BehaviorSubject<AIProviderName>(getStoredProvider());

  setProvider(provider: AIProviderName): void
  getProvider(): AIProviderName
}
```

### 4.2 提供商配置

提供商配置通过环境变量设置：

```bash
# OpenAI
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_AI_API_KEY=sk-...

# Dashscope
VITE_DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
VITE_AI_DASHSCOPE_API_KEY=sk-...

# OpenRouter
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_OPENROUTER_API_KEY=sk-...

# DeepSeek
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
VITE_DEEPSEEK_API_KEY=sk-...

# Kimi
VITE_KIMI_BASE_URL=https://api.moonshot.cn/v1
VITE_KIMI_API_KEY=sk-...

# GLM
VITE_GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
VITE_GLM_API_KEY=sk-...
```

### 4.3 提供商切换

用户可以在 UI 中通过下拉框切换提供商：

```typescript
<Select
  value={String(currentProvider)}
  onValueChange={(value) => {
    aiProviderStore.setProvider(value as AIProviderName);
  }}
>
  {/* 提供商选项 */}
</Select>
```

切换提供商会：
1. 更新 `AIProviderStore` 的状态
2. 持久化到 LocalStorage
3. 通知所有订阅者
4. 下次对话使用新的提供商

## 五、消息处理流程

### 5.1 完整消息流程

```
用户输入
  ↓
GlobalChatPanel.handleSend()
  ↓
useAgentChat.sendMessage()
  ↓
AIGatewayAgent.run()
  ↓
消息转换 (UIMessage → AIMessage)
  ↓
添加上下文和系统提示词
  ↓
消息截断（如果过长）
  ↓
AIGatewayService.chatStreamChunks()
  ↓
AIProvider.chatStream()
  ↓
OpenAI Client API 调用
  ↓
流式响应返回
  ↓
convertOpenAIChunksToAgentEventObservable()
  ↓
AgentEvent 流
  ↓
useAgentChat 处理事件
  ↓
工具调用（如果需要）
  ↓
工具执行
  ↓
工具结果返回
  ↓
AI 继续处理
  ↓
最终回复
  ↓
UI 更新
```

### 5.2 消息格式转换

**UIMessage → AIMessage**：

```typescript
// UIMessage (来自 @agent-labs/agent-chat)
{
  id: string;
  role: "user" | "assistant";
  parts: [
    { type: "text", text: "..." },
    { type: "tool-invocation", toolInvocation: {...} }
  ]
}

// 转换为 AIMessage
[
  { role: "system", content: "系统提示词" },
  { role: "system", content: "上下文信息" },
  { role: "user", content: "用户消息" },
  { role: "assistant", content: "", toolCalls: [...] },
  { role: "tool", name: "tool_call_id", content: "工具结果" },
  ...
]
```

### 5.3 消息截断策略

为了防止消息过长，实现了智能截断：

1. **保留系统消息**：所有系统消息都会被保留（会被截断但不会删除）
2. **保留工具调用历史**：工具调用相关的消息结构会被完整保留
3. **从最新消息开始保留**：优先保留最近的对话
4. **字符限制**：
   - 总字符数限制：30,000 字符
   - 单条消息限制：10,000 字符
   - 超出限制时，保留消息尾部（最新部分）

## 六、插件集成

### 6.1 插件注册

**文件位置**：`src/features/global-sidecar-providers/index.tsx`

AI Assistant 通过 xbook 插件系统注册为全局侧边栏面板：

```typescript
export const featureGlobalSidecar = createPlugin({
  initilize(xbook) {
    // 注册全局侧边栏面板
    registerGlobalSidecarPane({
      id: "global-chat",
      title: "AI Assistant",
      description: "跨页面问答与命令",
      icon: AIAssistantIcon,
      order: 1,
      component: GlobalChatPanel,
    });

    // 添加到工作台
    xbook.workbenchService.addReactEntry({
      id: "global-sidecar",
      WrapperComponent: GlobalSidecarProvider,
    });
  },
});
```

### 6.2 全局侧边栏

AI Assistant 作为全局侧边栏面板，具有以下特性：

- **跨页面访问**：在任何页面都可以打开 AI Assistant
- **持久化状态**：对话历史在会话期间保持
- **上下文感知**：自动获取当前页面的上下文信息
- **独立窗口**：不影响主编辑区域

## 七、技术栈

### 7.1 核心依赖

- **@agent-labs/agent-chat**：Agent 聊天框架，提供 `useAgentChat` Hook 和 `IAgent` 接口
  - **来源**：外部 npm 包，开源项目
  - **GitHub**：https://github.com/agent-labs/agent-chat
  - **描述**：React 组件库，用于构建 AI agent 聊天界面
  - **许可证**：MIT
  - **维护者**：peiiii
  - **版本**：^1.21.0
- **@agent-labs/agent-toolkit**：Agent 工具包，提供 OpenAI chunk 到 AgentEvent 的转换
  - **来源**：外部 npm 包，开源项目
  - **描述**：纯逻辑工具包，用于 agent 流式处理、工具编排和参数累积
  - **许可证**：MIT
  - **维护者**：peiiii
  - **版本**：^0.1.3
- **openai**：OpenAI SDK，用于与 OpenAI 兼容的 API 通信
- **rxjs**：响应式编程，用于状态管理和事件流处理
- **react**：UI 框架

### 7.2 项目内部依赖

- **xbook**：插件系统框架
- **@/helpers/space.helper**：Space 相关工具函数
- **@/services/search/provider-source**：文件系统读取服务
- **@/services/space.service**：Space 管理服务
- **@/services/folder-tree.service**：文件夹树服务

## 八、使用示例

### 8.1 基本对话

用户可以直接在输入框中输入问题，AI 会基于当前上下文回答。

### 8.2 文件操作

AI 可以调用文件系统工具来读取文件：

```
用户：帮我看看 README.md 文件的内容
AI：[调用 fs_readFile] 读取文件内容...
AI：这是 README.md 的内容：...
```

### 8.3 代码分析

AI 可以结合编辑器上下文分析代码：

```
用户：这段代码有什么问题？
AI：[调用 get_workspace_context] 获取当前文件内容...
AI：我发现这段代码存在以下问题：...
```

### 8.4 多轮对话

AI 支持多轮对话，会记住之前的对话内容：

```
用户：这个函数是做什么的？
AI：这个函数用于...
用户：那如何优化它？
AI：基于刚才的分析，可以这样优化...
```

## 九、性能优化

### 9.1 消息截断

- 自动截断长消息，避免超出模型 token 限制
- 优先保留最近的对话，提高相关性

### 9.2 提供商缓存

- 提供商实例缓存，避免重复创建
- 减少初始化开销

### 9.3 流式响应

- 实时流式输出，提升用户体验
- 减少等待时间

### 9.4 上下文获取优化

- 异步获取上下文，不阻塞主流程
- 超时控制，避免长时间等待
- 容错处理，确保上下文获取失败不影响对话

## 十、错误处理

### 10.1 提供商错误

- API Key 未配置：提示用户配置 API Key
- 网络错误：显示错误信息，允许重试
- 模型不存在：自动回退到默认模型

### 10.2 工具执行错误

- 工具执行失败：将错误信息返回给 AI，AI 可以解释错误或建议解决方案
- 工具超时：超时控制，避免工具执行阻塞对话

### 10.3 消息处理错误

- 消息格式错误：自动修复或提示用户
- 消息过长：自动截断

## 十一、未来规划

### 11.1 功能增强

- [ ] 支持更多工具（代码编辑、Git 操作等）
- [ ] 支持对话历史持久化
- [ ] 支持自定义提示词模板
- [ ] 支持多模态输入（图片、文件等）

### 11.2 性能优化

- [ ] 消息压缩和去重
- [ ] 更智能的上下文选择
- [ ] 工具执行结果缓存

### 11.3 用户体验

- [ ] 更好的工具调用可视化
- [ ] 支持对话导出
- [ ] 支持对话分享
- [ ] 快捷键支持

## 十二、总结

AI Assistant 是 Gitary 项目中的核心功能，通过跨层架构设计，实现了：

- ✅ **统一接口**：通过 AIGatewayService 统一管理多个 AI 提供商
- ✅ **工具化能力**：支持 AI 调用工具执行实际操作
- ✅ **上下文感知**：自动获取工作空间上下文，提供更准确的回答
- ✅ **插件化集成**：通过 xbook 插件系统无缝集成到应用中
- ✅ **良好的用户体验**：流式响应、工具可视化、错误处理等

该架构设计具有良好的扩展性和可维护性，为未来的功能增强奠定了基础。

