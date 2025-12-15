# GitCode API 配置修复

## 问题

错误信息显示 LiteLLM 访问的是 `/api/v5/` 而不是 `/api/v5/chat/completions`。

## 解决方案

对于 GitCode API，由于它使用 `/api/v5/chat/completions` 路径（不是标准的 `/v1/chat/completions`），我们需要在 `api_base` 中包含完整路径。

### 当前配置

```python
model=LiteLlm(
    model="custom/deepseek-ai/deepseek-vl2",
    api_base="https://api.gitcode.com/api/v5/chat/completions",  # 包含完整路径
    api_key=gitcode_api_key,
)
```

### 测试配置

运行以下命令测试 LiteLLM 配置：

```bash
cd apps/chat-agent
uv run python test_litellm_direct.py
```

这会测试不同的配置方式，找出正确的格式。

## 如果仍然失败

如果上述配置仍然失败，可能需要：

1. **检查 LiteLLM 版本**：确保使用最新版本
   ```bash
   uv run pip install --upgrade litellm
   ```

2. **使用环境变量配置**：在 `.env` 文件中设置
   ```bash
   GITCODE_API_BASE=https://api.gitcode.com/api/v5/chat/completions
   GITCODE_API_KEY=ZjuVRwW1DQxssBQfLwAb7Qmr
   ```

3. **直接使用 requests**：如果 LiteLLM 不支持，可能需要自定义实现
