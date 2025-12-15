# Chat Agent - FastAPI + Google ADK

基于 FastAPI 和 Google Agent Development Kit (ADK) 的聊天代理服务。

## 📁 项目结构

```
apps/chat-agent/
├── src/              # 源代码
│   ├── main.py      # FastAPI 服务器入口
│   ├── api/         # API 路由和中间件
│   ├── agents/      # 智能体定义（按功能分类）
│   │   ├── general/    # 通用智能体
│   │   ├── business/    # 业务智能体
│   │   └── content/    # 内容生成智能体
│   ├── tools/       # 共享工具
│   └── adapters/    # 模型适配器
├── tests/           # 测试代码
├── scripts/         # 启动脚本
├── docs/            # 项目文档
└── config/          # 配置文件示例
```

## 🚀 快速开始

### 安装依赖

```bash
make setup
# 或
uv sync --no-install-project
```

### 配置环境变量

```bash
# 复制配置示例
cp src/agents/hello_agent/.env.example src/agents/hello_agent/.env

# 编辑 .env 文件，添加你的 GOOGLE_API_KEY
```

### 启动服务器

```bash
make run
# 或
./scripts/run.sh
# 或
uv run python -m src.main
```

服务器将在 `http://localhost:8234` 启动。

## 📚 详细文档

查看 [docs/README.md](docs/README.md) 获取完整文档。

## 🧪 运行测试

```bash
make test
# 或
uv run python -m pytest tests/
```

## 🔧 开发模式

启动 ADK Dev UI：

```bash
make dev
# 或
cd src/agents && uv run adk web --port 8334
```

## 📖 更多信息

- [安装指南](docs/INSTALL_MAKE.md)
- [Makefile 使用指南](docs/MAKEFILE_GUIDE.md)
- [模型配置](docs/MODELS_CONFIGURATION.md)
- [故障排除](docs/TROUBLESHOOTING.md)
