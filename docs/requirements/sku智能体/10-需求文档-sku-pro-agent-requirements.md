# SKU Pro 智能体需求文档

## 1. 项目概述

### 1.1 项目名称
SKU Pro 智能体（SKU专家智能体）

### 1.2 项目目标
开发一个专门处理SKU（库存量单位）信息的智能体，能够自动解析SKU数据，整理成结构化格式，并通过API进行查询和返回结果。

### 1.3 核心价值
- 自动化SKU信息处理，减少人工整理工作量
- 提供标准化的SKU数据格式
- 集成API查询能力，实现数据快速检索

## 2. 功能需求

### 2.1 核心功能流程

智能体需要完成以下两个核心动作：

#### 动作1：SKU信息结构化处理
- **输入**：用户提供的SKU信息（表格格式或文本格式）
- **处理**：解析SKU信息，提取关键字段
- **输出**：标准化的JSON格式数据

#### 动作2：API查询调用
- **输入**：动作1生成的JSON格式数据
- **处理**：调用指定的API接口进行查询
- **输出**：API返回的查询结果

### 2.2 详细功能说明

#### 2.2.1 SKU信息解析
智能体需要能够识别和解析以下格式的SKU信息：

**示例输入格式（表格）**：
```
品类	                单耗/m	颜色
IW-10200 涤粘弹面料	1.37	黑棕格
弹力色丁里布	        0.3	配色
75D衬	                0.05	黑色
树脂衬	                0.01	黑色
车缝线		        配色
小裤钩	                2	银色
14cm - 3#尼龙闭尾拉链		黑色
15cm - 3#尼龙闭尾拉链	1	黑色
16cm - 3#尼龙闭尾拉链		黑色
17cm - 3#尼龙闭尾拉链		黑色
IW-S10533小商标	        1	米色通用
S01538尺码标	        1	米色通用
S01537产地标	        1	米色通用
洗标	                1	白底黑字通用
```

#### 2.2.2 JSON格式规范
解析后的数据需要转换为以下JSON格式：

```json
{
  "items": [
    {
      "sku_code": "SKU代码",
      "color": "颜色"
    }
  ]
}
```

**字段说明**：
- `sku_code`：SKU代码（必填），直接使用品类字段的完整内容，如 "IW-10200 涤粘弹面料"
- `color`：颜色（必填）

**示例输出**：
```json
{
  "items": [
    {
      "sku_code": "IW-10200 涤粘弹面料",
      "color": "黑棕格"
    },
    {
      "sku_code": "弹力色丁里布",
      "color": "配色"
    },
    {
      "sku_code": "75D衬",
      "color": "黑色"
    }
  ]
}
```

#### 2.2.3 SKU代码规则
- `sku_code` 字段直接使用品类字段的完整内容
- 不需要提取或解析品类中的特定代码格式
- `sku_code` 必须包含品类字段的所有内容

#### 2.2.4 API调用需求

**API端点**：
```
POST http://127.0.0.1:8123/erpnext/resource?endpoint=%2Fapi%2Fmethod%2Frongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color&method=POST&full_model_fields=true
```

**请求方法**：POST

**请求头**：
- `accept: application/json`
- `Content-Type: application/json`

**请求体格式**：
```json
{
  "data": {},
  "json_data": {
    "items_data": [
      {
        "sku_code": "品类完整名称",
        "color": "颜色"
      }
    ]
  }
}
```

**响应格式**：
```json
{
  "data": {
    "message": [
      {
        "found": true,
        "sku_code": "zNF-16-RED",
        "color": "红",
        "item_type": "variant",
        "item_code": "zNF-16-RED",
        "item_name": "zNF-16-RED",
        "description": "zNF-16-RED",
        "item_group": "面料",
        "stock_uom": "米",
        "variant_of": "zNF-16",
        "has_variants": 0,
        "disabled": 0,
        "is_stock_item": 1,
        "standard_rate": 0,
        "valuation_rate": 0,
        "image": "",
        "brand": "",
        "color_value": "红",
        "attributes": [...]
      }
    ]
  }
}
```

**说明**：
- API接收的 `items_data` 数组中的每个对象必须包含 `sku_code` 和 `color` 两个字段
- API返回的 `message` 数组中包含查询结果，每个结果包含 `found` 字段表示是否找到匹配项
- 如果找到匹配项，返回完整的商品信息；如果未找到，`found` 为 false

## 3. 数据规范

### 3.1 输入数据格式
智能体需要支持以下输入格式：
1. **表格格式**：包含表头（品类、单耗/m、颜色）的表格数据
2. **文本格式**：自由文本描述，包含SKU信息
3. **JSON格式**：已结构化的JSON数据（可直接使用）

### 3.2 输出数据格式
- 标准JSON格式（如2.2.2节定义）
- 错误信息格式（当输入无法解析时）

### 3.3 数据验证规则
- `sku_code` 字段不能为空（必须包含品类字段的完整内容）
- `color` 字段不能为空

## 4. 技术实现需求

### 4.1 技术栈
- **框架**：Google ADK (Agent Development Kit)
- **模型**：Gemini 2.5 Flash 或 Gemini 2.5 Pro
- **语言**：Python

### 4.2 工具需求
需要实现以下工具（Tools）：

#### 工具1：SKU信息解析工具
- **功能**：将输入的SKU信息（表格或文本）解析为结构化JSON格式
- **输入**：SKU信息字符串
- **输出**：JSON格式的SKU数据

#### 工具2：SKU查询API工具
- **功能**：调用ERPNext API进行SKU查询
- **输入**：JSON格式的SKU数据（包含 `items_data` 数组，每个元素包含 `sku_code` 和 `color`）
- **输出**：API返回的查询结果（包含 `found` 字段和商品详细信息）
- **API端点**：`http://127.0.0.1:8123/erpnext/resource?endpoint=%2Fapi%2Fmethod%2Frongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color&method=POST&full_model_fields=true`
- **请求方法**：POST

### 4.3 智能体配置
- **名称**：sku_pro_agent 或 sku_expert_agent
- **模型**：gemini-2.5-flash 或 gemini-2.5-pro
- **指令**：需要清晰的指令，指导智能体如何使用工具

## 5. 使用场景示例

### 场景1：表格数据解析
**用户输入**：
```
品类：IW-10200 涤粘弹面料，单耗/m：1.37，颜色：黑棕格
```

**智能体处理**：
1. 解析输入，提取品类和颜色字段
2. 使用品类字段的完整内容作为 `sku_code`（如 "IW-10200 涤粘弹面料"）
3. 生成JSON格式数据（包含 `sku_code` 和 `color` 两个字段）
4. 将数据格式化为API请求格式（包含 `data` 和 `json_data.items_data`）
5. 调用ERPNext API进行查询
6. 解析API返回结果，提取 `found` 字段和商品详细信息
7. 返回查询结果给用户

### 场景2：批量SKU处理
**用户输入**：
提供包含多个SKU的表格数据

**智能体处理**：
1. 识别表格中的所有SKU条目
2. 为每个SKU生成JSON格式数据（`sku_code` 使用品类字段的完整内容，`color` 使用颜色字段）
3. 将所有SKU数据组合到 `items_data` 数组中
4. 格式化API请求（包含 `data` 和 `json_data.items_data`）
5. 调用ERPNext API进行批量查询
6. 解析API返回结果，汇总所有查询结果
7. 返回查询结果给用户（区分找到和未找到的SKU）

## 6. 待明确事项

### 6.1 API接口详情
- [x] API端点地址：`http://127.0.0.1:8123/erpnext/resource?endpoint=%2Fapi%2Fmethod%2Frongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color&method=POST&full_model_fields=true`
- [x] 请求方法：POST
- [ ] 认证方式（API Key/OAuth等）：待确认（当前示例未包含认证信息）
- [x] 请求参数格式：已定义（见2.2.4节）
- [x] 响应数据格式：已定义（见2.2.4节）
- [ ] 错误处理机制：需要确认API的错误响应格式

### 6.2 SKU代码提取规则细化
- [ ] SKU代码的具体格式规范（正则表达式）
- [ ] 多个代码格式的处理优先级
- [ ] 代码提取失败时的处理策略

### 6.3 业务规则
- [ ] 颜色字段的标准化规则（"配色"、"通用"等特殊值的处理）
- [ ] 单耗/m字段的单位和精度要求
- [ ] 品类名称的标准化规则

## 7. 验收标准

### 7.1 功能验收
- [ ] 能够正确解析表格格式的SKU数据
- [ ] 能够正确使用品类字段的完整内容作为 `sku_code`
- [ ] 能够生成符合规范的JSON格式数据（只包含 `sku_code` 和 `color` 两个字段）
- [ ] 能够成功调用API进行查询
- [ ] 能够返回清晰的查询结果

### 7.2 质量验收
- [ ] 错误处理完善（输入格式错误、API调用失败等）
- [ ] 代码可维护性和可扩展性
- [ ] 文档完善

## 8. 后续扩展方向

### 8.1 功能扩展
- 支持更多输入格式（Excel文件、CSV文件等）
- 支持SKU信息的验证和校验
- 支持SKU信息的编辑和更新
- 支持SKU信息的批量导出

### 8.2 性能优化
- 批量API调用的优化
- 缓存机制
- 并发处理能力

## 附录

### 附录A：示例数据

**完整示例输入**：
```
品类	单耗/m	颜色
IW-10200 涤粘弹面料	1.37	黑棕格
弹力色丁里布	0.3	配色
75D衬	0.05	黑色
树脂衬	0.01	黑色
车缝线		配色
小裤钩	2	银色
14cm - 3#尼龙闭尾拉链		黑色
15cm - 3#尼龙闭尾拉链	1	黑色
16cm - 3#尼龙闭尾拉链		黑色
17cm - 3#尼龙闭尾拉链		黑色
IW-S10533小商标	1	米色通用
S01538尺码标	1	米色通用
S01537产地标	1	米色通用
洗标	1	白底黑字通用
```

### 附录B：JSON输出示例

```json
{
  "items": [
    {
      "sku_code": "IW-10200 涤粘弹面料",
      "color": "黑棕格"
    },
    {
      "sku_code": "弹力色丁里布",
      "color": "配色"
    },
    {
      "sku_code": "75D衬",
      "color": "黑色"
    },
    {
      "sku_code": "树脂衬",
      "color": "黑色"
    },
    {
      "sku_code": "车缝线",
      "color": "配色"
    },
    {
      "sku_code": "小裤钩",
      "color": "银色"
    },
    {
      "sku_code": "14cm - 3#尼龙闭尾拉链",
      "color": "黑色"
    },
    {
      "sku_code": "15cm - 3#尼龙闭尾拉链",
      "color": "黑色"
    },
    {
      "sku_code": "16cm - 3#尼龙闭尾拉链",
      "color": "黑色"
    },
    {
      "sku_code": "17cm - 3#尼龙闭尾拉链",
      "color": "黑色"
    },
    {
      "sku_code": "IW-S10533小商标",
      "color": "米色通用"
    },
    {
      "sku_code": "S01538尺码标",
      "color": "米色通用"
    },
    {
      "sku_code": "S01537产地标",
      "color": "米色通用"
    },
    {
      "sku_code": "洗标",
      "color": "白底黑字通用"
    }
  ]
}
```

---

**文档版本**：v1.0  
**创建日期**：2025-01-27  
**最后更新**：2025-01-27  
**状态**：待评审
