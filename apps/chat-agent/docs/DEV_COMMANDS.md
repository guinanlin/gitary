# 开发命令说明

## ADK Dev UI 启动方式

### 启动所有智能体（默认）

```bash
make dev
# 或
make web
```

这会启动所有分类下的智能体，在 `http://localhost:8334` 访问。

### 启动特定分类的智能体

你可以通过 `CATEGORY` 参数来指定只启动某个分类的智能体：

```bash
# 只启动 content 分类下的智能体
make dev CATEGORY=content

# 只启动 business 分类下的智能体
make dev CATEGORY=business

# 只启动 general 分类下的智能体
make dev CATEGORY=general
```

### 自定义端口

你可以通过 `ADK_PORT` 环境变量来指定端口：

```bash
# 使用默认端口 8334
make dev

# 使用自定义端口
ADK_PORT=9000 make dev

# 结合分类和自定义端口
ADK_PORT=9000 make dev CATEGORY=content
```

## 可用分类

- `general` - 通用智能体
  - `hello_agent` - 通用对话示例智能体

- `business` - 业务智能体
  - `business_analyst` - 业务分析智能体
  - `sku_expert_agent` - SKU查询和处理智能体

- `content` - 内容生成智能体
  - `image_2_scripts` - 图片转口播文案智能体

## 示例

```bash
# 启动所有智能体（默认）
make dev

# 只启动 content 分类（image_2_scripts）
make dev CATEGORY=content

# 只启动 business 分类（business_analyst, sku_expert_agent）
make dev CATEGORY=business

# 使用自定义端口启动 content 分类
ADK_PORT=9000 make dev CATEGORY=content
```

## 注意事项

1. **环境变量文件**：确保对应分类下的智能体有正确的 `.env` 文件
2. **端口冲突**：如果端口被占用，使用 `ADK_PORT` 指定其他端口
3. **分类验证**：如果指定的分类不存在，命令会报错并列出可用分类


