# 测试聊天输入功能

## 命令描述

这个命令用于测试 AI Assistant 聊天功能的完整流程，包括打开应用、发送消息、查看 AI 响应和工具调用结果。

## 操作步骤

### 1. 打开应用页面
- 使用 MCP 浏览器工具导航到：`http://localhost:5173/#/https://gitee.com/dty2025/dty-doc`
- 等待页面完全加载（约 2-3 秒）

### 2. 定位并操作聊天界面
- 在页面右侧找到 AI Assistant 聊天面板
- 定位聊天输入框（通常显示 "Type a message..." 占位符）
- 在输入框中输入测试消息：`你好 这个目录下面有啥`
- 点击发送按钮（通常是输入框右侧的向上箭头图标）

### 3. 等待 AI 响应
- 等待 AI 处理请求（通常需要 5-10 秒）
- 观察页面变化，AI 会显示：
  - 文本响应内容
  - 工具调用状态（如果有）
  - 工具执行结果

### 4. 查看工具调用详情
- 如果看到工具调用卡片（显示 "Tool: fs_readdir" 等），点击"展开工具详情"按钮
- 查看工具调用的详细信息：
  - `args`: 工具调用时传递的参数
  - `result`: 工具执行返回的结果
  - `status`: 工具调用状态（call/result/error）

## 预期结果

### 正常情况
1. AI 会理解用户的问题并尝试调用 `fs_readdir` 工具
2. 工具会从当前页面上下文自动获取 `spaceId`
3. 工具成功执行并返回目录内容列表
4. AI 基于工具结果生成最终回复

### 可能的问题
1. **第一次调用失败**：如果 AI 没有提供 `spaceId`，工具会报错
   - 错误信息：`fs_* 工具需要空间信息。请在调用时提供 spaceId 或 uri，或者确保当前页面在某个空间中。`
2. **第二次调用进行中**：工具会尝试从上下文自动获取 `spaceId`，可能需要更长时间
3. **工具调用卡住**：如果工具执行超时（超过 10 秒），会返回空结果

## 技术细节

### 使用的工具
- **MCP 浏览器工具**：用于页面导航和交互
  - `browser_navigate`: 导航到指定 URL
  - `browser_snapshot`: 获取页面快照
  - `browser_type`: 在输入框中输入文本
  - `browser_click`: 点击按钮或元素
  - `browser_wait_for`: 等待页面加载或响应
  - `browser_take_screenshot`: 截取页面截图

### AI 工具调用流程
1. **TOOL_CALL_START**: AI 决定调用工具
2. **TOOL_CALL_ARGS_DELTA**: AI 逐步提供参数
3. **TOOL_CALL_END**: 参数收集完成
4. **工具执行**: 执行 `fs_readdir` 工具的 `execute` 方法
5. **TOOL_RESULT**: 返回结果给 AI
6. **AI 继续处理**: 基于工具结果生成最终回复

### 工具自动获取 spaceId 机制
- 如果 AI 没有提供 `spaceId`，工具会：
  1. 尝试从 `args.uri` 中提取
  2. 尝试从 `args.spaceId` 中获取
  3. 如果都没有，调用 `aiContextService.getCurrentPageContext()` 获取当前页面 URI
  4. 从页面 URI 中提取 `spaceId`
  5. 如果仍然无法获取，抛出错误

## 验证点

执行此命令后，应该验证：
- [ ] 页面成功加载
- [ ] 消息成功发送
- [ ] AI 返回了响应
- [ ] 工具被正确调用（如果适用）
- [ ] 工具执行成功或显示了明确的错误信息
- [ ] 最终回复内容合理

## 注意事项

1. 确保应用正在运行（`localhost:5173`）
2. 确保当前页面在某个空间中（有有效的 `spaceId`）
3. 如果工具调用失败，检查浏览器控制台的日志
4. 工具执行有 10 秒超时保护，超时会返回空结果

## 相关文件

- 工具实现：`dty-gitary/src/features/global-sidecar-providers/tools/fs/index.ts`
- AI Agent Runner：`dty-gitary/src/services/ai/ai-agent-runner.ts`
- 聊天面板：`dty-gitary/src/features/global-sidecar-providers/panes/global-chat-panel.tsx`

