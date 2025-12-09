# Stage 1 最小化迁移 - 执行指南

## 🎯 目标

**只做一件事：把应用代码（src/、public/、index.html）移动到 `apps/web/`，更新路径配置，保持功能正常运行**

## ✅ 这个方案的优势

1. **风险最小**：只移动代码，不改变 Monorepo 配置
2. **可回滚**：使用 `git mv` 保持历史，可以轻松回滚
3. **验证简单**：移动后立即测试，问题容易定位
4. **渐进式**：完成后再考虑后续的 Monorepo 配置

## 📋 执行步骤

### 前置检查

```bash
# 1. 确保 Git 工作区干净
git status

# 2. 创建备份分支（强烈推荐）
git checkout -b refactor/backup-$(date +%Y%m%d)
git push -u origin refactor/backup-$(date +%Y%m%d)
git checkout -  # 回到原分支

# 3. 创建标签（可选）
git tag -a refactor/before-stage-1-minimal -m "Stage 1 最小化迁移前的备份"
```

### 执行迁移

#### 方式一：使用脚本（推荐）

```bash
# 运行迁移脚本
node scripts/migrate-to-apps-web-minimal.cjs
```

脚本会自动：
1. 检查 Git 状态
2. 检查必要文件
3. 创建 `apps/web/` 目录
4. 使用 `git mv` 移动文件
5. 更新 `vite.config.ts` 和 `tsconfig.json`

#### 方式二：手动执行

```bash
# 1. 创建目录
mkdir -p apps/web

# 2. 移动文件（使用 git mv 保持历史）
git mv src apps/web/src
git mv public apps/web/public
git mv index.html apps/web/index.html

# 3. 更新 vite.config.ts
# 手动编辑文件，更新以下路径：
# - resolve(__dirname, "src") → resolve(__dirname, "apps/web/src")
# - resolve(__dirname, "src/xbook") → resolve(__dirname, "apps/web/src/xbook")
# - "index.html" → "apps/web/index.html"

# 4. 更新 tsconfig.json
# 手动编辑文件，更新以下路径：
# - "@/*": ["./src/*"] → "@/*": ["./apps/web/src/*"]
# - "xbook/*": ["./src/xbook/*"] → "xbook/*": ["./apps/web/src/xbook/*"]
# - "include": ["src"] → "include": ["apps/web/src"]
```

### 验证功能

```bash
# 1. 安装依赖（如果需要）
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 验证构建
pnpm build

# 4. 验证类型检查
pnpm typecheck
```

### 提交更改

如果一切正常：

```bash
# 查看更改
git status
git diff

# 提交
git add .
git commit -m "refactor: move app code to apps/web (minimal migration)"
```

## 🔍 关键路径映射

| 原路径 | 新路径 | 需要更新的配置文件 |
|--------|--------|-------------------|
| `src/` | `apps/web/src/` | `vite.config.ts`, `tsconfig.json` |
| `public/` | `apps/web/public/` | `vite.config.ts` |
| `index.html` | `apps/web/index.html` | `vite.config.ts` |
| `libs/` | `libs/` (不变) | - |
| `packages/` | `packages/` (不变) | - |

## ⚠️ 注意事项

1. **libs 目录**：`libs/` 保持在根目录，路径配置不需要修改
2. **packages 目录**：`packages/` 保持不变
3. **输出目录**：`dist/` 可以保持在根目录，或者改为 `apps/web/dist/`（建议保持根目录，后续再调整）
4. **package.json**：暂时不修改，保持单仓库模式

## 🔄 回滚方案

如果出现问题：

```bash
# 方式1：回滚到迁移前
git reset --hard HEAD~1

# 方式2：使用备份分支
git checkout refactor/backup-YYYYMMDD

# 方式3：使用标签
git reset --hard refactor/before-stage-1-minimal
```

## ✅ 验收标准

- [ ] `apps/web/src/` 目录存在
- [ ] `apps/web/public/` 目录存在
- [ ] `apps/web/index.html` 文件存在
- [ ] `pnpm dev` 能正常启动
- [ ] `pnpm build` 能正常构建
- [ ] 所有功能正常
- [ ] Git 历史保持完整（`git log --follow apps/web/src/main.tsx` 能看到历史）

## 📝 后续工作

完成这个最小化迁移后，可以：

1. **稳定运行**：让代码在新位置稳定运行一段时间
2. **验证功能**：确保所有功能正常
3. **考虑下一步**：再考虑后续的 Monorepo 配置（workspaces、package.json 拆分等）

## 🆘 常见问题

### Q: 如果 `pnpm dev` 启动失败怎么办？

A: 检查以下几点：
1. `vite.config.ts` 中的路径是否正确
2. `tsconfig.json` 中的路径是否正确
3. 检查控制台错误信息，定位具体问题

### Q: 如果构建失败怎么办？

A: 检查：
1. 入口文件路径是否正确
2. 路径别名配置是否正确
3. 查看构建日志，定位具体错误

### Q: 如何验证 Git 历史是否保持？

A: 运行：
```bash
git log --follow --oneline apps/web/src/main.tsx
```
应该能看到文件的历史提交记录。

## 📚 相关文档

- [Stage 1 最小化迁移方案](./stage-1-minimal-migration.md)
- [完整重构实施计划](./refactor-implementation-plan.md)

