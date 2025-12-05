# Markdown AI 美化功能需求文档

## 需求概述

### 核心需求

在 ZenMark 编辑器的工具栏（`zenmark-editor__header-left`）中添加一个 AI 美化按钮，用户点击后能够自动调用 AI 服务（默认使用 KIMI）对当前 Markdown 文档进行格式化和美化处理。

**预期行为：**
1. 用户在 Markdown 编辑器中编写或粘贴内容（可能格式不规范）
2. 点击工具栏中的"美化"图标按钮
3. 系统调用 AI 服务，将当前 Markdown 内容发送给 AI
4. AI 对内容进行格式化处理（优化语法、统一格式、规范结构等）
5. 美化后的内容自动替换编辑器中的原始内容
6. 用户可以直接使用美化后的内容继续编辑

### 需求背景

**问题场景：**
- 用户经常从其他来源（网页、文档、聊天记录等）复制 Markdown 内容
- 复制的内容格式可能不规范：标题层级混乱、列表格式不统一、代码块格式错误、段落间距不合理等
- 手动格式化耗时且容易出错
- 需要一种快速、智能的方式来美化 Markdown 内容

**价值主张：**
- **提升效率**：一键完成格式化，节省手动调整时间
- **保证质量**：AI 能够智能识别并修复格式问题
- **改善体验**：让用户专注于内容创作，而非格式调整

## 需求详细分析

### 功能需求

#### 1. UI 交互需求

**按钮位置：**
- 位于 `zenmark-editor__header-left` 区域的最后（所有工具按钮之后）
- 与现有工具栏按钮保持一致的视觉风格
- 支持 hover 状态和禁用状态

**按钮状态：**
- **正常状态**：显示美化图标（如 Sparkles、Wand2 等），可点击
- **加载状态**：显示加载动画（spinner），禁用点击
- **禁用状态**：内容为空时禁用按钮

**用户反馈：**
- 点击后立即显示加载状态
- 成功时显示成功提示
- 失败时显示错误提示（包含错误原因）

#### 2. 功能逻辑需求

**输入处理：**
- 获取当前编辑器中的完整 Markdown 内容
- 支持空内容检测（空内容时禁用功能）
- 支持大文件处理（考虑性能优化）

**AI 调用需求：**
- 使用系统默认的 AI 提供商（默认 KIMI）
- 支持用户切换 AI 提供商（自动使用当前选择的提供商）
- 构建合适的 system prompt 和 user prompt
- 处理 AI 调用超时和错误情况

**输出处理：**
- 接收 AI 返回的美化后的 Markdown 内容
- 清理可能的代码块包裹（AI 可能用 ```markdown 包裹输出）
- 验证输出内容的有效性
- 替换编辑器中的原始内容

#### 3. 美化规则需求

**格式优化要求：**
1. **标题层级**：统一标题格式，确保层级清晰（# ## ###）
2. **列表格式**：统一列表符号（统一使用 `-` 或 `*`），规范嵌套
3. **代码块**：规范代码块格式，确保语言标识正确
4. **链接和图片**：确保链接和图片格式正确
5. **段落间距**：优化段落之间的空行，保持合理间距
6. **特殊字符**：处理转义字符和特殊符号
7. **语言保持**：保持原始内容的语言（中文/英文），不翻译
8. **内容完整性**：不添加、删除或修改内容语义，只进行格式调整

**边界情况处理：**
- 空内容：不执行美化
- 纯文本：转换为合适的 Markdown 格式
- 已格式化内容：进行微调优化
- 包含代码的内容：保持代码块格式不变

### 非功能需求

#### 1. 性能需求
- AI 调用响应时间：通常 3-10 秒（取决于内容长度和 AI 提供商）
- 大文件处理：对于超过 5000 行的文件，考虑分块处理或提示用户
- UI 响应性：点击后立即显示加载状态，不阻塞 UI

#### 2. 可靠性需求
- 错误处理：完善的错误捕获和用户提示
- 网络异常：处理网络超时、连接失败等情况
- 内容验证：确保美化后的内容有效且可编辑

#### 3. 用户体验需求
- 操作简单：一键完成，无需额外配置
- 反馈及时：实时显示处理状态
- 可撤销：考虑添加撤销功能（保存原始内容）

## 技术分析

### 架构理解

#### 1. 编辑器架构

**ZenMark 编辑器结构：**
```
zenmark-editor-component.tsx (主组件)
  ├── ZenmarkEditor (核心编辑器组件，来自 zenmark-editor 包)
  │   └── MenuBar (工具栏组件)
  │       └── zenmark-editor__header-left (工具按钮区域)
  ├── useDocument hook (内容管理)
  │   ├── content (当前内容)
  │   ├── setContent (更新内容)
  │   └── flush (保存内容)
  └── DOM 操作 (注入自定义按钮)
```

**关键发现：**
- 编辑器使用 `zenmark-editor` npm 包（版本 0.1.25）
- 工具栏由 `MenuBar.tsx` 组件渲染，位于 `node_modules/zenmark-editor/src/components/MenuBar.tsx`
- 项目通过 DOM 操作（`querySelector` + `createPortal`）注入自定义按钮
- 已有类似实现：PPT 生成按钮、源码模式切换按钮

#### 2. AI 服务架构

**AI 调用链路：**
```
AIService (核心服务类)
  ├── providerStore (提供商存储，获取当前选择的 AI 提供商)
  ├── providerConfigs (提供商配置，包含 KIMI 等配置)
  └── generateText() (生成文本方法)
      └── callAPI() (内部调用方法)
          ├── getAIModel() (获取 AI 模型)
          └── generateText() (Vercel AI SDK)
```

**关键发现：**
- 使用 `@dty/ai-assistant-core` 包提供的 `AIService` 类
- 项目中有封装：`src/services/ai/ai-service.ts`，继承自 `CoreAIService`
- 支持多提供商：OpenAI、Dashscope、OpenRouter、DeepSeek、Kimi、GLM
- 默认提供商可通过 `aiProviderStore.getProvider()` 获取
- 使用 Vercel AI SDK 的 `generateText` 方法进行调用

#### 3. 内容管理架构

**内容流转：**
```
useDocument hook
  ├── content (状态：当前编辑器内容)
  ├── setContent() (更新内容，触发编辑器更新)
  ├── flush() (保存内容到文件系统)
  └── loading/saving (加载和保存状态)
```

**关键发现：**
- 使用 `useDocument` hook 管理文档内容
- `content` 状态与 `ZenmarkEditor` 的 `value` prop 绑定
- `setContent` 更新内容会触发编辑器重新渲染
- 内容变更不会自动保存（`autosave: false`），需要手动调用 `flush()`

### 技术实现方向

#### 1. UI 注入方案

**方案选择：DOM 操作 + React Portal**

**实现思路：**
1. 在 `useEffect` 中查找 `zenmark-editor__header-left` 元素
2. 创建容器元素并 append 到 `header-left` 的最后
3. 使用 `createPortal` 将 React 按钮组件注入到容器中
4. 监听 DOM 变化，确保元素存在后再注入

**参考实现：**
- 现有代码中已有类似实现（`rightButtonContainerRef` 用于右侧按钮）
- 使用 `MutationObserver` 监听 DOM 变化
- 使用 `createPortal` 实现 React 组件注入

**技术要点：**
- 需要处理异步 DOM 加载（编辑器可能延迟渲染工具栏）
- 需要处理组件卸载时的清理（移除注入的元素）
- 需要处理编辑器重新渲染的情况（key 变化时）

#### 2. AI 调用方案

**方案选择：直接使用 AIService**

**实现思路：**
1. 创建 `AIService` 实例（使用默认配置）
2. 构建 system prompt（定义美化规则和要求）
3. 构建 user prompt（包含原始 Markdown 内容）
4. 调用 `generateText()` 方法获取美化后的内容
5. 处理返回结果（清理代码块包裹等）

**技术要点：**
- System prompt 需要详细说明美化规则
- User prompt 需要清晰标记内容边界（使用代码块包裹）
- 需要处理 AI 返回的格式（可能包含代码块包裹）
- 需要处理超时和错误情况

**Prompt 设计思路：**
```
System Prompt:
- 角色定义：专业的 Markdown 格式化助手
- 任务说明：美化 Markdown 内容，不改变语义
- 规则列表：标题、列表、代码块、链接等格式要求
- 输出要求：只返回格式化后的内容，不添加解释

User Prompt:
- 使用代码块包裹原始内容
- 明确说明美化要求
```

#### 3. 内容更新方案

**方案选择：直接使用 setContent**

**实现思路：**
1. AI 返回美化后的内容
2. 清理可能的代码块包裹
3. 验证内容有效性（非空、格式正确）
4. 调用 `setContent()` 更新编辑器内容
5. 可选：调用 `flush()` 自动保存

**技术要点：**
- 需要清理 AI 可能添加的代码块标记
- 需要验证内容是否有效
- 考虑是否需要自动保存（根据用户需求）
- 考虑添加撤销功能（保存原始内容到状态中）

### 核心改动点分析

#### 1. 文件修改

**主要文件：`src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`**

**改动内容：**
1. **导入依赖**：
   - `AIService` from `@/services/ai/ai-service`
   - 图标组件（如 `Sparkles` from `lucide-react`）
   - `xbook` for notification service

2. **状态添加**：
   - `headerLeftElement` state（存储 header-left 元素引用）
   - `headerLeftContainerRef` ref（存储容器元素引用）
   - `isBeautifying` state（加载状态）

3. **DOM 操作逻辑**：
   - 修改 `findToolbar` 函数，添加查找 `zenmark-editor__header-left` 的逻辑
   - 创建容器元素并 append 到 header-left
   - 使用 `MutationObserver` 监听 DOM 变化

4. **业务逻辑**：
   - `handleBeautifyMarkdown` 函数（核心美化逻辑）
   - 按钮组件定义
   - Portal 注入逻辑

#### 2. 依赖关系

**新增依赖：**
- `@/services/ai/ai-service` - AI 服务（已存在）
- `lucide-react` - 图标库（已存在）

**无需新增依赖：**
- React Portal（React 内置）
- DOM API（浏览器内置）

#### 3. 配置影响

**无需修改配置：**
- AI 提供商配置（使用现有配置）
- 编辑器配置（使用现有配置）
- 环境变量（使用现有变量）

### 技术风险分析

#### 1. 潜在风险

**风险 1：DOM 元素查找失败**
- **原因**：编辑器可能延迟渲染，或 DOM 结构变化
- **影响**：按钮无法注入
- **缓解**：使用 `MutationObserver` 监听，添加重试机制

**风险 2：AI 调用失败**
- **原因**：网络问题、API 限制、提供商故障
- **影响**：功能无法使用
- **缓解**：完善的错误处理和用户提示

**风险 3：AI 返回格式异常**
- **原因**：AI 可能返回非 Markdown 格式的内容
- **影响**：内容替换失败或格式错误
- **缓解**：内容验证和清理逻辑

**风险 4：大文件处理性能**
- **原因**：内容过长导致 AI 调用超时或响应慢
- **影响**：用户体验差
- **缓解**：添加内容长度检查，提供分块处理或提示

#### 2. 兼容性考虑

**编辑器兼容性：**
- 依赖 `zenmark-editor` 包的 DOM 结构
- 如果包更新导致结构变化，需要同步更新

**AI 提供商兼容性：**
- 支持所有已配置的 AI 提供商
- 不同提供商的响应格式可能略有差异

**浏览器兼容性：**
- 使用标准 DOM API 和 React API
- 兼容现代浏览器

### 实现优先级

#### 高优先级（核心功能）
1. ✅ 按钮注入逻辑（DOM 操作）
2. ✅ AI 调用逻辑（AIService 集成）
3. ✅ 内容更新逻辑（setContent）
4. ✅ 基础错误处理

#### 中优先级（体验优化）
1. ⚠️ 加载状态显示
2. ⚠️ 用户提示（成功/失败）
3. ⚠️ 内容验证和清理
4. ⚠️ 空内容检测

#### 低优先级（增强功能）
1. 📋 撤销功能（保存原始内容）
2. 📋 大文件处理优化
3. 📋 美化历史记录
4. 📋 自定义美化规则

## 需求总结

### 核心价值

**用户价值：**
- 快速美化 Markdown 内容，提升编辑效率
- 智能格式化，保证内容质量
- 一键操作，简化工作流程

**技术价值：**
- 复用现有 AI 服务架构，无需额外开发
- 遵循现有代码模式，易于维护
- 扩展性好，可后续增强功能

### 关键成功因素

1. **AI Prompt 设计**：需要精心设计 system prompt 和 user prompt，确保 AI 理解美化要求
2. **错误处理**：完善的错误处理和用户反馈，提升用户体验
3. **性能优化**：对于大文件，需要考虑性能优化方案
4. **内容验证**：确保美化后的内容有效且可编辑

### 后续扩展方向

1. **自定义规则**：允许用户自定义美化规则
2. **美化历史**：记录美化历史，支持对比和撤销
3. **批量处理**：支持批量美化多个文件
4. **美化预设**：提供不同的美化风格预设（简洁、详细等）

## 相关文件清单

### 核心文件
- `src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx` - 主要修改文件

### 依赖文件
- `src/services/ai/ai-service.ts` - AI 服务（使用，不修改）
- `src/services/ai/ai-provider.store.ts` - AI 提供商存储（使用，不修改）
- `src/services/ai/providers.ts` - AI 提供商配置（使用，不修改）
- `packages/ai-assistant-core/src/core/ai-service.ts` - AI 服务核心（使用，不修改）

### 参考文件
- `node_modules/zenmark-editor/src/components/MenuBar.tsx` - 工具栏结构参考（只读）
- `node_modules/zenmark-editor/src/css/base/editor.scss` - 样式参考（只读）

### 文档文件
- `docs/issues/markdown-ai-beautify-feature.md` - 本文档

