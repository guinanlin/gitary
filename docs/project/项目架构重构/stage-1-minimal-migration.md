# Stage 1 最小化迁移方案

## 核心原则

**只做一件事：把应用代码移动到 `apps/web/`，更新路径配置，保持功能正常运行**

## 不做什么

- ❌ 不创建 `config/` 目录（后续阶段再做）
- ❌ 不移动 `packages/`（保持现状）
- ❌ 不修改根目录 `package.json` 的 workspaces（暂时保持单仓库模式）
- ❌ 不创建 `apps/web/package.json`（暂时使用根目录的 package.json）

## 只做什么

- ✅ 创建 `apps/web/` 目录
- ✅ 移动 `src/` → `apps/web/src/`
- ✅ 移动 `public/` → `apps/web/public/`
- ✅ 移动 `index.html` → `apps/web/index.html`
- ✅ 更新 `vite.config.ts` 中的路径引用
- ✅ 更新 `tsconfig.json` 中的路径引用
- ✅ 验证功能正常运行

## 详细步骤

### 步骤 1：创建目录结构

```bash
# 只创建 apps/web 目录
mkdir -p apps/web
```

### 步骤 2：移动应用代码（使用 git mv 保持历史）

```bash
# 移动源码目录
git mv src apps/web/src

# 移动公共资源
git mv public apps/web/public

# 移动入口文件
git mv index.html apps/web/index.html
```

### 步骤 3：更新 vite.config.ts

需要更新的路径：

```typescript
// 从
resolve(__dirname, "src")
// 改为
resolve(__dirname, "apps/web/src")

// 从
resolve(__dirname, "libs")
// 改为（libs 还在根目录，所以路径不变或改为相对路径）
resolve(__dirname, "libs")  // 保持不变，因为 libs 在根目录

// 从
"index.html"
// 改为
"apps/web/index.html"

// 从
outDir: "dist/"
// 改为（可选，或者保持 dist/）
outDir: "apps/web/dist/"  // 或者保持 "dist/"
```

### 步骤 4：更新 tsconfig.json

需要更新的路径：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./apps/web/src/*"],  // 从 "./src/*" 改为 "./apps/web/src/*"
      "xbook/*": ["./apps/web/src/xbook/*"],  // 从 "./src/xbook/*" 改为 "./apps/web/src/xbook/*"
      "xbook": ["./apps/web/src/xbook"],  // 从 "./src/xbook" 改为 "./apps/web/src/xbook"
      "libs/*": ["./libs/*"]  // 保持不变，因为 libs 在根目录
    }
  },
  "include": [
    "apps/web/src",  // 从 "src" 改为 "apps/web/src"
    "libs"  // 保持不变
  ]
}
```

### 步骤 5：验证功能

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

## 关键路径映射

| 原路径 | 新路径 | 配置文件 |
|--------|--------|----------|
| `src/` | `apps/web/src/` | vite.config.ts, tsconfig.json |
| `public/` | `apps/web/public/` | vite.config.ts |
| `index.html` | `apps/web/index.html` | vite.config.ts |
| `libs/` | `libs/` (不变) | - |
| `packages/` | `packages/` (不变) | - |

## 风险控制

1. **使用 git mv**：保持文件历史
2. **分步提交**：每完成一个步骤就提交一次
3. **及时验证**：移动后立即测试
4. **保留备份**：执行前创建备份分支

## 回滚方案

如果出现问题，可以快速回滚：

```bash
# 回滚到移动前
git reset --hard HEAD~1

# 或者使用备份分支
git checkout refactor/backup-YYYYMMDD
```

## 验收标准

- [ ] `apps/web/src/` 目录存在
- [ ] `apps/web/public/` 目录存在
- [ ] `apps/web/index.html` 文件存在
- [ ] `pnpm dev` 能正常启动
- [ ] `pnpm build` 能正常构建
- [ ] 所有功能正常
- [ ] Git 历史保持完整

## 后续工作

完成这个最小化迁移后，可以：
1. 验证功能正常
2. 稳定运行一段时间
3. 再考虑后续的 Monorepo 配置（workspaces、package.json 拆分等）

