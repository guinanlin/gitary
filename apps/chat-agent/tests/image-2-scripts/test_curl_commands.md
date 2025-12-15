# Image 2 Scripts Agent - Curl 测试命令

## 快速测试命令

### 1. 创建会话

```bash
curl -X POST "http://127.0.0.1:8234/adk/apps/image_2_scripts/users/test_user_001/sessions" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

**响应示例：**
```json
{
  "id": "session-id-here",
  ...
}
```

### 2. 测试单张图片处理

```bash
curl -X POST "http://127.0.0.1:8234/adk/run" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Accept: application/json" \
  -d '{
    "app_name": "image_2_scripts",
    "user_id": "test_user_001",
    "session_id": "YOUR_SESSION_ID_HERE",
    "new_message": {
      "role": "user",
      "parts": [
        {
          "text": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"
        }
      ]
    }
  }'
```

### 3. 测试多张图片批量处理（3张图片）

```bash
curl -X POST "http://127.0.0.1:8234/adk/run" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Accept: application/json" \
  -d '{
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
          "text": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"
        },
        {
          "text": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"
        }
      ]
    }
  }'
```

### 4. 使用 JSON 文件测试

```bash
# 首先替换 test_request_multiple_images.json 中的 YOUR_SESSION_ID_HERE 为实际 session_id
# 然后执行：
curl -X POST "http://127.0.0.1:8234/adk/run" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Accept: application/json" \
  -d @test_request_multiple_images.json
```

## 预期输出格式

### 单张图片输出示例

```json
{
  "total_images": 1,
  "images": [
    {
      "image_index": 1,
      "image_url": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg",
      "understanding": "这张图片展示了一个数据分析仪表盘的界面。主要包含三个关键指标卡片，分别显示销售额、用户增长和转化率...",
      "narration_script": "今天我们要来看一个数据分析仪表盘。这个仪表盘非常直观地展示了企业的核心业务指标。首先，我们看到三个醒目的指标卡片..."
    }
  ]
}
```

### 多张图片输出示例

```json
{
  "total_images": 3,
  "images": [
    {
      "image_index": 1,
      "image_url": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg",
      "understanding": "第一张图片的理解和分析...",
      "narration_script": "第一张图片的口播文案（300-400字）..."
    },
    {
      "image_index": 2,
      "image_url": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg",
      "understanding": "第二张图片的理解和分析...",
      "narration_script": "第二张图片的口播文案（300-400字）..."
    },
    {
      "image_index": 3,
      "image_url": "https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg",
      "understanding": "第三张图片的理解和分析...",
      "narration_script": "第三张图片的口播文案（300-400字）..."
    }
  ]
}
```

## 验证要点

测试时请验证以下内容：

1. ✅ **JSON格式正确性**：返回的数据是否为有效的JSON格式
2. ✅ **结构完整性**：是否包含 `total_images` 和 `images` 字段
3. ✅ **字段完整性**：每张图片是否包含 `image_index`、`image_url`、`understanding`、`narration_script` 字段
4. ✅ **理解质量**：`understanding` 字段是否包含对图片的详细分析和理解
5. ✅ **文案质量**：`narration_script` 字段是否为300-400字的专业口播文案
6. ✅ **批量处理**：多张图片时，是否为每张图片生成了独立的结果

## 使用完整的测试脚本

推荐使用 `test_multiple_images.sh` 脚本进行完整测试：

```bash
cd apps/chat-agent/image_2_scripts
./test_multiple_images.sh
```

或者：

```bash
bash apps/chat-agent/image_2_scripts/test_multiple_images.sh
```

该脚本会自动：
- 创建会话
- 测试单张图片处理
- 测试多张图片批量处理
- 使用JSON文件测试
- 提供详细的验证要点

