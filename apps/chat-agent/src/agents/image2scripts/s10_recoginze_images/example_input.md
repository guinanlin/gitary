# PPT转口播文案 - 输入示例

## 示例1：使用HTTP URL图片

```json
{
  "ppt_pages": [
    {
      "page_index": 1,
      "image_url": "https://example.com/ppt/page1.jpg",
      "notes": "这是产品介绍的首页，主要展示了公司logo和核心价值主张"
    },
    {
      "page_index": 2,
      "image_url": "https://example.com/ppt/page2.jpg",
      "notes": "详细介绍了产品的三大核心功能模块：数据分析、智能推荐、实时监控"
    },
    {
      "page_index": 3,
      "image_url": "https://example.com/ppt/page3.jpg",
      "notes": "展示了产品的技术架构图和系统优势"
    },
    {
      "page_index": 4,
      "image_url": "https://example.com/ppt/page4.jpg",
      "notes": ""
    }
  ]
}
```

## 示例2：使用Base64编码图片

```json
{
  "ppt_pages": [
    {
      "page_index": 1,
      "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
      "notes": "第一页：产品概述"
    },
    {
      "page_index": 2,
      "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "notes": "第二页：功能特点"
    }
  ]
}
```

## 示例3：部分页面有备注，部分无备注

```json
{
  "ppt_pages": [
    {
      "page_index": 1,
      "image_url": "https://example.com/ppt/intro.jpg",
      "notes": "欢迎页面，介绍本次分享的主题"
    },
    {
      "page_index": 2,
      "image_url": "https://example.com/ppt/background.jpg",
      "notes": ""
    },
    {
      "page_index": 3,
      "image_url": "https://example.com/ppt/features.jpg",
      "notes": "核心功能展示：包括用户管理、权限控制、数据统计"
    },
    {
      "page_index": 4,
      "image_url": "https://example.com/ppt/conclusion.jpg",
      "notes": "总结页面，强调产品价值"
    }
  ]
}
```

## 用户对话示例

### 方式1：直接提供JSON字符串

**用户输入：**
```
请帮我处理以下PPT页面，生成口播文案：

{
  "ppt_pages": [
    {
      "page_index": 1,
      "image_url": "https://example.com/ppt/page1.jpg",
      "notes": "这是产品介绍的首页"
    },
    {
      "page_index": 2,
      "image_url": "https://example.com/ppt/page2.jpg",
      "notes": "详细介绍产品功能"
    }
  ]
}
```

### 方式2：自然语言描述后提供JSON

**用户输入：**
```
我有一份10页的PPT，已经转换成图片了。请帮我生成每页的口播文案。

第1页：https://example.com/ppt/page1.jpg，备注：产品概述
第2页：https://example.com/ppt/page2.jpg，备注：核心功能
第3页：https://example.com/ppt/page3.jpg，备注：技术优势
第4页：https://example.com/ppt/page4.jpg，无备注
...

请使用以下JSON格式处理：
{
  "ppt_pages": [
    {
      "page_index": 1,
      "image_url": "https://example.com/ppt/page1.jpg",
      "notes": "产品概述"
    },
    {
      "page_index": 2,
      "image_url": "https://example.com/ppt/page2.jpg",
      "notes": "核心功能"
    },
    {
      "page_index": 3,
      "image_url": "https://example.com/ppt/page3.jpg",
      "notes": "技术优势"
    },
    {
      "page_index": 4,
      "image_url": "https://example.com/ppt/page4.jpg",
      "notes": ""
    }
  ]
}
```

## 预期输出格式

Agent处理后会返回如下格式的JSON：

```json
{
  "total_images": 4,
  "images": [
    {
      "image_index": 1,
      "image_url": "https://example.com/ppt/page1.jpg",
      "narration_script": "大家好，欢迎来到今天的产品介绍。今天我要为大家介绍的是一款革命性的产品，它能够帮助您提升工作效率，优化业务流程。这款产品融合了最新的技术理念，致力于为用户提供最优质的服务体验。通过我们的产品，您可以轻松管理日常工作，实现智能化办公，让工作变得更加高效便捷。无论是个人用户还是企业团队，都能从中获得巨大的价值。接下来，让我们深入了解这款产品的核心功能..."
    },
    {
      "image_index": 2,
      "image_url": "https://example.com/ppt/page2.jpg",
      "narration_script": "接下来，我们来看看产品的核心功能模块。我们的产品主要包含三大核心功能：首先是数据分析功能，它能够实时收集和处理各类业务数据，为您提供精准的数据洞察；其次是智能推荐系统，基于先进的算法模型，为您推荐最合适的内容和方案；最后是实时监控功能，让您随时掌握系统运行状态，及时发现问题并快速响应。这三个功能模块相互配合，形成了一个完整的产品生态..."
    },
    {
      "image_index": 3,
      "image_url": "https://example.com/ppt/page3.jpg",
      "narration_script": "在此基础上，我们的产品还拥有强大的技术优势。我们采用了最新的微服务架构，确保系统的高可用性和可扩展性。同时，我们使用了先进的云计算技术，能够根据业务需求动态调整资源，既保证了性能，又优化了成本。此外，我们的产品还具备完善的安全防护机制，采用多重加密技术，确保用户数据的安全性和隐私性。这些技术优势使得我们的产品在同类产品中脱颖而出..."
    },
    {
      "image_index": 4,
      "image_url": "https://example.com/ppt/page4.jpg",
      "narration_script": "最后，让我们总结一下这款产品的核心价值。通过前面的介绍，我们可以看到，这款产品不仅在功能上全面强大，在技术上也处于行业领先地位。它能够帮助用户提升工作效率，降低运营成本，同时保证数据安全和系统稳定性。无论是初创企业还是大型机构，都能从我们的产品中获得实实在在的价值。我们相信，选择我们的产品，就是选择了更高效、更智能的工作方式。感谢大家的关注，期待与您携手共创美好未来..."
    }
  ]
}
```

## 注意事项

1. **page_index** 必须从1开始，且必须连续（1, 2, 3, ...）
2. **image_url** 可以是HTTP/HTTPS URL或Base64编码的data URL
3. **notes** 可以为空字符串，但不能省略该字段
4. 所有字段都是必需的，不能缺少
5. JSON格式必须正确，可以先用JSON验证工具检查
