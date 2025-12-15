# SKU Pro 智能体产品需求文档 (PRD)

## 文档信息

- **文档版本**：v1.0
- **创建日期**：2025-01-27
- **最后更新**：2025-01-27
- **状态**：待评审
- **文档类型**：产品需求文档 (PRD)

---

## 1. 执行摘要

### 1.1 项目背景
SKU Pro 智能体是一个基于 Google ADK (Agent Development Kit) 开发的AI智能体，专门用于处理SKU（库存量单位）信息。该智能体能够自动解析用户提供的SKU数据（表格或文本格式），将其转换为标准化的JSON格式，并通过ERPNext API进行查询，返回详细的商品信息。

### 1.2 核心目标
- **自动化处理**：减少SKU信息整理的人工工作量
- **标准化输出**：提供统一的JSON数据格式
- **API集成**：无缝对接ERPNext系统进行数据查询
- **智能解析**：支持多种输入格式（表格、文本、JSON）

### 1.3 关键指标
- 数据解析准确率：≥95%
- API调用成功率：≥99%
- 响应时间：单次查询 < 3秒，批量查询 < 10秒
- 错误处理覆盖率：100%

---

## 2. 产品概述

### 2.1 产品定位
SKU Pro 智能体是一个专业化的SKU信息处理工具，面向需要批量查询和管理SKU信息的业务人员。通过自然语言交互，用户可以快速完成SKU信息的结构化处理和查询。

### 2.2 目标用户
- 供应链管理人员
- 库存管理人员
- 采购人员
- 需要批量查询SKU信息的业务人员

### 2.3 核心价值主张
- **零学习成本**：使用自然语言即可完成操作
- **高效处理**：支持批量SKU信息处理
- **数据准确**：标准化格式确保数据一致性
- **系统集成**：直接对接ERPNext系统

---

## 3. 功能需求

### 3.1 核心功能流程

```
用户输入SKU信息 
    ↓
智能体解析SKU数据（动作1）
    ↓
生成标准化JSON格式
    ↓
调用ERPNext API查询（动作2）
    ↓
返回查询结果
```

### 3.2 功能模块详细设计

#### 3.2.1 SKU信息解析模块（动作1）

**功能描述**：
将用户提供的SKU信息（表格、文本或JSON格式）解析并转换为标准化的JSON格式。

**输入格式支持**：

1. **表格格式**（主要支持）：
   ```
   品类	                单耗/m	颜色
   IW-10200 涤粘弹面料	1.37	黑棕格
   弹力色丁里布	        0.3	配色
   ```

2. **文本格式**：
   ```
   品类：IW-10200 涤粘弹面料，颜色：黑棕格
   品类：弹力色丁里布，颜色：配色
   ```

3. **JSON格式**（已结构化）：
   ```json
   {
     "items": [
       {"sku_code": "IW-10200 涤粘弹面料", "color": "黑棕格"}
     ]
   }
   ```

**处理逻辑**：
1. 识别输入格式类型（表格/文本/JSON）
2. 提取品类和颜色字段
3. 验证必填字段（品类和颜色不能为空）
4. 生成标准化JSON格式

**输出格式**：
```json
{
  "items": [
    {
      "sku_code": "品类完整内容",
      "color": "颜色"
    }
  ]
}
```

**字段说明**：
- `sku_code`：必填，直接使用品类字段的完整内容（如 "IW-10200 涤粘弹面料"）
- `color`：必填，颜色值

**错误处理**：
- 品类字段为空：返回错误提示
- 颜色字段为空：返回错误提示
- 无法识别输入格式：提示用户提供更清晰的格式

#### 3.2.2 API查询模块（动作2）

**功能描述**：
调用ERPNext API，根据SKU代码和颜色查询商品详细信息。

**API规格**：

**端点**：
```
POST http://127.0.0.1:8123/erpnext/resource?endpoint=%2Fapi%2Fmethod%2Frongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color&method=POST&full_model_fields=true
```

**请求头**：
```
accept: application/json
Content-Type: application/json
```

**请求体**：
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

**处理逻辑**：
1. 接收动作1生成的JSON数据
2. 转换为API请求格式（添加 `data` 和 `json_data` 包装）
3. 发送POST请求到ERPNext API
4. 解析响应数据
5. 提取查询结果（包含 `found` 字段判断是否找到）

**错误处理**：
- API调用失败：返回错误信息，提示用户稍后重试
- 网络超时：设置5秒超时，超时后返回错误
- 响应格式错误：记录错误日志，返回友好的错误提示
- 部分SKU查询失败：继续处理其他SKU，汇总所有结果

### 3.3 用户交互流程

#### 场景1：单个SKU查询
```
用户：品类：IW-10200 涤粘弹面料，颜色：黑棕格，帮我查询一下

智能体：
1. 调用解析工具，生成JSON
2. 调用API查询工具
3. 返回查询结果
```

#### 场景2：批量SKU查询
```
用户：[粘贴表格数据]

智能体：
1. 识别表格格式
2. 解析所有SKU条目
3. 批量调用API（或逐个调用）
4. 汇总所有查询结果
5. 区分找到和未找到的SKU
```

#### 场景3：错误处理
```
用户：[提供格式错误的数据]

智能体：
1. 识别输入格式错误
2. 提示用户正确的输入格式
3. 提供示例说明
```

---

## 4. 技术架构设计

### 4.1 技术栈

- **框架**：Google ADK (Agent Development Kit) - Python
- **模型**：Gemini 2.5 Flash
- **编程语言**：Python 3.10+
- **HTTP客户端**：requests 库
- **数据格式**：JSON
- **部署方式**：FastAPI 服务器（通过ADK CLI）

### 4.2 项目结构

```
apps/chat-agent/sku_expert_agent/
├── __init__.py              # 包初始化
├── agent.py                 # Agent定义和工具实现
├── tools/
│   ├── __init__.py
│   ├── sku_parser.py       # SKU信息解析工具
│   └── sku_api.py          # SKU查询API工具
├── .env.example            # 环境变量示例
└── .adk/                   # ADK运行时数据（自动生成）
```

### 4.3 核心组件设计

#### 4.3.1 Agent定义（agent.py）

```python
from google.adk.agents import Agent
from .tools.sku_parser import parse_sku_data
from .tools.sku_api import query_sku_by_api

root_agent = Agent(
    name="sku_expert_agent",
    model="gemini-2.5-flash",
    description="SKU专家智能体，用于解析SKU信息并查询商品详情",
    instruction=(
        "你是一个SKU专家智能体，专门处理SKU信息。"
        "当用户提供SKU信息时，首先使用parse_sku_data工具解析数据，"
        "然后使用query_sku_by_api工具查询商品详情。"
        "始终以友好的方式与用户交互，清晰地解释结果。"
    ),
    tools=[parse_sku_data, query_sku_by_api],
)
```

#### 4.3.2 SKU解析工具（tools/sku_parser.py）

**函数签名**：
```python
def parse_sku_data(sku_input: str) -> dict:
    """解析SKU信息并转换为标准化JSON格式
    
    Args:
        sku_input: SKU信息字符串，支持表格、文本或JSON格式
    
    Returns:
        dict: 包含'status'和'data'的字典，或'status'和'error_message'
    """
```

**实现要点**：
- 使用正则表达式或字符串解析识别表格格式
- 支持多种分隔符（制表符、空格、逗号等）
- 提取品类和颜色字段
- 验证必填字段
- 生成标准化JSON格式

#### 4.3.3 SKU查询API工具（tools/sku_api.py）

**函数签名**：
```python
def query_sku_by_api(items_data: list) -> dict:
    """调用ERPNext API查询SKU信息
    
    Args:
        items_data: SKU数据列表，每个元素包含sku_code和color
    
    Returns:
        dict: 包含'status'和'results'的字典，或'status'和'error_message'
    """
```

**实现要点**：
- 格式化API请求（添加data和json_data包装）
- 使用requests库发送POST请求
- 设置适当的超时时间（5秒）
- 处理HTTP错误和网络异常
- 解析API响应
- 提取和格式化查询结果

### 4.4 数据流设计

```
用户输入
    ↓
[Agent] 理解用户意图
    ↓
[工具1: parse_sku_data] 解析SKU信息
    ↓
JSON格式数据 {items: [{sku_code, color}]}
    ↓
[工具2: query_sku_by_api] 调用API
    ↓
格式化请求 {data: {}, json_data: {items_data: [...]}}
    ↓
ERPNext API
    ↓
响应数据 {data: {message: [...]}}
    ↓
[Agent] 解析并格式化结果
    ↓
返回给用户
```

---

## 5. 实现方案

### 5.1 开发阶段

#### 阶段1：基础框架搭建（1-2天）
- [x] 创建项目目录结构
- [ ] 配置开发环境
- [ ] 创建基础Agent框架
- [ ] 配置环境变量

#### 阶段2：工具实现（2-3天）
- [ ] 实现SKU解析工具
  - [ ] 表格格式解析
  - [ ] 文本格式解析
  - [ ] JSON格式验证
  - [ ] 数据验证逻辑
- [ ] 实现API查询工具
  - [ ] API请求格式化
  - [ ] HTTP请求发送
  - [ ] 响应解析
  - [ ] 错误处理

#### 阶段3：集成测试（1-2天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 错误场景测试

#### 阶段4：优化和部署（1天）
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 文档编写
- [ ] 部署配置

### 5.2 关键实现细节

#### 5.2.1 SKU解析工具实现

**表格解析逻辑**：
```python
def parse_table_format(text: str) -> list:
    """解析表格格式的SKU数据"""
    lines = text.strip().split('\n')
    header = lines[0].split('\t')  # 假设使用制表符分隔
    
    # 找到品类和颜色的列索引
    category_idx = header.index('品类')
    color_idx = header.index('颜色')
    
    items = []
    for line in lines[1:]:
        if not line.strip():
            continue
        cols = line.split('\t')
        if len(cols) > max(category_idx, color_idx):
            items.append({
                'sku_code': cols[category_idx].strip(),
                'color': cols[color_idx].strip()
            })
    return items
```

**数据验证**：
```python
def validate_sku_item(item: dict) -> tuple[bool, str]:
    """验证SKU项数据"""
    if not item.get('sku_code') or not item['sku_code'].strip():
        return False, "品类字段不能为空"
    if not item.get('color') or not item['color'].strip():
        return False, "颜色字段不能为空"
    return True, ""
```

#### 5.2.2 API查询工具实现

**请求格式化**：
```python
def format_api_request(items: list) -> dict:
    """格式化API请求"""
    return {
        "data": {},
        "json_data": {
            "items_data": [
                {
                    "sku_code": item["sku_code"],
                    "color": item["color"]
                }
                for item in items
            ]
        }
    }
```

**API调用**：
```python
def call_erpnext_api(request_data: dict) -> dict:
    """调用ERPNext API"""
    url = "http://127.0.0.1:8123/erpnext/resource?endpoint=%2Fapi%2Fmethod%2Frongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color&method=POST&full_model_fields=true"
    
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            url,
            headers=headers,
            json=request_data,
            timeout=5
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        return {"status": "error", "error_message": "API请求超时"}
    except requests.exceptions.RequestException as e:
        return {"status": "error", "error_message": f"API请求失败: {str(e)}"}
```

### 5.3 依赖管理

**requirements.txt 或 pyproject.toml**：
```
google-adk>=1.0.0
requests>=2.31.0
```

---

## 6. 数据模型

### 6.1 内部数据模型

#### SKUItem
```python
{
    "sku_code": str,      # 必填，品类完整内容
    "color": str          # 必填，颜色
}
```

#### ParsedSKUData
```python
{
    "status": "success" | "error",
    "data": {
        "items": List[SKUItem]
    } | None,
    "error_message": str | None
}
```

#### APIRequest
```python
{
    "data": {},
    "json_data": {
        "items_data": List[SKUItem]
    }
}
```

#### APIResponse
```python
{
    "data": {
        "message": List[{
            "found": bool,
            "sku_code": str,
            "color": str,
            "item_code": str,
            "item_name": str,
            # ... 其他字段
        }]
    }
}
```

### 6.2 数据转换流程

```
用户输入（字符串）
    ↓
解析 → SKUItem[]
    ↓
验证 → SKUItem[]（过滤无效项）
    ↓
格式化为API请求 → APIRequest
    ↓
API响应 → APIResponse
    ↓
提取结果 → List[QueryResult]
```

---

## 7. 错误处理

### 7.1 错误分类

#### 输入错误
- **类型**：用户输入格式错误
- **处理**：提示用户正确的输入格式，提供示例
- **示例**：缺少必填字段、格式无法识别

#### 解析错误
- **类型**：数据解析失败
- **处理**：记录错误，返回友好的错误提示
- **示例**：表格格式识别失败、字段提取错误

#### API错误
- **类型**：API调用失败
- **处理**：重试机制（可选），返回错误信息
- **示例**：网络超时、API返回错误、HTTP错误

#### 数据错误
- **类型**：数据验证失败
- **处理**：跳过无效数据，继续处理其他数据
- **示例**：必填字段为空、数据类型错误

### 7.2 错误响应格式

```python
{
    "status": "error",
    "error_message": "错误描述",
    "error_code": "ERROR_CODE",  # 可选
    "suggestion": "建议操作"      # 可选
}
```

### 7.3 日志记录

- 记录所有API调用（请求和响应）
- 记录解析错误和异常
- 记录性能指标（响应时间等）

---

## 8. 测试计划

### 8.1 单元测试

#### SKU解析工具测试
- [ ] 表格格式解析测试
- [ ] 文本格式解析测试
- [ ] JSON格式验证测试
- [ ] 数据验证测试
- [ ] 错误输入处理测试

#### API查询工具测试
- [ ] API请求格式化测试
- [ ] 成功响应解析测试
- [ ] 错误响应处理测试
- [ ] 超时处理测试
- [ ] 网络错误处理测试

### 8.2 集成测试

- [ ] 完整流程测试（解析→查询→返回）
- [ ] 批量SKU处理测试
- [ ] 错误场景端到端测试
- [ ] 性能测试（响应时间）

### 8.3 测试用例示例

#### 用例1：单个SKU查询
```
输入：品类：IW-10200 涤粘弹面料，颜色：黑棕格
预期：成功解析，成功查询，返回商品信息
```

#### 用例2：批量SKU查询
```
输入：表格格式的多行SKU数据
预期：全部解析成功，批量查询，返回所有结果
```

#### 用例3：格式错误处理
```
输入：缺少颜色字段的数据
预期：返回错误提示，提示缺少必填字段
```

#### 用例4：API调用失败
```
模拟：API超时或返回错误
预期：返回友好的错误提示，不影响其他SKU查询
```

---

## 9. 部署方案

### 9.1 开发环境

- 使用 `adk web` 命令启动开发服务器
- 支持热重载，便于调试

### 9.2 生产环境

- 通过 `get_fast_api_app` 集成到FastAPI服务器
- 使用环境变量配置API端点
- 支持Docker容器化部署

### 9.3 环境配置

**.env文件**：
```
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=your-api-key-here
ERPNext_API_URL=http://127.0.0.1:8123/erpnext/resource
ERPNext_API_ENDPOINT=/api/method/rongguan_erp.utils.api.item.item_api_for_agent.get_items_by_sku_and_color
```

### 9.4 集成到现有系统

参考 `apps/chat-agent/main.py` 的实现方式：
```python
from google.adk.cli.fast_api import get_fast_api_app

agents_dir = Path(__file__).parent / "sku_expert_agent"

adk_app = get_fast_api_app(
    agents_dir=str(agents_dir),
    web=False,
    allow_origins=["*"],
)
```

---

## 10. 风险评估

### 10.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| API接口变更 | 高 | 低 | 使用配置文件管理API端点，便于快速调整 |
| 解析准确率不足 | 中 | 中 | 增加测试用例，优化解析逻辑 |
| 网络不稳定 | 中 | 中 | 实现重试机制和超时处理 |
| 模型理解错误 | 中 | 低 | 优化Agent指令，增加示例 |

### 10.2 业务风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 用户输入格式多样 | 中 | 高 | 支持多种格式，提供格式说明 |
| 数据量大导致性能问题 | 低 | 低 | 实现批量处理优化 |
| API限流 | 低 | 低 | 实现请求队列和限流控制 |

### 10.3 运维风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| API服务不可用 | 高 | 低 | 实现健康检查和告警 |
| 日志不足 | 中 | 低 | 完善日志记录 |

---

## 11. 成功指标

### 11.1 功能指标
- ✅ 能够正确解析表格、文本、JSON三种格式
- ✅ API调用成功率 ≥ 99%
- ✅ 数据解析准确率 ≥ 95%

### 11.2 性能指标
- ✅ 单次查询响应时间 < 3秒
- ✅ 批量查询（10个SKU）响应时间 < 10秒
- ✅ API调用超时时间 5秒

### 11.3 质量指标
- ✅ 错误处理覆盖率 100%
- ✅ 单元测试覆盖率 ≥ 80%
- ✅ 集成测试通过率 100%

---

## 12. 后续优化方向

### 12.1 功能增强
- 支持Excel文件直接上传和解析
- 支持CSV文件导入
- 支持查询结果导出（Excel/CSV）
- 增加SKU信息验证和校验功能
- 支持SKU信息的编辑和更新

### 12.2 性能优化
- 实现API请求缓存机制
- 支持并发API调用
- 批量查询优化（合并请求）

### 12.3 用户体验优化
- 提供更友好的错误提示
- 支持查询历史记录
- 支持结果筛选和排序
- 增加可视化展示（表格、图表）

---

## 附录

### 附录A：示例代码结构

```
apps/chat-agent/sku_expert_agent/
├── __init__.py
│   └── from . import agent
│
├── agent.py
│   └── root_agent = Agent(...)
│
└── tools/
    ├── __init__.py
    ├── sku_parser.py
    │   └── def parse_sku_data(sku_input: str) -> dict
    └── sku_api.py
        └── def query_sku_by_api(items_data: list) -> dict
```

### 附录B：完整示例数据

**输入示例**：
```
品类	单耗/m	颜色
IW-10200 涤粘弹面料	1.37	黑棕格
弹力色丁里布	0.3	配色
75D衬	0.05	黑色
```

**中间JSON格式**：
```json
{
  "items": [
    {"sku_code": "IW-10200 涤粘弹面料", "color": "黑棕格"},
    {"sku_code": "弹力色丁里布", "color": "配色"},
    {"sku_code": "75D衬", "color": "黑色"}
  ]
}
```

**API请求格式**：
```json
{
  "data": {},
  "json_data": {
    "items_data": [
      {"sku_code": "IW-10200 涤粘弹面料", "color": "黑棕格"},
      {"sku_code": "弹力色丁里布", "color": "配色"},
      {"sku_code": "75D衬", "color": "黑色"}
    ]
  }
}
```

---

**文档状态**：待评审  
**下一步**：技术评审 → 开发实现 → 测试验证 → 部署上线
