# FastAPI REST API 测试命令

## 基础信息

- **服务器地址**: `http://127.0.0.1:8234`
- **端点**: `/adk/run`
- **方法**: `POST`
- **Content-Type**: `application/json`

## 测试步骤

### 步骤 1: 创建会话（必须先执行）

```bash
curl -X POST 'http://127.0.0.1:8234/adk/apps/image_2_scripts/users/test_user_001/sessions' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'
```

响应示例：
```json
{
  "id": "session-uuid-here",
  "app_name": "image_2_scripts",
  "user_id": "test_user_001"
}
```

**重要**: 从响应中获取 `id` 字段作为 `session_id` 用于后续请求。

### 步骤 2: 发送消息

使用步骤 1 中获取的 `session_id` 替换下面的 `YOUR_SESSION_ID`。

## 测试命令

### 1. 简单文本消息

```bash
# 先创建会话并获取 session_id
SESSION_ID=$(curl -s -X POST 'http://127.0.0.1:8234/adk/apps/image_2_scripts/users/test_user_001/sessions' \
  -H 'Content-Type: application/json' | jq -r '.id')

# 发送消息
curl -X POST 'http://127.0.0.1:8234/adk/run' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d "{
    \"app_name\": \"image_2_scripts\",
    \"user_id\": \"test_user_001\",
    \"session_id\": \"${SESSION_ID}\",
    \"new_message\": {
      \"role\": \"user\",
      \"parts\": [
        {
          \"text\": \"hello\"
        }
      ]
    }
  }"
```

### 或者使用文件方式（推荐，避免转义问题）

创建 `request.json`:
```json
{
  "app_name": "image_2_scripts",
  "user_id": "test_user_001",
  "session_id": "YOUR_SESSION_ID_HERE",
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "hello"
      }
    ]
  }
}
```

然后执行：
```bash
# 创建会话
SESSION_ID=$(curl -s -X POST 'http://127.0.0.1:8234/adk/apps/image_2_scripts/users/test_user_001/sessions' \
  -H 'Content-Type: application/json' | jq -r '.id')

# 更新 request.json 中的 session_id（手动或使用 sed）
sed -i "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/" request.json

# 发送请求
curl -X POST 'http://127.0.0.1:8234/adk/run' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d @request.json
```

### 2. 中文消息（使用文件方式，避免编码问题）

创建 `request_chinese.json`:
```json
{
  "app_name": "image_2_scripts",
  "user_id": "test_user_001",
  "session_id": "YOUR_SESSION_ID_HERE",
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "你好，请介绍一下你自己"
      }
    ]
  }
}
```

```bash
# 创建会话
SESSION_ID=$(curl -s -X POST 'http://127.0.0.1:8234/adk/apps/image_2_scripts/users/test_user_001/sessions' \
  -H 'Content-Type: application/json' | jq -r '.id')

# 更新 session_id
sed -i "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/" request_chinese.json

# 发送请求
curl -X POST 'http://127.0.0.1:8234/adk/run' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -H 'Accept: application/json' \
  -d @request_chinese.json
```

### 3. 带图片 URL 的消息（使用文件方式）

创建 `request_image.json`:
```json
{
  "app_name": "image_2_scripts",
  "user_id": "test_user_001",
  "session_id": "YOUR_SESSION_ID_HERE",
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"
      },
      {
        "text": "用一句话描述这张图片"
      }
    ]
  }
}
```

```bash
# 创建会话
SESSION_ID=$(curl -s -X POST 'http://127.0.0.1:8234/adk/apps/image_2_scripts/users/test_user_001/sessions' \
  -H 'Content-Type: application/json' | jq -r '.id')

# 更新 session_id
sed -i "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/" request_image.json

# 发送请求
curl -X POST 'http://127.0.0.1:8234/adk/run' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -H 'Accept: application/json' \
  -d @request_image.json
```

### 4. 使用 jq 格式化输出（如果已安装）

```bash
curl -X POST 'http://127.0.0.1:8234/adk/run' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "app_name": "image_2_scripts",
    "user_id": "test_user_001",
    "session_id": "test_session_001",
    "new_message": {
      "role": "user",
      "parts": [
        {
          "text": "hello"
        }
      ]
    }
  }' | jq '.'
```

### 5. 健康检查

```bash
curl -X GET 'http://127.0.0.1:8234/health'
```

### 6. 列出可用应用

```bash
curl -X GET 'http://127.0.0.1:8234/adk/apps'
```

## 请求格式说明

### RunAgentRequest

```json
{
  "app_name": "image_2_scripts",    // Agent 名称
  "user_id": "user_123",            // 用户 ID
  "session_id": "session_456",      // 会话 ID（可以是 UUID）
  "new_message": {
    "role": "user",                 // 消息角色：user 或 assistant
    "parts": [
      {
        "text": "消息内容"           // 文本内容，或图片 URL
      }
    ]
  }
}
```

### 响应格式

成功响应（200）：
```json
[
  {
    "modelVersion": "deepseek-ai/deepseek-vl2",
    "content": {
      "parts": [
        {
          "text": "响应内容"
        }
      ],
      "role": "model"
    },
    "partial": false,
    "invocationId": "...",
    "author": "image_2_scripts",
    "id": "...",
    "timestamp": 1234567890.123
  }
]
```

错误响应（4xx/5xx）：
```json
{
  "detail": "错误信息"
}
```

## Windows PowerShell 测试

在 Windows PowerShell 中，使用以下格式：

```powershell
$body = @{
    app_name = "image_2_scripts"
    user_id = "test_user_001"
    session_id = "test_session_001"
    new_message = @{
        role = "user"
        parts = @(
            @{ text = "hello" }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://127.0.0.1:8234/adk/run" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## 注意事项

1. **必须先创建会话**: 使用 `/adk/apps/{app_name}/users/{user_id}/sessions` 端点创建会话
2. **session_id**: 从创建会话的响应中获取 `id` 字段作为 `session_id`
3. **保持上下文**: 每次对话使用相同的 `session_id` 可以保持对话上下文
4. **user_id**: 用于标识不同用户
5. **图片 URL**: 支持 HTTP/HTTPS 图片链接
6. **中文字符**: 建议使用 JSON 文件方式（`-d @file.json`）避免编码问题
7. **Base64 图片**: 目前需要通过其他方式传递（可能需要扩展 API）

## 快速测试脚本

使用提供的 `test_api.sh` 脚本（已包含会话创建逻辑）：

```bash
bash image_2_scripts/test_api.sh
```

脚本会自动：
1. 创建会话
2. 提取 session_id
3. 执行所有测试用例
