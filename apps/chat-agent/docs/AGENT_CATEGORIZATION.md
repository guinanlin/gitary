# 智能体分类说明

## 分类结构

智能体按功能类型进行分类管理，便于组织和维护：

```
src/agents/
├── general/              # 通用智能体
│   └── hello_agent/     # 通用对话示例智能体
├── business/            # 业务智能体
│   ├── business_analyst/    # 业务分析智能体
│   └── sku_expert_agent/    # SKU查询和处理智能体
└── content/             # 内容生成智能体
    └── image_2_scripts/      # 图片转口播文案智能体
```

## 分类说明

### general/ - 通用智能体
用于通用对话、示例和演示的智能体。

**包含智能体：**
- `hello_agent`: 通用对话示例智能体

### business/ - 业务智能体
用于处理业务逻辑、数据查询和分析的智能体。

**包含智能体：**
- `business_analyst`: 业务分析智能体
- `sku_expert_agent`: SKU查询和处理智能体

### content/ - 内容生成智能体
用于生成各种内容（文案、脚本等）的智能体。

**包含智能体：**
- `image_2_scripts`: 图片转口播文案智能体

## 添加新智能体

### 1. 确定分类
根据智能体的功能，选择对应的分类目录：
- 通用功能 → `general/`
- 业务处理 → `business/`
- 内容生成 → `content/`

### 2. 创建智能体目录
在对应的分类目录下创建智能体目录：

```bash
# 例如：添加一个新的业务智能体
mkdir -p src/agents/business/new_business_agent
```

### 3. 创建智能体文件
在智能体目录下创建 `agent.py` 或 `root_agent.yaml`：

```python
# src/agents/business/new_business_agent/agent.py
from google.adk.agents import Agent

root_agent = Agent(
    name="new_business_agent",
    model="gemini-2.5-flash",
    description="新业务智能体描述",
    instruction="智能体指令..."
)
```

### 4. 验证
智能体会被自动扫描和发现，无需额外配置。

## 技术实现

### 递归扫描
系统使用递归扫描算法自动发现所有分类目录下的智能体：

```python
def scan_agents(directory: Path):
    for item in directory.iterdir():
        if not item.is_dir():
            continue
        if item.name.startswith('.') or item.name.startswith('__'):
            continue
        if (item / "agent.py").exists() or (item / "root_agent.yaml").exists():
            apps.append(item.name)
        else:
            scan_agents(item)  # 递归扫描子目录
```

### ADK 支持
ADK 框架本身支持递归扫描，会自动发现所有子目录中的智能体，无需额外配置。

## 优势

1. **清晰的组织结构** - 按功能分类，易于查找和管理
2. **易于扩展** - 新增智能体只需放入对应分类目录
3. **自动发现** - 递归扫描自动发现所有智能体
4. **向后兼容** - 不影响现有 API 调用，智能体名称保持不变

## 注意事项

- 智能体的 `name` 字段保持不变，不影响 API 调用
- 分类目录只是组织方式，不影响功能
- 可以随时调整分类，只需移动目录即可

