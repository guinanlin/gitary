# 清理说明

## ⚠️ 重要提示

由于 Windows 系统下数据库文件可能被锁定，`image_2_scripts` 目录可能无法自动删除。

## 手动清理步骤

如果 `image_2_scripts` 目录仍然存在，请按以下步骤手动删除：

### 方法 1: 关闭相关进程后删除
1. 关闭所有可能使用数据库文件的程序（如 ADK Dev UI、FastAPI 服务器等）
2. 在文件管理器中手动删除 `image_2_scripts` 目录
3. 如果仍然无法删除，重启计算机后再试

### 方法 2: 使用 PowerShell 强制删除
```powershell
# 在 PowerShell 中执行
cd apps/chat-agent
Remove-Item -Path "image_2_scripts" -Recurse -Force
```

### 方法 3: 使用资源管理器
1. 打开文件管理器
2. 导航到 `apps/chat-agent` 目录
3. 右键点击 `image_2_scripts` 文件夹
4. 选择"删除"
5. 如果提示文件被占用，选择"跳过"或"强制删除"

## 已清理的文件

以下文件已成功删除：
- ✅ `main.py` (已移动到 `src/main.py`)
- ✅ `hello_agent/` (已移动到 `src/agents/hello_agent/`)
- ✅ `business_analyst/` (已移动到 `src/agents/business_analyst/`)
- ✅ `sku_expert_agent/` (已移动到 `src/agents/sku_expert_agent/`)
- ✅ 所有测试文件 (已移动到 `tests/`)
- ✅ 所有文档文件 (已移动到 `docs/`)
- ✅ 所有脚本文件 (已移动到 `scripts/`)

## 待清理

- ⚠️ `image_2_scripts/` - 需要手动删除（数据库文件被锁定）

## 验证清理结果

清理完成后，根目录应该只包含：
- 配置文件：`.env.example`, `.gitignore`, `pyproject.toml`, `Makefile`
- 文档：`README.md`, `REFACTOR_PROPOSAL.md`, `REFACTOR_SUMMARY.md`, `CLEANUP_NOTE.md`
- 新目录：`src/`, `tests/`, `scripts/`, `docs/`, `config/`
