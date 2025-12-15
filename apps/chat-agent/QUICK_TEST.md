# 快速测试指南

## 运行测试脚本

### 1. 测试 Agent 配置

```bash
# 进入 chat-agent 目录
cd apps/chat-agent

# 运行配置测试
uv run python image_2_scripts/test_agent.py
```

### 2. 调试 Agent（完整测试）

```bash
# 在 apps/chat-agent 目录下
cd apps/chat-agent

# 运行调试脚本
uv run python debug_image_agent.py
```

### 3. 测试 GitCode API

```bash
# 在 apps/chat-agent 目录下
cd apps/chat-agent

# 运行 API 测试
uv run python test_gitcode_api.py
```

## 启动服务器

```bash
# 在 apps/chat-agent 目录下
cd apps/chat-agent

# 启动服务器
uv run python main.py
```

## 验证 Agent 是否加载

启动服务器后，在另一个终端运行：

```bash
# 列出所有 agents
curl http://localhost:8234/adk/apps

# 应该看到 image_2_scripts 在列表中
```
