# GitCode API 测试指南

## 问题诊断

你遇到的错误：
```json
{"error_code":1000,"error_code_name":"PARAMETER_ERROR","error_message":"参数错误"}
```

这通常表示请求参数格式不正确。

## 测试步骤

### 1. 测试不同的模型名称格式

运行以下命令测试不同的模型名称：

```bash
# 测试 1: deepseek-vl2 (简化格式)
curl https://api.gitcode.com/api/v5/chat/completions \
  -H "Authorization: Bearer ZjuVRwW1DQxssBQfLwAb7Qmr" \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-vl2", "messages": [{"role": "user", "content": "test"}], "max_tokens": 50}'

# 测试 2: deepseek-ai/deepseek-vl2 (完整格式)
curl https://api.gitcode.com/api/v5/chat/completions \
  -H "Authorization: Bearer ZjuVRwW1DQxssBQfLwAb7Qmr" \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-ai/deepseek-vl2", "messages": [{"role": "user", "content": "test"}], "max_tokens": 50}'

# 测试 3: deepseek/deepseek-vl2 (另一种格式)
curl https://api.gitcode.com/api/v5/chat/completions \
  -H "Authorization: Bearer ZjuVRwW1DQxssBQfLwAb7Qmr" \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek/deepseek-vl2", "messages": [{"role": "user", "content": "test"}], "max_tokens": 50}'
```

### 2. 检查必需的参数

GitCode API 可能需要额外的参数。尝试添加：

```bash
curl https://api.gitcode.com/api/v5/chat/completions \
  -H "Authorization: Bearer ZjuVRwW1DQxssBQfLwAb7Qmr" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-vl2",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 1024,
    "temperature": 0.7,
    "top_p": 0.7,
    "top_k": 50,
    "frequency_penalty": 0,
    "stream": false
  }'
```

### 3. 检查 API 文档

查看 GitCode API 的官方文档，确认：
- 正确的模型名称格式
- 必需的参数
- 请求格式要求

## 当前配置

我已经将模型名称从 `custom/deepseek-ai/deepseek-vl2` 改为 `custom/deepseek-vl2`。

如果测试发现正确的格式，请告诉我，我会更新配置。

## 更新配置

找到正确的模型名称后，更新 `image_2_scripts/agent.py`：

```python
model=LiteLlm(
    model="custom/正确的模型名称",  # 替换为测试成功的格式
    api_base="https://api.gitcode.com/api/v5",
    api_key=gitcode_api_key,
)
```
