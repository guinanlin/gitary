# Chat Agent 目录重构建议

## 建议的新目录结构

```
apps/chat-agent/
├── src/                          # 源代码目录
│   ├── __init__.py
│   ├── main.py                   # FastAPI 服务器入口（从根目录移动）
│   ├── api/                      # API 相关代码
│   │   ├── __init__.py
│   │   ├── routes.py            # API 路由（从 main.py 拆分）
│   │   ├── models.py             # Pydantic 模型（从 main.py 拆分）
│   │   └── middleware.py         # 中间件配置
│   ├── agents/                   # 智能体目录（按功能分类）
│   │   ├── __init__.py
│   │   ├── general/              # 通用智能体
│   │   │   ├── __init__.py
│   │   │   └── hello_agent/
│   │   │       ├── __init__.py
│   │   │       ├── agent.py
│   │   │       └── root_agent.yaml
│   │   ├── business/              # 业务智能体
│   │   │   ├── __init__.py
│   │   │   ├── business_analyst/
│   │   │   │   └── root_agent.yaml
│   │   │   └── sku_expert_agent/
│   │   │       ├── __init__.py
│   │   │       ├── agent.py
│   │   │       └── root_agent.yaml
│   │   └── content/               # 内容生成智能体
│   │       ├── __init__.py
│   │       └── image_2_scripts/
│   │           ├── __init__.py
│   │           ├── agent.py
│   │           └── root_agent.yaml
│   ├── tools/                    # 共享工具（从各智能体提取）
│   │   ├── __init__.py
│   │   ├── json_formatter.py    # 从 image_2_scripts/tools/ 移动
│   │   ├── sku_api.py           # 从 sku_expert_agent/tools/ 移动
│   │   └── sku_parser.py        # 从 sku_expert_agent/tools/ 移动
│   └── adapters/                 # 模型适配器（统一管理）
│       ├── __init__.py
│       ├── gitcode_model_adapter.py
│       ├── gitcode_litellm_adapter.py
│       └── gitcode_model.py
│
├── tests/                         # 测试目录（统一管理）
│   ├── __init__.py
│   ├── conftest.py              # pytest 配置
│   ├── test_agent.py            # 从根目录移动
│   ├── test_gitcode_adapter.py  # 从根目录移动
│   ├── test_gitcode_api.py      # 从根目录移动
│   ├── test_litellm_direct.py   # 从根目录移动
│   ├── test_litellm_stream_fix.py # 从根目录移动
│   ├── test_request_direct.py   # 从根目录移动
│   ├── test_request_format.py   # 从根目录移动
│   ├── agents/                   # 智能体特定测试
│   │   ├── __init__.py
│   │   ├── test_hello_agent.py
│   │   ├── test_image_2_scripts.py
│   │   └── test_sku_expert_agent.py
│   └── fixtures/                 # 测试数据
│       ├── test_request_chinese.json
│       ├── test_request_image.json
│       └── test_request_multiple_images.json
│
├── scripts/                       # 脚本目录（统一管理）
│   ├── run.sh                   # 从根目录移动
│   ├── run.bat                  # 从根目录移动
│   ├── clean_venv.bat          # 从根目录移动
│   ├── test_api.sh             # 从 image_2_scripts/ 移动
│   └── test_multiple_images.sh # 从 image_2_scripts/ 移动
│
├── docs/                          # 文档目录（统一管理）
│   ├── README.md                # 主文档（从根目录移动）
│   ├── INSTALL_MAKE.md          # 从根目录移动
│   ├── MAKEFILE_GUIDE.md        # 从根目录移动
│   ├── MODELS_CONFIGURATION.md  # 从根目录移动
│   ├── QUICK_TEST.md            # 从根目录移动
│   ├── TROUBLESHOOTING.md       # 从根目录移动
│   ├── FIX_MAKE_PATH.md         # 从根目录移动
│   ├── GITCODE_API_TEST.md      # 从根目录移动
│   ├── GITCODE_FIX.md           # 从根目录移动
│   └── agents/                  # 智能体特定文档
│       ├── image_2_scripts/
│       │   ├── README.md
│       │   ├── DEEPSEEK_INTEGRATION.md
│       │   ├── test_api_curl.md
│       │   └── test_curl_commands.md
│       └── sku_expert_agent/
│           └── readme.md
│
├── config/                        # 配置文件目录
│   ├── .env.example             # 从根目录移动
│   └── agents/                  # 智能体特定配置示例
│       ├── hello_agent/
│       │   └── .env.example
│       ├── image_2_scripts/
│       │   └── .env.example
│       └── sku_expert_agent/
│           └── .env.example
│
├── .adk/                          # ADK 运行时数据（保持原位置）
│   └── session.db
│
├── pyproject.toml                  # 项目配置（保持原位置）
├── Makefile                      # Make 配置（保持原位置）
├── .gitignore                    # Git 配置（保持原位置）
└── README.md                     # 项目入口 README（简化版，指向 docs/）
```

## 重构原则

### 1. 关注点分离
- **源代码** (`src/`): 所有业务代码
- **测试** (`tests/`): 所有测试代码和测试数据
- **文档** (`docs/`): 所有文档
- **脚本** (`scripts/`): 所有可执行脚本
- **配置** (`config/`): 所有配置文件示例

### 2. 统一智能体结构
每个智能体目录应包含：
```
agents/{agent_name}/
├── __init__.py
├── agent.py          # Agent 定义（可选，如果使用 YAML 则不需要）
├── root_agent.yaml    # Agent 配置（可选，如果使用 Python 则不需要）
└── tools/            # 智能体特定工具（可选，共享工具放在 src/tools/）
    ├── __init__.py
    └── {tool_name}.py
```

### 3. 共享资源提取
- **共享工具**: 移动到 `src/tools/`
- **模型适配器**: 移动到 `src/adapters/`
- **测试数据**: 移动到 `tests/fixtures/`

### 4. 文档组织
- **项目级文档**: `docs/` 根目录
- **智能体文档**: `docs/agents/{agent_name}/`

## 迁移步骤

### 阶段 1: 创建新目录结构
1. 创建 `src/`, `tests/`, `scripts/`, `docs/`, `config/` 目录
2. 创建子目录结构

### 阶段 2: 移动源代码
1. 移动 `main.py` 到 `src/main.py`
2. 拆分 `main.py` 为多个模块（routes, models, middleware）
3. 移动智能体目录到 `src/agents/`
4. 移动共享工具到 `src/tools/`
5. 移动适配器到 `src/adapters/`

### 阶段 3: 移动测试文件
1. 移动所有测试文件到 `tests/`
2. 移动测试数据到 `tests/fixtures/`
3. 创建 `tests/conftest.py` 配置

### 阶段 4: 移动脚本和文档
1. 移动所有脚本到 `scripts/`
2. 移动所有文档到 `docs/`
3. 更新脚本中的路径引用

### 阶段 5: 更新配置和导入
1. 更新 `pyproject.toml` 中的包配置
2. 更新所有导入路径
3. 更新 `main.py` 中的 `agents_dir` 路径
4. 更新 `.env.example` 文件位置

### 阶段 6: 验证和测试
1. 运行所有测试确保功能正常
2. 验证所有脚本可以正常执行
3. 检查文档链接是否有效

## 优势

### 1. 清晰的组织结构
- 一目了然的目录层次
- 易于找到相关文件
- 符合 Python 项目最佳实践

### 2. 更好的可维护性
- 代码和测试分离
- 文档集中管理
- 配置统一管理

### 3. 更好的可扩展性
- 新增智能体只需在 `src/agents/` 添加
- 新增工具只需在 `src/tools/` 添加
- 新增适配器只需在 `src/adapters/` 添加

### 4. 更好的测试支持
- 统一的测试目录
- 清晰的测试组织结构
- 便于 CI/CD 集成

## 注意事项

1. **保持向后兼容**: 在迁移过程中，确保 API 端点不变
2. **更新导入路径**: 所有相对导入需要更新
3. **更新文档**: README 和文档中的路径引用需要更新
4. **环境变量**: `.env` 文件位置变化需要更新配置
5. **ADK 配置**: `agents_dir` 路径需要更新为 `src/agents`

## 可选优化

### 1. 使用 Python 包结构
如果项目足够大，可以考虑：
```
src/
└── chat_agent/          # 包名
    ├── __init__.py
    ├── main.py
    ├── api/
    ├── agents/
    ├── tools/
    └── adapters/
```

### 2. 添加类型检查
- 使用 `mypy` 进行类型检查
- 添加 `py.typed` 标记文件

### 3. 添加代码格式化
- 使用 `black` 格式化代码
- 使用 `isort` 排序导入

### 4. 添加预提交钩子
- 使用 `pre-commit` 自动检查代码质量
