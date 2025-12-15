# Chat Agent - FastAPI + Google ADK

基于 FastAPI 和 Google Agent Development Kit (ADK) 的聊天代理服务。

## 项目结构

```
apps/chat-agent/
├── hello_agent/          # ADK Agent 定义
│   ├── __init__.py      # 包初始化
│   ├── agent.py         # Agent 定义
│   └── .env             # 环境变量配置（需要创建）
├── main.py              # FastAPI 服务器
├── pyproject.toml       # 项目配置和依赖（uv 使用）
├── requirements.txt     # Python 依赖（备用）
├── uv.lock             # 依赖锁定文件（uv 自动生成）
└── README.md           # 本文件
```

## 快速开始

### 前置要求

**安装 uv（如果还没有安装）：**

**Linux/macOS:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**或使用 pip:**
```bash
pip install uv
```

### 方式 1：使用启动脚本（推荐）

**Linux/macOS:**
```bash
cd apps/chat-agent
./run.sh
```

**Windows:**
```bash
cd apps/chat-agent
run.bat
```

### 方式 2：使用 Make（推荐）

```bash
cd apps/chat-agent
make setup    # 首次设置
make run      # 启动服务器
```

### 方式 3：手动启动

#### 1. 安装依赖

```bash
cd apps/chat-agent
uv sync
```

#### 2. 配置环境变量

复制 `.env.example` 并配置你的 Google API Key：

```bash
cp hello_agent/.env.example hello_agent/.env
```

编辑 `hello_agent/.env`：

```env
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=your-api-key-here
```

**获取 API Key：**
- 访问 [Google AI Studio](https://aistudio.google.com/)
- 创建新的 API Key
- 将 Key 填入 `.env` 文件

#### 3. 启动服务器

```bash
uv run python main.py
```

服务器将在 `http://localhost:8234` 启动。

### 4. 运行测试

```bash
# 确保服务器正在运行，然后在另一个终端运行：
uv run python test_agent.py
# 或使用 make:
make test
```

### 4. 测试 API

#### 使用 ADK 的 REST API

ADK 提供了标准的 REST API 端点。查看完整文档：

```bash
# 访问 Swagger UI
open http://localhost:8234/adk/docs

# 或访问健康检查
curl http://localhost:8234/health
```

#### 1. 创建会话（必需）

```bash
curl -X POST "http://localhost:8234/adk/apps/hello_agent/users/test-user/sessions" \
  -H "Content-Type: application/json"
```

响应示例：
```json
{
  "id": "da371217-3dd6-45e2-8ed8-da99bd96f6a3",
  "appName": "hello_agent",
  "userId": "test-user",
  "state": {},
  "events": [],
  "lastUpdateTime": 1765566491.0908022
}
```

**注意**：`session_id` 在响应的 `id` 字段中。

#### 2. 运行 Agent（SSE 流式）

使用上面创建的 `session_id`：

```bash
curl -X POST "http://localhost:8234/adk/run_sse" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "hello_agent",
    "user_id": "test-user",
    "session_id": "da371217-3dd6-45e2-8ed8-da99bd96f6a3",
    "new_message": {
      "role": "user",
      "parts": [
        {
          "text": "Hello!"
        }
      ]
    }
  }'
```

#### 3. 运行 Agent（同步）

```bash
curl -X POST "http://localhost:8234/adk/run" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "hello_agent",
    "user_id": "test-user",
    "session_id": "da371217-3dd6-45e2-8ed8-da99bd96f6a3",
    "new_message": {
      "role": "user",
      "parts": [
        {
          "text": "Hello!"
        }
      ]
    }
  }'
```

## API 端点

### 自定义端点

- `GET /` - API 信息
- `GET /health` - 健康检查
- `GET /docs` - FastAPI Swagger 文档

### ADK 端点（挂载在 `/adk`）

- `POST /adk/run` - 同步运行 Agent
- `POST /adk/run_sse` - 流式运行 Agent (SSE)
- `GET /adk/docs` - ADK API 文档
- `POST /adk/apps/{app_name}/users/{user_id}/sessions` - 创建会话
- `GET /adk/apps/{app_name}/users/{user_id}/sessions` - 列出会话

## 开发

### 使用 ADK Dev UI（开发模式）

ADK 提供了一个交互式的 Web UI，可以方便地测试和调试 Agent。这个 UI 运行在**独立的端口（8334）**，可以与 FastAPI 服务器（端口 8234）同时运行。

#### 方式 1：使用启动脚本（推荐）

**Linux/macOS/Git Bash:**
```bash
cd apps/chat-agent
./dev.sh
```

**Windows:**
```bash
cd apps/chat-agent
dev.bat
```

**使用自定义端口（如果 8334 被占用）：**
```bash
# Linux/macOS/Git Bash
ADK_PORT=8335 ./dev.sh

# Windows (CMD)
set ADK_PORT=8335 && dev.bat

# Windows (PowerShell)
$env:ADK_PORT=8335; .\dev.bat
```

#### 方式 2：使用 Make（推荐，如果已安装）

**安装 make（如果还没有）：**
- 查看 `INSTALL_MAKE.md` 了解安装方法
- 或使用 Chocolatey: `choco install make`
- 或下载预编译版本：https://sourceforge.net/projects/ezwinports/files/

**使用 make：**
```bash
cd apps/chat-agent
make dev
# 或
make web
```

**查看所有可用命令：**
```bash
make help
```

#### 方式 3：手动启动

```bash
cd apps/chat-agent
uv run adk web --port 8334
```

**使用自定义端口：**
```bash
uv run adk web --port 8335
```

#### 使用 Dev UI

1. **启动后**，打开浏览器访问：`http://localhost:8334`
2. **选择 Agent**：在页面左上角的下拉菜单中选择 `hello_agent`
3. **开始聊天**：在聊天框中输入消息，Agent 会实时响应
4. **查看事件**：点击左侧的 "Events" 标签，可以查看详细的请求和响应数据

**提示**：
- Dev UI 非常适合开发和调试 Agent
- 可以实时看到 LLM 的输入和输出
- 支持流式响应，体验与真实应用一致
- 可以同时运行 FastAPI 服务器（端口 8234）和 Dev UI（端口 8334），互不干扰

**示例对话**：
- "Hello!"
- "What can you help me with?"
- "Tell me a joke"

### 修改 Agent

编辑 `hello_agent/agent.py` 来修改 Agent 的行为：

```python
root_agent = Agent(
    name="hello_assistant",
    model="gemini-2.0-flash",
    description="A friendly AI assistant for general conversation",
    instruction=(
        "You are a warm and helpful assistant. "
        "Greet users enthusiastically and answer their questions clearly. "
        "Be conversational and friendly!"
    )
)
```

修改后重启服务器即可生效。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | FastAPI 服务器端口 | `8234` |
| `ADK_PORT` | ADK Dev UI 端口 | `8334` |
| `GOOGLE_GENAI_USE_VERTEXAI` | 是否使用 Vertex AI | `FALSE` |
| `GOOGLE_API_KEY` | Google AI Studio API Key | 必需 |

## 故障排除

### 问题：Agent 未找到

**解决方案：**
- 确保 `hello_agent/__init__.py` 包含 `from . import agent`
- 确保 `hello_agent/agent.py` 中变量名为 `root_agent`
- 检查 `agents_dir` 路径是否正确

### 问题：认证错误

**解决方案：**
- 检查 `.env` 文件中的 `GOOGLE_API_KEY` 是否正确
- 确保 `GOOGLE_GENAI_USE_VERTEXAI=FALSE`（使用 Google AI Studio）

### 问题：端口被占用

**ADK Dev UI 端口 8334 被占用：**

**解决方案 1：查找并关闭占用端口的程序（Windows）**
```bash
# 查找占用端口 8334 的进程
netstat -ano | findstr :8334

# 查看进程详情（替换 PID 为上面找到的进程 ID）
tasklist | findstr <PID>

# 结束进程（谨慎操作）
taskkill /PID <PID> /F
```

**解决方案 2：使用其他端口**
```bash
# 方式 1：使用环境变量（推荐）
# Linux/macOS
ADK_PORT=8335 make dev

# Windows (PowerShell)
$env:ADK_PORT=8335; make dev

# Windows (CMD)
set ADK_PORT=8335 && make dev

# 方式 2：直接指定端口
uv run adk web --port 8335
```

然后访问 `http://localhost:8335`（或你指定的端口）

**FastAPI 服务器端口 8234 被占用：**

**解决方案：**
- 修改 `PORT` 环境变量：`export PORT=8235`（Linux/macOS）或 `set PORT=8235`（Windows）
- 或修改 `main.py` 中的默认端口

## 下一步

- 添加自定义工具（Function Tools）
- 实现工作流（Sequential/Parallel/Loop）
- 集成到前端应用

## 测试

运行测试脚本验证 Agent 是否正常工作：

```bash
# 确保服务器正在运行（在一个终端）
uv run python main.py
# 或: make run

# 在另一个终端运行测试
uv run python test_agent.py
# 或: make test
```

测试脚本会验证：
- ✅ 健康检查端点
- ✅ 同步 Agent 调用
- ✅ 流式 Agent 调用

## 使用示例

### Python 客户端示例

```python
import requests

BASE_URL = "http://localhost:8234"
app_name = "hello_agent"
user_id = "user-123"

# 1. 先创建会话
session_response = requests.post(
    f"{BASE_URL}/adk/apps/{app_name}/users/{user_id}/sessions"
)
session_data = session_response.json()
# ADK 返回的 session_id 在 "id" 字段中
session_id = session_data["id"]
print(f"Created session: {session_id}")

# 2. 同步调用
response = requests.post(
    f"{BASE_URL}/adk/run",
    json={
        "app_name": app_name,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
            "role": "user",
            "parts": [
                {
                    "text": "Hello!"
                }
            ]
        }
    }
)
print(response.json())

# 3. 流式调用（使用同一个 session_id）
response = requests.post(
    f"{BASE_URL}/adk/run_sse",
    json={
        "app_name": app_name,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
            "role": "user",
            "parts": [
                {
                    "text": "Tell me a joke!"
                }
            ]
        }
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        line_str = line.decode('utf-8')
        if line_str.startswith('event: '):
            print(f"Event: {line_str[7:]}")
        elif line_str.startswith('data: '):
            print(f"Data: {line_str[6:]}")
```

### JavaScript/TypeScript 客户端示例

```typescript
const BASE_URL = 'http://localhost:8234';
const appName = 'hello_agent';
const userId = 'user-123';

// 1. 先创建会话
const sessionResponse = await fetch(
  `${BASE_URL}/adk/apps/${appName}/users/${userId}/sessions`,
  { method: 'POST' }
);
const sessionData = await sessionResponse.json();
// ADK 返回的 session_id 在 "id" 字段中
const sessionId = sessionData.id;
console.log('Created session:', sessionId);

// 2. 同步调用
const response = await fetch(`${BASE_URL}/adk/run`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    app_name: appName,
    user_id: userId,
    session_id: sessionId,
    new_message: {
      role: 'user',
      parts: [
        {
          text: 'Hello!'
        }
      ]
    }
  })
});

const result = await response.json();
console.log(result);

// 3. 流式调用（使用同一个 sessionId）
const streamResponse = await fetch(`${BASE_URL}/adk/run_sse`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    app_name: appName,
    user_id: userId,
    session_id: sessionId,
    new_message: {
      role: 'user',
      parts: [
        {
          text: 'Tell me a joke!'
        }
      ]
    }
  })
});

const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      const eventType = line.replace('event: ', '');
      console.log('Event type:', eventType);
    } else if (line.startsWith('data: ')) {
      const data = JSON.parse(line.replace('data: ', ''));
      console.log('Event data:', data);
    }
  }
}
```

## 参考文档

- [Google ADK 官方文档](https://google.github.io/adk-docs/)
- [ADK Training Hub - Hello World](https://raphaelmansuy.github.io/adk_training/docs/hello_world_agent)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
