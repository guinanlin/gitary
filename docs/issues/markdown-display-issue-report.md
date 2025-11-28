# Markdown 文档显示问题报告

## 问题概述

在 ZenMark 编辑器中，某些 Markdown 文件的开头内容无法正常显示。具体表现为：文档开头的 `---` 分隔符和标题内容被隐藏，编辑器从文档的第二个主要部分开始显示。

## 问题详细描述

### 问题现象

1. **显示异常**：文档开头的 `---` 分隔符和 `## ✅ **审批流程需求**` 标题无法显示
2. **显示正常**：从 `### **1. 支持"催审"功能**` 开始的内容可以正常显示
3. **问题范围**：并非所有 Markdown 文件都有此问题，仅特定格式的文件受影响

### 问题文件示例

**问题文件的开头内容：**
```markdown
---



## ✅ **审批流程需求**



### **1. 支持"催审"功能**



- 避免审批卡住无人处理。



- 需要提供催办按钮与催办通知。



---



### **2. 前端页面要能清晰显示：当前单据正由谁审批**

...
```

**实际显示情况：**
- ❌ 不显示：开头的 `---` 和 `## ✅ **审批流程需求**` 标题
- ✅ 正常显示：从 `### **1. 支持"催审"功能**` 开始的所有内容

## 技术分析

### 可能的原因

1. **Frontmatter 解析问题**：
   - 开头的 `---` 可能被 ZenMark 编辑器识别为 YAML frontmatter 分隔符
   - 由于后面没有正确的 frontmatter 格式（没有 key: value 对，也没有结束的 `---`），导致解析器可能跳过了这部分内容

2. **滚动位置问题**：
   - 编辑器加载后滚动位置不在顶部，导致开头内容被隐藏在可视区域外
   - 但此问题已通过代码修复尝试解决，问题仍然存在

3. **内容渲染问题**：
   - 开头的 `---` 和空行可能被解析器忽略或隐藏
   - DOM 中可能没有正确渲染这部分内容

### 相关文件

1. **编辑器组件**：
   - `src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`
   - 负责 ZenMark 编辑器的渲染和交互

2. **样式文件**：
   - `src/plugins/core/base/css/widgets.scss`
   - 包含 `.zenmark-editor` 相关的样式定义

3. **编辑器库**：
   - 使用 `zenmark-editor` 库（从 `zenmark-editor` 包导入）
   - 可能使用 ProseMirror 作为底层编辑器（从代码中看到 `.ProseMirror` 选择器）

## 已尝试的解决方案

### 1. 滚动位置修复

**文件**：`src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`

**修改内容**：
- 添加了 `useEffect` 钩子，在编辑器加载后自动滚动到顶部
- 查找多个可能的滚动容器（`.zenmark-editor-content-wrapper`、`.zenmark-editor-content`、`.ProseMirror`）
- 使用 `scrollIntoView` 确保第一个可见元素在可视区域内
- 添加了 MutationObserver 监听 DOM 变化，在内容渲染完成后重试滚动

**结果**：问题仍然存在，说明可能不是滚动位置问题

### 2. CSS 样式优化

**文件**：`src/plugins/core/base/css/widgets.scss`

**修改内容**：
- 为 `.zenmark-editor-content-wrapper` 添加了滚动相关样式
- 为开头的 `hr` 和标题元素添加了样式，确保它们不会被隐藏

**结果**：问题仍然存在

## 需要进一步调查的方向

### 1. DOM 结构检查

**需要确认**：
- 在浏览器开发者工具中检查 DOM，确认开头的 `---` 和标题是否被渲染到 DOM 中
- 如果内容在 DOM 中但不可见，可能是 CSS 样式问题
- 如果内容不在 DOM 中，说明是解析/渲染问题

### 2. Frontmatter 解析逻辑

**需要调查**：
- ZenMark 编辑器如何处理以 `---` 开头的 Markdown 内容
- 是否有 frontmatter 解析逻辑导致开头内容被跳过
- 是否可以配置或禁用 frontmatter 解析

### 3. ProseMirror 配置

**需要检查**：
- ProseMirror 的 schema 配置是否过滤了开头的 `---`
- 是否有插件或扩展影响了内容的解析和渲染

### 4. Markdown 解析器

**需要了解**：
- ZenMark 编辑器使用的 Markdown 解析器类型
- 解析器是否对开头的 `---` 有特殊处理
- 是否可以配置解析器的行为

## 复现步骤

1. 创建一个新的 Markdown 文件，内容如下：
   ```markdown
   ---



   ## ✅ **审批流程需求**



   ### **1. 支持"催审"功能**



   - 避免审批卡住无人处理。

   - 需要提供催办按钮与催办通知。

   ---
   ```

2. 在 ZenMark 编辑器中打开该文件
3. 观察编辑器显示的内容
4. **预期结果**：应该显示从开头的 `---` 开始的所有内容
5. **实际结果**：只显示从 `### **1. 支持"催审"功能**` 开始的内容

## 环境信息

- **编辑器**：ZenMark Editor
- **底层库**：可能使用 ProseMirror
- **文件类型**：`.md`、`.markdown`、`.MD`
- **问题文件特征**：以 `---` 开头，后面跟着空行和标题

## 建议的调试方法

1. **检查 DOM 结构**：
   ```javascript
   // 在浏览器控制台执行
   const editor = document.querySelector('.zenmark-editor-content, .ProseMirror');
   console.log(editor?.innerHTML);
   ```

2. **检查滚动位置**：
   ```javascript
   const scrollContainer = document.querySelector('.zenmark-editor-content-wrapper');
   console.log('Scroll Top:', scrollContainer?.scrollTop);
   console.log('Scroll Height:', scrollContainer?.scrollHeight);
   ```

3. **检查第一个元素**：
   ```javascript
   const firstElement = document.querySelector('.zenmark-editor-content hr, .zenmark-editor-content h2');
   console.log('First Element:', firstElement);
   console.log('First Element Rect:', firstElement?.getBoundingClientRect());
   ```

## 相关代码位置

### 编辑器组件
- **文件**：`src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx`
- **关键代码**：第 236-333 行（滚动修复逻辑）

### 样式文件
- **文件**：`src/plugins/core/base/css/widgets.scss`
- **关键代码**：第 94-155 行（`.zenmark-editor` 样式）

### 编辑器注册
- **文件**：`src/features/providers/provide-zenmark-editor/index.tsx`
- **说明**：ZenMark 编辑器的注册和初始化逻辑

## 总结

这是一个特定格式的 Markdown 文件在 ZenMark 编辑器中显示不完整的问题。开头的 `---` 分隔符和标题内容无法显示，但后续内容正常。已尝试通过滚动位置修复和 CSS 优化解决，但问题仍然存在。需要进一步调查 ZenMark 编辑器的解析逻辑，特别是对以 `---` 开头的 Markdown 内容的处理方式。

---

**报告生成时间**：2025-01-27  
**问题状态**：待解决  
**优先级**：中

