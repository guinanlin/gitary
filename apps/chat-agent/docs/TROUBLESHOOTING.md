# 故障排查指南

## 常见问题

### 1. "Cannot find specified session. Creating a new one."

这个信息通常是 ADK 的警告，表示找不到指定的会话，会自动创建一个新的。这本身不是错误，但如果后续对话失败，可能是以下原因：

#### 可能的原因：

1. **Agent 配置错误**
   - 检查 `agent.py` 文件是否存在且配置正确
   - 确认 agent 名称与前端请求的 `app_name` 一致

2. **模型配置问题**
   - 对于自定义 API 端点，确认 `api_base` 和 `api_key` 配置正确
   - 检查环境变量是否已正确设置

3. **API 调用失败**
   - 检查 API 端点是否可访问
   - 验证 API Key 是否有效
   - 查看服务器日志获取详细错误信息

### 2. 无法进行对话

#### 检查步骤：

1. **验证 Agent 是否已加载**
   ```bash
   curl http://localhost:8234/adk/apps
   ```
   应该返回包含 `image_2_scripts` 的列表

2. **测试会话创建**
   ```bash
   curl -X POST "http://localhost:8234/adk/apps/image_2_scripts/users/test-user/sessions" \
     -H "Content-Type: application/json"
   ```
   应该返回一个包含 `id` 字段的 JSON 响应

3. **测试对话请求**
   ```bash
   curl -X POST "http://localhost:8234/adk/run" \
     -H "Content-Type: application/json" \
     -d '{
       "app_name": "image_2_scripts",
       "user_id": "test-user",
       "session_id": "YOUR_SESSION_ID",
       "new_message": {
         "role": "user",
         "parts": [{"text": "Hello"}]
       }
     }'
   ```

4. **检查服务器日志**
   查看控制台输出，查找错误信息

### 3. LiteLLM 自定义端点问题

#### 配置检查：

1. **确认模型名称格式**
   ```python
   model="custom/deepseek-ai/deepseek-vl2"  # 必须使用 custom/ 前缀
   ```

2. **确认 API 端点格式**
   ```python
   api_base="https://api.gitcode.com/api/v5"  # 不包含 /chat/completions
   ```

3. **确认 API Key**
   ```python
   api_key=os.getenv("GITCODE_API_KEY")  # 从环境变量读取
   ```

4. **测试 API 端点**
   ```bash
   curl https://api.gitcode.com/api/v5/chat/completions \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "deepseek-ai/deepseek-vl2",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

### 4. 环境变量问题

#### 检查环境变量：

1. **确认 .env 文件存在**
   ```bash
   ls apps/chat-agent/.env
   ```

2. **检查环境变量是否加载**
   在 Python 中测试：
   ```python
   import os
   from dotenv import load_dotenv
   load_dotenv()
   print(os.getenv("GITCODE_API_KEY"))
   ```

3. **确认环境变量格式**
   ```bash
   # .env 文件格式
   GITCODE_API_KEY=vz_UxP1tDEzXV5H3-9cfByDB
   # 注意：不要有引号，不要有空格
   ```

### 5. 依赖问题

#### 检查依赖安装：

1. **确认 litellm 已安装**
   ```bash
   uv run pip list | grep litellm
   # 或
   pip list | grep litellm
   ```

2. **重新安装依赖**
   ```bash
   cd apps/chat-agent
   uv sync
   ```

### 6. 调试技巧

#### 启用详细日志：

在 `agent.py` 中添加日志：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### 测试 Agent 配置：

运行测试脚本：
```bash
cd apps/chat-agent
uv run python image_2_scripts/test_agent.py
```

#### 检查 ADK 日志：

查看 `.adk/` 目录下的日志文件，通常在 `image_2_scripts/.adk/` 目录下。

### 7. 常见错误码

- **401 Unauthorized**: API Key 无效或缺失
- **404 Not Found**: API 端点不正确或模型不存在
- **429 Too Many Requests**: API 调用频率超限
- **500 Internal Server Error**: 服务器内部错误，检查日志

### 8. 获取帮助

如果问题仍然存在：

1. 检查服务器控制台的完整错误信息
2. 查看 ADK 日志文件
3. 测试 API 端点是否正常工作
4. 验证 Agent 配置是否正确
