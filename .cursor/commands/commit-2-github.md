# Commit and Push to GitHub

## 命令描述

自动执行 git add、commit 和 push 操作，将更改提交并推送到 GitHub。

## 执行条件

- **用户明确要求**：只有在用户明确要求提交并推送时才执行
- **有未提交的更改**：检查是否有需要提交的更改

## 执行步骤

### 1. 检查 Git 状态
```bash
git status
```
- 如果没有未提交的更改，提示用户并退出
- 如果有更改，继续执行

### 2. 添加所有更改
```bash
git add .
```

### 3. 生成 Commit Message

根据更改内容自动生成英文 commit message，遵循 Conventional Commits 格式：

**Message 生成规则：**
- `feat:` - 新功能
- `fix:` - 修复 bug
- `refactor:` - 重构代码
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `chore:` - 构建/工具链相关
- `perf:` - 性能优化
- `test:` - 测试相关

**如果用户提供了自定义 message：**
- 优先使用用户提供的 message
- 确保使用英文

### 4. 提交更改
```bash
git commit -m "生成的或用户提供的 message"
```

### 5. 推送到远程
```bash
git push
```

## 使用示例

### 场景 1：自动生成 commit message
用户说："提交并推送到 GitHub"
- AI 分析更改内容
- 生成合适的 commit message（如：`feat: add start script for Railpack deployment`）
- 执行 add、commit、push

### 场景 2：用户提供 message
用户说："提交并推送，message 是 'fix: update package.json scripts'"
- 使用用户提供的 message
- 执行 add、commit、push

## 错误处理

- **Git 状态检查失败**：显示错误信息，不继续执行
- **Git add 失败**：显示错误信息，不继续执行
- **Git commit 失败**：显示错误信息，不继续执行
- **Git push 失败**：显示错误信息，提示用户检查远程仓库配置

## 注意事项

1. **禁止擅自提交**：只有在用户明确要求时才执行
2. **使用英文 message**：所有 commit message 必须使用英文
3. **自动添加所有更改**：使用 `git add .` 添加所有更改
4. **遵循 Conventional Commits**：生成的 message 遵循标准格式
5. **检查远程配置**：确保已配置远程仓库（origin）

## 相关文件

- `package.json` - 包含 `git:update` 脚本（已废弃，改用此命令）
