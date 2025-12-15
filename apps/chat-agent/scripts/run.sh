#!/bin/bash

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed!"
    echo "Please install uv first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "  or: pip install uv"
    exit 1
fi

echo "Using uv version: $(uv --version)"

# 同步依赖（uv 会自动创建虚拟环境）
# 使用 --no-install-project 因为这是应用而不是库
echo "Syncing dependencies with uv..."
uv sync --no-install-project

# 检查 .env 文件
if [ ! -f "src/agents/hello_agent/.env" ]; then
    echo "⚠️  Warning: src/agents/hello_agent/.env not found!"
    echo "Please copy src/agents/hello_agent/.env.example to src/agents/hello_agent/.env and add your GOOGLE_API_KEY"
    exit 1
fi

# 启动服务器（使用 uv run）
echo "Starting FastAPI server on port 8234..."
uv run python -m src.main
