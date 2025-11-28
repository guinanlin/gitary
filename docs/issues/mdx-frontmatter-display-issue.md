# MDX 文件 Frontmatter 显示问题报告

## 问题概述

在 ZenMark 编辑器中，MDX 文件（`.mdx`）的 YAML frontmatter 在预览模式下显示异常。Frontmatter 应该被隐藏或特殊处理，但目前可能以错误的方式显示，影响了文档的可读性。

## 问题详细描述

### 问题现象

1. **文件类型**：`.mdx` 文件（Markdown + JSX 格式）
2. **Frontmatter 格式**：标准的 YAML frontmatter，格式如下：
   ```yaml
   ---
   title: API 文档
   description: APS 平台 REST API 与集成说明
   order: 3
   ---
   ```
3. **显示问题**：Frontmatter 在预览模式下显示不正确，可能：
   - 以原始 YAML 代码块形式显示
   - 以水平分隔线（`<hr>`）形式显示
   - 或者以其他不期望的方式显示
4. **期望行为**：Frontmatter 应该在预览模式下被隐藏，因为它是元数据，不是文档内容的一部分

### 问题文件示例

**MDX 文件内容：**
```markdown
---
title: API 文档
description: APS 平台 REST API 与集成说明
order: 3
---

# API 文档

这是实际的文档内容...
```

**当前显示情况**：
- ❌ Frontmatter 部分（`---` 之间的内容）在预览模式下显示
- ✅ 文档内容部分正常显示

**期望显示情况**：
- ✅ Frontmatter 部分在预览模式下隐藏
- ✅ 文档内容部分正常显示
- ✅ 在源码模式下，frontmatter 仍然可见和可编辑

## 技术分析

### Frontmatter 解析机制

MDX 文件使用标准的 YAML frontmatter 格式：
- 以 `---` 开头
- 包含 YAML 键值对（如 `title:`, `description:`, `order:` 等）
- 以 `---` 结尾

### 可能的原因

1. **ZenMark 编辑器解析问题**：
   - ZenMark 编辑器可能将 frontmatter 解析为普通的 Markdown 内容
   - 可能将 `---` 解析为水平分隔线（`<hr>` 标签）
   - 可能将 YAML 内容解析为代码块

2. **缺少 Frontmatter 处理逻辑**：
   - 编辑器可能没有专门的 frontmatter 解析和处理逻辑
   - 需要在预览模式下识别并隐藏 frontmatter 部分

3. **CSS 样式问题**：
   - 即使 frontmatter 被正确识别，CSS 样式可能没有正确隐藏它
   - 需要确保 frontmatter 相关的 DOM 元素被隐藏

### 相关文件

#### 1. 编辑器组件
- **文件**：`src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`
- **说明**：ZenMark 编辑器的主要组件，负责渲染和交互
- **当前状态**：已添加了 `hideFrontmatter` 函数，但可能不够完善

#### 2. 样式文件
- **文件**：`src/plugins/core/base/css/widgets.scss`
- **说明**：包含 ZenMark 编辑器的样式定义
- **当前状态**：已添加了隐藏 frontmatter 的 CSS 规则，但可能选择器不够精确

#### 3. 编辑器库
- **库名**：`zenmark-editor`
- **说明**：第三方 Markdown 编辑器库
- **可能的问题**：需要了解该库是否支持 frontmatter 处理，或者需要自定义处理

#### 4. 文件类型配置
- **文件**：`src/features/providers/provide-zenmark-editor/index.tsx`
- **说明**：编辑器注册和文件匹配规则
- **当前状态**：已添加 `.mdx` 扩展名支持

## 已尝试的解决方案

### 1. JavaScript 逻辑 - 自动检测和隐藏 Frontmatter

**文件**：`src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`

**修改内容**：
- 添加了 `hideFrontmatter` 函数，用于检测和隐藏 frontmatter
- 检测以 `---` 开头和结尾的 frontmatter 块
- 识别包含 YAML 内容（如 `title:`, `description:`, `order:` 等）的 frontmatter
- 通过设置 `display: none` 隐藏 frontmatter 元素

**代码位置**：第 241-320 行（`useEffect` 钩子中）

**结果**：问题仍然存在，说明：
- 可能 DOM 结构检测不准确
- 可能 frontmatter 的渲染方式与预期不同
- 可能需要更精确的选择器或检测逻辑

### 2. CSS 样式 - 隐藏 Frontmatter 相关元素

**文件**：`src/plugins/core/base/css/widgets.scss`

**修改内容**：
- 添加了隐藏 YAML 代码块的 CSS 规则
- 添加了隐藏 frontmatter 标记元素的规则
- 添加了隐藏开头的 YAML/frontmatter 代码块的规则

**代码位置**：第 158-180 行

**结果**：问题仍然存在，说明：
- CSS 选择器可能不够精确
- 可能 frontmatter 被渲染为其他类型的元素
- 可能需要更具体的 DOM 结构分析

## 需要进一步调查的方向

### 1. DOM 结构分析（关键）

**需要确认**：
- 在浏览器开发者工具中检查 DOM，确认 frontmatter 是如何被渲染的
- 检查 frontmatter 被渲染为什么类型的元素：
  - 是否是 `<hr>` 标签？
  - 是否是 `<pre><code>` 代码块？
  - 是否是其他类型的元素？
- 检查 frontmatter 是否有特定的 class 或 data 属性

**调试方法**：
```javascript
// 在浏览器控制台执行
const editor = document.querySelector('.zenmark-editor-content, .ProseMirror');
console.log('Editor HTML:', editor?.innerHTML);
console.log('First child:', editor?.firstElementChild);
console.log('All children:', Array.from(editor?.children || []));
```

### 2. ZenMark 编辑器库文档

**需要调查**：
- ZenMark 编辑器是否支持 frontmatter 处理？
- 是否有配置选项可以启用/禁用 frontmatter 解析？
- 是否有插件或扩展可以处理 frontmatter？
- 查看 ZenMark 编辑器的源码或文档，了解其解析机制

### 3. ProseMirror 配置（如果使用）

**需要检查**：
- 如果 ZenMark 使用 ProseMirror 作为底层编辑器
- ProseMirror 的 schema 配置是否支持 frontmatter？
- 是否需要自定义节点类型来处理 frontmatter？
- 是否有插件可以处理 frontmatter？

### 4. 内容预处理

**可能的解决方案**：
- 在内容传递给编辑器之前，预处理内容
- 提取 frontmatter 并单独存储
- 将处理后的内容（不含 frontmatter）传递给编辑器
- 在保存时重新组合 frontmatter 和内容

### 5. 更精确的 DOM 检测和隐藏

**需要改进**：
- 更准确地检测 frontmatter 的 DOM 结构
- 使用更精确的 CSS 选择器
- 可能需要使用 MutationObserver 监听 DOM 变化
- 确保在内容渲染完成后才执行隐藏操作

## 建议的调试步骤

### 步骤 1：检查 DOM 结构

1. 打开一个有 frontmatter 的 MDX 文件
2. 打开浏览器开发者工具
3. 检查 `.zenmark-editor-content` 或 `.ProseMirror` 元素的 DOM 结构
4. 记录 frontmatter 是如何被渲染的

### 步骤 2：测试 CSS 选择器

1. 在开发者工具中测试不同的 CSS 选择器
2. 找到能够准确选择 frontmatter 元素的选择器
3. 验证 `display: none` 是否能够隐藏元素

### 步骤 3：测试 JavaScript 逻辑

1. 在控制台中手动执行 `hideFrontmatter` 函数
2. 检查函数是否能正确找到 frontmatter 元素
3. 检查隐藏操作是否生效

### 步骤 4：查看 ZenMark 编辑器源码

1. 查找 `zenmark-editor` 包的源码
2. 了解其如何处理 Markdown 内容
3. 查看是否有 frontmatter 相关的处理逻辑

## 可能的解决方案

### 方案 1：改进 DOM 检测逻辑

**思路**：更准确地检测 frontmatter 的 DOM 结构

**实现**：
- 检查第一个和第二个 `<hr>` 标签之间的内容
- 检查第一个 `<pre><code>` 代码块是否包含 YAML 内容
- 使用更精确的选择器和检测逻辑

### 方案 2：内容预处理

**思路**：在传递给编辑器之前处理内容

**实现**：
- 解析 frontmatter 并提取元数据
- 将不含 frontmatter 的内容传递给编辑器
- 在保存时重新组合

### 方案 3：使用 ZenMark 编辑器插件

**思路**：如果 ZenMark 支持插件，使用插件处理 frontmatter

**实现**：
- 查找或创建 ZenMark 插件
- 在插件中处理 frontmatter 的显示/隐藏

### 方案 4：自定义 ProseMirror 节点（如果适用）

**思路**：如果使用 ProseMirror，创建自定义节点类型

**实现**：
- 定义 frontmatter 节点类型
- 在预览模式下隐藏该节点
- 在源码模式下显示该节点

## 相关代码位置

### 当前实现位置

1. **Frontmatter 隐藏逻辑**：
   - 文件：`src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`
   - 函数：`hideFrontmatter()`（在 `useEffect` 中，约第 244-290 行）

2. **CSS 样式规则**：
   - 文件：`src/plugins/core/base/css/widgets.scss`
   - 位置：第 158-180 行

3. **文件类型支持**：
   - 文件：`src/features/providers/provide-zenmark-editor/index.tsx`
   - 位置：第 20 行（`.mdx` 扩展名匹配）

### 可能需要修改的文件

1. **编辑器组件**：
   - `src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`
   - 可能需要改进 `hideFrontmatter` 函数
   - 可能需要添加内容预处理逻辑

2. **样式文件**：
   - `src/plugins/core/base/css/widgets.scss`
   - 可能需要更精确的 CSS 选择器
   - 可能需要添加更多的样式规则

3. **内容处理工具**（可能需要新建）：
   - 可能需要创建 `src/features/providers/provide-zenmark-editor/utils/frontmatter.ts`
   - 用于解析和处理 frontmatter

4. **编辑器配置**（如果存在）：
   - 可能需要查看 ZenMark 编辑器的配置选项
   - 可能需要修改编辑器初始化参数

## 测试用例

### 测试文件内容

创建一个测试 MDX 文件 `test.mdx`：

```markdown
---
title: API 文档
description: APS 平台 REST API 与集成说明
order: 3
---

# API 文档

这是实际的文档内容。

## 功能说明

文档内容应该正常显示。
```

### 预期行为

1. **预览模式**：
   - Frontmatter（`---` 之间的内容）应该被隐藏
   - 文档内容（`# API 文档` 及之后的内容）应该正常显示

2. **源码模式**：
   - Frontmatter 应该可见和可编辑
   - 文档内容应该可见和可编辑

3. **保存操作**：
   - Frontmatter 应该被正确保存
   - 文档内容应该被正确保存

## 优先级

- **优先级**：中高
- **影响范围**：所有使用 MDX 格式的文件
- **用户体验影响**：Frontmatter 显示会影响文档的可读性

## 总结

这是一个关于 MDX 文件 frontmatter 在 ZenMark 编辑器预览模式下显示的问题。Frontmatter 应该被隐藏，但目前可能以错误的方式显示。已尝试通过 JavaScript 逻辑和 CSS 样式来解决，但问题仍然存在。

**关键问题**：
1. 需要准确了解 frontmatter 在 DOM 中的渲染方式
2. 需要找到能够准确选择和隐藏 frontmatter 的方法
3. 可能需要深入了解 ZenMark 编辑器的内部机制

**建议下一步**：
1. 首先进行 DOM 结构分析，了解 frontmatter 的实际渲染方式
2. 根据 DOM 结构调整检测和隐藏逻辑
3. 如果必要，考虑内容预处理方案

---

**报告生成时间**：2025-01-27  
**问题状态**：待解决  
**优先级**：中高  
**负责工程师**：待分配

