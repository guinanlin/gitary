# DeepSeek 模型集成说明

## 概述

本文档说明如何在 ADK-TS 框架中集成 DeepSeek 模型（通过 GitCode API）。

## 集成架构

```
┌─────────────────┐
│   ADK Agent     │
│  (使用模型)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitCodeModelAdapter │
│  (继承 BaseLlm)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitCode API    │
│  (api.gitcode.com)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DeepSeek VL2   │
│  (deepseek-vl2) │
└─────────────────┘
```

## 当前实现状态

### ✅ 已实现功能

1. **模型适配器** (`GitCodeModelAdapter`)
   - 继承自 `BaseLlm`，完全兼容 ADK 框架
   - 支持同步和异步调用
   - 支持流式和非流式响应

2. **DeepSeek 模型支持**
   - 模型名称：`deepseek-ai/deepseek-vl2`
   - 视觉语言模型，支持图片理解
   - 支持多模态输入（文本 + 图片）

3. **图片输入支持**
   - ✅ Base64 编码图片（`data:image/xxx;base64,...`）
   - ✅ HTTP/HTTPS URL 图片（`https://...`）
   - ✅ 支持多种图片格式（JPEG, PNG, WebP 等）

4. **API 配置**
   - API 端点：`https://api.gitcode.com/api/v5/chat/completions`
   - 认证方式：Bearer Token
   - 环境变量配置：`GITCODE_API_KEY`

## 配置步骤

### 1. 环境变量配置

在 `.env` 文件中设置 API Key：

```bash
GITCODE_API_KEY=vz_UxP1tDEzXV5H3-9cfByDB
```

### 2. Agent 配置

在 `agent.py` 中配置 Agent：

```python
from .gitcode_model_adapter import GitCodeModelAdapter

root_agent = Agent(
    name="image_2_scripts",
    model=GitCodeModelAdapter(
        model="deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=os.getenv("GITCODE_API_KEY"),
    ),
    description="图片转脚本智能体，支持图片和文本输入",
    instruction="...",
)
```

## API 调用格式

### GitCode API 请求格式

根据 curl 示例，GitCode API 使用 OpenAI 兼容格式：

```json
{
  "model": "deepseek-ai/deepseek-vl2",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"
          }
        },
        {
          "type": "text",
          "text": "用一句话描述这张图片"
        }
      ]
    }
  ],
  "stream": false,
  "max_tokens": 1024,
  "temperature": 0.7,
  "top_p": 0.7,
  "top_k": 50,
  "frequency_penalty": 0
}
```

### 支持的图片格式

1. **HTTP/HTTPS URL**
   ```json
   {
     "type": "image_url",
     "image_url": {
       "url": "https://example.com/image.jpg"
     }
   }
   ```

2. **Base64 Data URL**
   ```json
   {
     "type": "image_url",
     "image_url": {
       "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
     }
   }
   ```

## 代码实现细节

### 1. 模型适配器类

`GitCodeModelAdapter` 继承自 `BaseLlm`，实现以下方法：

- `generate_content()`: 同步生成内容
- `generate_content_async()`: 异步生成内容（支持流式）

### 2. 消息格式转换

`_convert_content_to_messages()` 方法将 ADK 的 `Content` 格式转换为 GitCode API 的 `messages` 格式：

```python
def _convert_content_to_messages(self, contents: List[Content]) -> List[dict]:
    """将 ADK 的 Content 格式转换为 GitCode API 的 messages 格式
    
    支持两种图片格式：
    1. base64 编码（inline_data）
    2. HTTP/HTTPS URL（file_data 或通过 text 字段传递的 URL）
    """
    # ... 实现细节
```

### 3. 流式响应处理

支持 Server-Sent Events (SSE) 格式的流式响应：

```python
async def generate_content_async(self, llm_request, stream=True):
    # 解析 SSE 格式的流式响应
    # data: {"choices": [{"delta": {"content": "..."}}]}
    # data: [DONE]
```

## 使用示例

### 示例 1: 使用 HTTP URL 图片

```python
from google.genai import types
from google.genai.types import Content, Part

content = Content(
    role="user",
    parts=[
        Part(text="https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"),
        Part(text="用一句话描述这张图片")
    ]
)

response = adapter.generate_content([content])
print(response.candidates[0].content.parts[0].text)
```

### 示例 2: 使用 Base64 图片

```python
from google.genai.types import InlineData

inline_data = InlineData(
    mime_type="image/jpeg",
    data="base64_encoded_image_data"
)

content = Content(
    role="user",
    parts=[
        Part(inline_data=inline_data),
        Part(text="分析这张图片")
    ]
)

response = adapter.generate_content([content])
```

## 与 ADK-TS 文档的对应关系

根据 ADK-TS 文档，有两种集成方式：

### Option 1: Direct Model Names（当前使用）

我们使用的是自定义适配器方式，类似于 Option 1，但更灵活：

```python
# 直接使用模型适配器
model = GitCodeModelAdapter(
    model="deepseek-ai/deepseek-vl2",
    api_base="https://api.gitcode.com/api/v5",
    api_key=os.getenv("GITCODE_API_KEY"),
)
```

### Option 2: Vercel AI SDK（可选）

如果需要使用 Vercel AI SDK 方式，可以创建自定义 provider：

```python
# 理论上可以创建 @ai-sdk/gitcode provider
# 但目前使用自定义适配器更直接
```

## 参数配置

### 支持的参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `model` | string | `deepseek-ai/deepseek-vl2` | 模型名称 |
| `api_base` | string | `https://api.gitcode.com/api/v5` | API 基础 URL |
| `api_key` | string | 环境变量 | API Key |
| `max_tokens` | int | 1024 | 最大输出 token 数 |
| `temperature` | float | 0.7 | 温度参数 |
| `top_p` | float | 0.7 | Top-p 采样 |
| `top_k` | int | 50 | Top-k 采样 |
| `frequency_penalty` | float | 0 | 频率惩罚 |

### 配置示例

```python
adapter = GitCodeModelAdapter(
    model="deepseek-ai/deepseek-vl2",
    api_base="https://api.gitcode.com/api/v5",
    api_key="your_api_key",
)

# 在 generate_content 中通过 config 参数传递
config = types.GenerateContentConfig(
    max_output_tokens=2048,
    temperature=0.5,
)
```

## 故障排查

### 常见问题

1. **API Key 错误**
   - 检查 `.env` 文件中的 `GITCODE_API_KEY`
   - 确认 API Key 有效且有权限

2. **图片格式不支持**
   - 确保图片 URL 可访问（HTTP/HTTPS）
   - Base64 编码格式正确
   - 图片大小在限制范围内

3. **网络连接问题**
   - 检查 API 端点是否可访问
   - 确认防火墙/代理设置

4. **响应解析错误**
   - 检查流式响应格式是否正确
   - 查看日志中的错误信息

### 调试技巧

1. **启用日志**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

2. **检查请求格式**
   ```python
   # 在 _convert_content_to_messages 中添加日志
   logger.debug(f"Converted messages: {json.dumps(messages, ensure_ascii=False)}")
   ```

3. **测试 API 连接**
   ```bash
   curl https://api.gitcode.com/api/v5/chat/completions \
     -H "Authorization: Bearer $GITCODE_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"model": "deepseek-ai/deepseek-vl2", "messages": [...]}'
   ```

## 最佳实践

1. **API Key 安全**
   - 使用环境变量存储 API Key
   - 不要将 API Key 提交到版本控制
   - 使用 `.env.example` 作为模板

2. **错误处理**
   - 实现重试机制
   - 处理网络超时
   - 记录错误日志

3. **性能优化**
   - 使用异步调用提高并发性能
   - 合理设置超时时间
   - 考虑实现请求缓存

4. **代码维护**
   - 保持适配器代码简洁
   - 添加类型注解
   - 编写单元测试

## 总结

DeepSeek 模型已成功集成到 ADK-TS 框架中：

- ✅ 通过 `GitCodeModelAdapter` 实现模型适配
- ✅ 支持多模态输入（文本 + 图片）
- ✅ 支持流式和非流式响应
- ✅ 完全兼容 ADK 框架接口
- ✅ 支持 HTTP URL 和 Base64 两种图片格式

当前实现已经可以正常使用，后续可以根据需要进一步优化和扩展功能。
