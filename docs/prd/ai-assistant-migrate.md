# AI Assistant 解耦迁移计划

## 一、目标

将 AI Assistant 从应用层解耦，创建独立的 `packages/ai-assistant-core` 包，通过接口抽象和依赖注入实现完全解耦。

## 二、包结构设计

### 2.1 创建核心包

```
packages/ai-assistant-core/
├── package.json
├── tsconfig.json
├── src/
│   ├── core/                          # 核心 AI 能力（无业务依赖）
│   │   ├── providers.ts               # 提供商配置
│   │   ├── ai-sdk-config.ts          # SDK 配置
│   │   ├── ai-provider-store.ts      # 提供商状态管理
│   │   └── agent.ts                  # Agent 核心（依赖注入）
│   ├── interfaces/                    # 抽象接口定义
│   │   ├── context-provider.interface.ts
│   │   ├── file-system.interface.ts
│   │   ├── tool.interface.ts
│   │   └── i18n.interface.ts
│   ├── types/                         # 类型定义
│   │   └── index.ts
│   └── index.ts                       # 导出入口
```

## 三、实施步骤

### 步骤 1: 创建包基础结构

- 创建 `packages/ai-assistant-core/` 目录
- 创建 `package.json`，参考 `packages/git-auth/package.json` 的结构
- 创建 `tsconfig.json`
- 设置依赖：`ai`, `@ai-sdk/openai`, `zod`, `rxjs`
- 设置 peerDependencies：`react`

### 步骤 2: 定义抽象接口

#### 2.1 上下文提供者接口

创建 `src/interfaces/context-provider.interface.ts`：

- 定义 `BrowserTabContext`, `EditorContext`, `ProjectContext`, `AIContext` 接口
- 定义 `IContextProvider` 接口，包含：
  - `getCurrentPageContext()`
  - `getEditorContext()`
  - `getBrowserTabContext()`
  - `getFullContext(options?)`
  - `formatContextForPrompt(context)`

#### 2.2 文件系统接口

创建 `src/interfaces/file-system.interface.ts`：

- 定义 `FileSystemEntry`, `FileReadResult` 等类型
- 定义 `IFileSystemProvider` 接口，包含：
  - `readdir(uri, spaceId?, path?)`
  - `readFile(uri, spaceId?, path?, maxBytes?)`
  - `stat(uri, spaceId?, path?)`
  - `resolveSpaceId(uri?, spaceId?)`

#### 2.3 工具接口

创建 `src/interfaces/tool.interface.ts`：

- 定义 `IToolContext` 接口（包含 fileSystem, contextProvider 等）
- 定义 `ITool` 接口
- 定义 `ToolFactory` 类型

#### 2.4 国际化接口

创建 `src/interfaces/i18n.interface.ts`：

- 定义 `II18nProvider` 接口，包含 `t(key, params?)` 方法

### 步骤 3: 迁移核心代码

#### 3.1 迁移提供商配置

- 从 `src/services/ai/providers.ts` 复制到 `packages/ai-assistant-core/src/core/providers.ts`
- 移除对 `import.meta.env` 的直接依赖，改为通过配置注入
- 导出 `AIProviderName` 类型和 `ProviderConfig` 接口

#### 3.2 迁移 SDK 配置

- 从 `src/services/ai/ai-sdk-config.ts` 复制到 `packages/ai-assistant-core/src/core/ai-sdk-config.ts`
- 修改 `getModelProvider` 和 `getModelName` 接受配置参数而非直接读取环境变量
- 保持自定义 fetch 逻辑（GitCode 兼容性）

#### 3.3 迁移提供商状态管理

- 从 `src/services/ai/ai-provider.store.ts` 复制到 `packages/ai-assistant-core/src/core/ai-provider-store.ts`
- 保持 RxJS BehaviorSubject 实现
- 保持 LocalStorage 持久化逻辑

#### 3.4 重构 Agent 核心

创建 `packages/ai-assistant-core/src/core/agent.ts`：

- 定义 `AgentConfig` 接口，包含：
  - `tools: ITool[]`
  - `toolContext: IToolContext`
  - `systemPrompt?: string | ((contexts?) => string)`
  - `maxSteps?: number`
  - `contexts?: Array<{ description: string; value: string }>`
- 实现 `createAIAgent(config)` 函数，使用依赖注入创建 Agent
- 工具通过 `IToolContext` 访问外部服务

### 步骤 4: 创建适配器层（应用层）

#### 4.1 上下文提供者适配器

创建 `src/services/ai/adapters/gitary-context-provider.ts`：

- 实现 `IContextProvider` 接口
- 封装现有的 `AIContextService` 逻辑
- 依赖注入：`layoutService`, `fileSystemHelper`, `i18n`

#### 4.2 文件系统提供者适配器

创建 `src/services/ai/adapters/gitary-file-system-provider.ts`：

- 实现 `IFileSystemProvider` 接口
- 封装现有的文件系统工具逻辑
- 依赖注入：`spaceHelper`, `spaceService`, `folderTreeService`, `ProviderSource`

#### 4.3 国际化提供者适配器

创建 `src/services/ai/adapters/gitary-i18n-provider.ts`：

- 实现 `II18nProvider` 接口
- 封装现有的 `i18n` 实例

### 步骤 5: 重构工具实现

#### 5.1 重构文件系统工具

修改 `src/features/global-sidecar-providers/tools/fs/index.ts`：

- 将工具改为工厂函数：`createFsReaddirTool(context: IToolContext)`
- 工具内部通过 `context.fileSystem` 访问文件系统
- 移除对 `spaceService`, `folderTreeService` 的直接依赖

#### 5.2 重构工作空间上下文工具

修改 `src/features/global-sidecar-providers/tools/workspace-context/index.ts`：

- 改为工厂函数：`createWorkspaceContextTool(context: IToolContext)`
- 通过 `context.contextProvider` 访问上下文服务

#### 5.3 重构 Excalidraw 工具

修改 `src/features/global-sidecar-providers/tools/excalidraw/` 下的工具：

- 改为工厂函数模式
- 通过 `context` 访问所需服务

### 步骤 6: 重构应用层集成

#### 6.1 重构 gitary-agent.ts

修改 `src/services/ai/gitary-agent.ts`：

- 导入 `@dty/ai-assistant-core`
- 创建适配器实例
- 使用 `createAIAgent` 创建 Agent，传入工具和 context
- 保持 `getGitarySystemPrompt` 和 `getGitaryModel` 函数（可迁移到应用层）

#### 6.2 更新 GlobalChatPanel

修改 `src/features/global-sidecar-providers/panes/global-chat-panel.tsx`：

- 从 `@dty/ai-assistant-core` 导入类型和函数
- 使用新的 Agent 创建方式
- 保持 UI 逻辑不变

#### 6.3 更新其他使用 AI 服务的地方

- 检查 `src/services/ai/ai-service.ts` 是否需要更新
- 检查 `src/components/ai-resume-chat.tsx` 等组件

### 步骤 7: 更新依赖和构建配置

#### 7.1 更新根 package.json

- 在 workspace 中添加 `ai-assistant-core` 包
- 确保依赖关系正确

#### 7.2 更新应用层 package.json

- 添加对 `@dty/ai-assistant-core` 的依赖

#### 7.3 配置 TypeScript 路径

- 确保包可以正确导入
- 更新 `tsconfig.json` 的 paths 配置

### 步骤 8: 测试和验证

#### 8.1 构建测试

- 运行 `pnpm build` 确保包可以正确构建
- 检查类型定义是否正确生成

#### 8.2 功能测试

- 测试 AI Assistant 基本对话功能
- 测试工具调用功能（文件系统、工作空间上下文等）
- 测试提供商切换功能

#### 8.3 清理旧代码

- 删除已迁移的旧文件（如果完全迁移）
- 或保留作为适配器实现

## 四、关键设计决策

### 4.1 配置注入 vs 环境变量

- 核心包不直接读取环境变量
- 通过配置对象注入，由应用层负责读取环境变量

### 4.2 接口设计原则

- 接口保持最小化，只包含必要方法
- 使用 TypeScript 接口而非抽象类，便于实现
- 允许通过 `IToolContext` 扩展自定义属性

### 4.3 向后兼容

- 保持现有 API 表面不变（在适配器层）
- 逐步迁移，不一次性破坏现有代码

## 五、文件清单

### 新建文件

- `packages/ai-assistant-core/package.json` (包名: `@dty/ai-assistant-core`)
- `packages/ai-assistant-core/tsconfig.json`
- `packages/ai-assistant-core/src/core/providers.ts`
- `packages/ai-assistant-core/src/core/ai-sdk-config.ts`
- `packages/ai-assistant-core/src/core/ai-provider-store.ts`
- `packages/ai-assistant-core/src/core/agent.ts`
- `packages/ai-assistant-core/src/interfaces/context-provider.interface.ts`
- `packages/ai-assistant-core/src/interfaces/file-system.interface.ts`
- `packages/ai-assistant-core/src/interfaces/tool.interface.ts`
- `packages/ai-assistant-core/src/interfaces/i18n.interface.ts`
- `packages/ai-assistant-core/src/types/index.ts`
- `packages/ai-assistant-core/src/index.ts`
- `src/services/ai/adapters/gitary-context-provider.ts`
- `src/services/ai/adapters/gitary-file-system-provider.ts`
- `src/services/ai/adapters/gitary-i18n-provider.ts`

### 修改文件

- `src/services/ai/gitary-agent.ts`
- `src/services/ai/providers.ts` (可能删除或保留为适配器)
- `src/services/ai/ai-sdk-config.ts` (可能删除或保留为适配器)
- `src/services/ai/ai-provider.store.ts` (可能删除或保留为适配器)
- `src/features/global-sidecar-providers/tools/fs/index.ts`
- `src/features/global-sidecar-providers/tools/workspace-context/index.ts`
- `src/features/global-sidecar-providers/tools/excalidraw/*.ts`
- `src/features/global-sidecar-providers/panes/global-chat-panel.tsx`
- `package.json` (根目录)
- `tsconfig.json` (可能需要更新 paths)

## 六、注意事项

1. **环境变量处理**：核心包不直接读取环境变量，由应用层读取后通过配置注入
2. **类型导出**：确保所有需要的类型都从包的主入口导出
3. **依赖管理**：核心包只依赖外部库，不依赖应用层代码
4. **测试策略**：创建适配器后，可以 mock 接口进行单元测试
5. **渐进式迁移**：可以先迁移核心部分，工具逐步迁移