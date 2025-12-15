# Image 2 Scripts Agent

图片转脚本智能体，使用 GitCode API 的 deepseek-vl2 模型。

## 模型配置

本 Agent 使用自定义 API 端点（GitCode API）来访问 deepseek-vl2 模型。

### API 信息

- **API 端点**: `https://api.gitcode.com/api/v5/chat/completions`
- **模型**: `deepseek-ai/deepseek-vl2`
- **认证方式**: Bearer Token
- **API Key**: 通过环境变量 `GITCODE_API_KEY` 配置

### 配置步骤

1. **设置环境变量**

   在 `.env` 文件中添加：
   ```bash
   GITCODE_API_KEY=vz_UxP1tDEzXV5H3-9cfByDB
   ```

2. **Agent 配置**

   Agent 配置在 `agent.py` 文件中，使用 LiteLLM 的自定义端点功能：
   ```python
   model=LiteLlm(
       model="custom/deepseek-ai/deepseek-vl2",
       api_base="https://api.gitcode.com/api/v5",
       api_key=os.getenv("GITCODE_API_KEY"),
   )
   ```

### 功能特性

- ✅ 支持图片输入（base64 编码）
- ✅ 支持文本输入
- ✅ 图片转脚本/代码
- ✅ 图片内容分析
- ✅ 多格式图片支持（截图、设计稿、流程图等）

### 使用示例

Agent 会自动处理包含图片的消息。图片需要以 base64 格式提供，格式如下：

```json
{
  "role": "user",
  "content": [
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,iVBORw0KGgo..."
      }
    },
    {
      "type": "text",
      "text": "用一句话描述这张图片"
    }
  ]
}
```

### 注意事项

1. **API Key 安全**: 请妥善保管 API Key，不要提交到版本控制系统
2. **图片大小**: 注意图片大小限制，建议压缩大图片
3. **API 配额**: 注意 API 调用频率和配额限制
4. **模型支持**: deepseek-vl2 是视觉语言模型，支持图片理解

### 故障排查

如果遇到问题，检查：

1. ✅ `GITCODE_API_KEY` 环境变量是否正确设置
2. ✅ API 端点是否可访问
3. ✅ 图片格式是否正确（base64 编码）
4. ✅ LiteLLM 依赖是否已安装（`pip install litellm`）
