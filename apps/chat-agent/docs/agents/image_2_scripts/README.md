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

- ✅ 三步处理流程：理解图片 → 生成口播文案 → JSON格式返回
- ✅ 支持单张图片处理
- ✅ 支持批量图片处理（一次处理多张图片，通常用于PPT转换的图片）
- ✅ 图片深度理解（分析视觉内容、文字内容、图表数据、核心主题等）
- ✅ 图片转口播文案（每张图片生成300-400字的专业口播文案）
- ✅ JSON格式输出（结构化数据，便于程序处理）
- ✅ 支持图片URL输入（HTTP/HTTPS）
- ✅ 支持base64编码图片输入
- ✅ 支持文本输入
- ✅ 多格式图片支持（截图、设计稿、流程图、PPT页面等）

### 使用示例

#### 1. 单张图片处理

```json
{
  "app_name": "image_2_scripts",
  "user_id": "user_001",
  "session_id": "session_001",
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "https://example.com/image1.jpg"
      }
    ]
  }
}
```

#### 2. 批量图片处理（多张图片，如PPT转换的图片）

```json
{
  "app_name": "image_2_scripts",
  "user_id": "user_001",
  "session_id": "session_001",
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "https://example.com/ppt_page_1.jpg"
      },
      {
        "text": "https://example.com/ppt_page_2.jpg"
      },
      {
        "text": "https://example.com/ppt_page_3.jpg"
      }
    ]
  }
}
```

Agent 会自动识别多张图片，并为每张图片生成独立的300-400字口播文案。

#### 3. 使用base64编码的图片

```json
{
  "app_name": "image_2_scripts",
  "user_id": "user_001",
  "session_id": "session_001",
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "data:image/jpeg;base64,iVBORw0KGgo..."
      }
    ]
  }
}
```

#### 处理流程

智能体处理图片时严格按照三个步骤执行：

1. **第一步：理解图片**
   - 分析图片的视觉内容（布局、颜色、元素位置等）
   - 识别图片中的文字内容（标题、正文、标签、说明等）
   - 理解图片中的图表、数据、图形元素
   - 提取图片的核心主题、关键信息和要点
   - 总结图片的整体含义和传达的信息

2. **第二步：生成口播文案**
   - 基于第一步的深入理解，生成专业的口播文案
   - 字数控制在300-400字左右
   - 内容准确反映图片核心信息
   - 语言自然流畅，适合口语表达
   - 逻辑清晰，结构完整

3. **第三步：JSON格式返回**
   - 将所有结果以JSON格式返回
   - 确保JSON格式完全正确且可解析

#### 输出格式示例

**单张图片输出：**

```json
{
  "total_images": 1,
  "images": [
    {
      "image_index": 1,
      "image_url": "https://example.com/image1.jpg",
      "understanding": "这张图片展示了一个数据分析仪表盘的界面。主要包含三个关键指标卡片，分别显示销售额、用户增长和转化率。左侧有一个折线图展示最近30天的趋势数据，右侧是一个饼图显示不同产品类别的销售占比。整体设计采用了蓝色和白色的配色方案，界面清晰简洁。核心信息是展示了企业的关键业务指标和数据分析结果。",
      "narration_script": "今天我们要来看一个数据分析仪表盘。这个仪表盘非常直观地展示了企业的核心业务指标。首先，我们看到三个醒目的指标卡片，分别显示销售额、用户增长和转化率，这些数据能够快速帮助我们了解业务的整体状况。左侧的折线图展示了最近30天的趋势变化，我们可以清楚地看到数据的波动情况。右侧的饼图则详细展示了不同产品类别的销售占比，让我们能够了解哪些产品表现更好。整个界面采用了蓝色和白色的配色方案，既专业又简洁，非常适合管理层快速掌握业务动态。通过这个仪表盘，我们能够一目了然地看到企业的运营状况，为决策提供数据支持。"
    }
  ]
}
```

**多张图片输出（PPT转换场景）：**

```json
{
  "total_images": 3,
  "images": [
    {
      "image_index": 1,
      "image_url": "https://example.com/ppt_page_1.jpg",
      "understanding": "这是PPT的第一页，标题页。页面顶部有公司Logo，中央是大标题文字，底部有日期和作者信息。整体采用深蓝色背景，白色文字，风格专业简洁。",
      "narration_script": "欢迎来到今天的分享。这是我们关于数字化转型的专题报告。本次报告将深入探讨企业如何通过数字化转型提升竞争力，我们会从多个维度来分析这个话题，包括技术趋势、实施策略以及实际案例。希望通过今天的分享，能够为大家提供有价值的见解和启发。"
    },
    {
      "image_index": 2,
      "image_url": "https://example.com/ppt_page_2.jpg",
      "understanding": "这是PPT的第二页，内容页。左侧是标题'数字化转型的必要性'，右侧列出了三个要点，分别是市场变化、技术进步和竞争压力。页面布局左右分栏，使用了图标和列表来增强视觉效果。",
      "narration_script": "首先，我们来探讨一下数字化转型的必要性。在当今快速变化的市场环境中，企业面临着前所未有的挑战。市场变化日新月异，消费者的需求和行为模式在不断演变，这就要求企业必须保持高度的灵活性和适应性。同时，技术的快速发展为我们提供了新的工具和可能性，云计算、人工智能、大数据等技术的成熟应用，为企业转型提供了强有力的支撑。此外，激烈的市场竞争也促使企业必须不断创新和变革，只有积极拥抱数字化，才能在竞争中保持优势。这三个因素共同构成了企业数字化转型的迫切性和必要性。"
    },
    {
      "image_index": 3,
      "image_url": "https://example.com/ppt_page_3.jpg",
      "understanding": "这是PPT的第三页，展示了数字化转型的实施路径。页面中央有一个流程图，展示了从规划、实施到优化的三个阶段，每个阶段都有相应的说明文字。",
      "narration_script": "接下来，我们来看看数字化转型的实施路径。这个过程可以分为三个阶段：规划、实施和优化。在规划阶段，企业需要明确转型的目标和愿景，分析当前的业务状况和痛点，制定详细的转型战略和路线图。这个阶段的关键是要有清晰的愿景和可行的计划。在实施阶段，企业需要选择合适的技术方案和合作伙伴，逐步推进各项转型工作，这个过程中要注重风险控制和持续沟通。最后是优化阶段，通过数据分析和效果评估，不断优化和完善转型成果，确保转型能够持续产生价值。这三个阶段形成一个闭环，需要企业持续投入和不断改进。"
    }
  ]
}
```

**JSON字段说明：**

- `total_images`: 图片总数（整数）
- `images`: 图片结果数组
  - `image_index`: 图片序号，从1开始
  - `image_url`: 图片URL（如果用户提供了URL）
  - `understanding`: 第一步的理解结果，详细描述对图片的分析和理解
  - `narration_script`: 第二步生成的口播文案，300-400字

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
