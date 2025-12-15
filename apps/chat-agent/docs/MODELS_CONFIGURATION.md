# ADK 模型配置指南

## 支持两种类型的模型

### 1. Google Gemini 模型（原生支持）

直接在 Agent 中使用模型名称字符串即可：

```python
from google.adk.agents import Agent

root_agent = Agent(
    name="my_agent",
    model="gemini-2.5-flash",  # 或 "gemini-2.5-pro"
    # ... 其他参数
)
```

**可用的 Gemini 模型：**
- `gemini-2.5-flash` - 快速响应，适合大多数场景
- `gemini-2.5-pro` - 更强大的推理能力

**需要的环境变量：**
```bash
GOOGLE_API_KEY=your-google-api-key
GOOGLE_GENAI_USE_VERTEXAI=FALSE
```

### 2. 非 Google 模型（通过 LiteLLM）

使用 `LiteLlm` 包装类来支持 OpenAI、Anthropic、Cohere 等第三方模型。

#### 安装依赖

```bash
pip install litellm
```

#### 配置 API Keys

在 `.env` 文件中设置相应提供商的 API key：

```bash
# OpenAI 模型
OPENAI_API_KEY=your-openai-api-key

# Anthropic 模型
ANTHROPIC_API_KEY=your-anthropic-api-key

# Cohere 模型
COHERE_API_KEY=your-cohere-api-key
```

#### 使用示例

```python
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm

# OpenAI GPT-4o
root_agent_openai = Agent(
    name="openai_agent",
    model=LiteLlm(model="openai/gpt-4o"),
    instruction="You are a helpful assistant.",
    # ... 其他参数
)

# Anthropic Claude Sonnet
root_agent_claude = Agent(
    name="claude_agent",
    model=LiteLlm(model="anthropic/claude-3-5-sonnet-20241022"),
    instruction="You are a helpful assistant.",
    # ... 其他参数
)

# Anthropic Claude Haiku (更快更便宜)
root_agent_haiku = Agent(
    name="haiku_agent",
    model=LiteLlm(model="anthropic/claude-3-haiku-20240307"),
    instruction="You are a helpful assistant.",
    # ... 其他参数
)
```

#### 支持的模型提供商

LiteLLM 支持 100+ 模型提供商，包括：

- **OpenAI**: `openai/gpt-4o`, `openai/gpt-4-turbo`, `openai/gpt-3.5-turbo` 等
- **Anthropic**: `anthropic/claude-3-5-sonnet-20241022`, `anthropic/claude-3-haiku-20240307` 等
- **Cohere**: `cohere/command`, `cohere/command-light` 等
- **Mistral**: `mistral/mistral-large-latest`, `mistral/mistral-medium` 等
- **Meta**: `meta-llama/llama-3.1-405b-instruct` 等
- **还有很多其他提供商...**

查看完整列表：https://docs.litellm.ai/docs/providers

#### 模型命名格式

LiteLLM 使用 `provider/model-name` 格式：
- `openai/gpt-4o`
- `anthropic/claude-3-5-sonnet-20241022`
- `cohere/command`
- `mistral/mistral-large-latest`

#### Windows 系统注意事项

如果使用 LiteLLM 在 Windows 上遇到编码错误，设置环境变量：

```powershell
# PowerShell（当前会话）
$env:PYTHONUTF8 = "1"

# 持久设置（用户级别）
[System.Environment]::SetEnvironmentVariable('PYTHONUTF8', '1', [System.EnvironmentVariableTarget]::User)
```

#### 工具兼容性提示

⚠️ **注意**：某些 ADK 内置工具可能只在 Google Gemini 模型上完全支持。使用第三方模型时，某些工具可能会有功能限制。

#### 完整示例

参考 `hello_agent/agent_with_other_models.py` 查看完整的使用示例。
