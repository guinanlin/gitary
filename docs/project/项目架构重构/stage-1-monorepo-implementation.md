# 阶段1：Monorepo 基础架构 - 详细实施文档

## 文档信息

- **文档版本：** v1.0
- **创建日期：** 2025-01-27
- **最后更新：** 2025-01-27
- **状态：** 待实施
- **预计时长：** 2周

## 一、阶段目标

### 1.1 核心目标

1. **建立标准 Monorepo 结构**
   - 创建 `apps/`、`packages/`、`extensions/` 目录结构
   - 将应用代码移动到 `apps/web/`
   - 将浏览器扩展移动到 `extensions/`

2. **保持功能正常运行**
   - 所有功能在迁移后正常工作
   - 开发服务器正常启动
   - 构建流程正常执行
   - 类型检查通过

3. **保持 Git 历史完整**
   - 使用 `git mv` 保持文件历史
   - 确保代码审查和追溯能力

### 1.2 成功标准

- [ ] 应用在 `apps/web/` 下正常运行
- [ ] 开发服务器启动成功（`pnpm dev`）
- [ ] 构建成功（`pnpm build`）
- [ ] 所有功能正常（核心功能测试通过）
- [ ] Git 历史保持完整（`git log --follow` 可追溯）
- [ ] 类型检查通过（`pnpm typecheck`）

## 二、前置准备

### 2.1 环境检查

在执行阶段1之前，确保：

- [ ] 当前代码已提交到 Git（或创建备份分支）
- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 开发服务器正常运行
- [ ] 已创建备份分支（参考阶段0）

### 2.2 创建备份

```bash
# 创建备份分支
git checkout -b refactor/backup-stage-1-$(date +%Y%m%d)
git push origin refactor/backup-stage-1-$(date +%Y%m%d)

# 创建标签
git tag -a refactor/before-stage-1 -m "阶段1开始前的备份点"
git push origin refactor/before-stage-1

# 返回主分支
git checkout main
```

### 2.3 创建阶段分支

```bash
# 创建阶段1工作分支
git checkout -b refactor/stage-1-monorepo
```

## 三、详细实施步骤

### 步骤1.1：创建目录结构（1天）

#### 1.1.1 创建 Monorepo 目录结构

```bash
# 在项目根目录执行
mkdir -p apps/web
mkdir -p packages
mkdir -p config
mkdir -p scripts
# 注意：browser-extension 是独立的 Chrome addon，保持不变
```

#### 1.1.2 验证目录结构

```bash
# 验证目录已创建
tree -L 2 -d apps packages config scripts
```

**预期输出：**
```
apps/
└── web/
packages/
config/
scripts/
```

#### 1.1.3 提交初始结构

```bash
git add apps packages config scripts
git commit -m "chore: create monorepo directory structure"
```

---

### 步骤1.2：移动应用代码（3天）

#### 1.2.1 移动核心应用文件

使用 `git mv` 保持 Git 历史：

```bash
# 移动源码目录
git mv src apps/web/src

# 移动公共资源
git mv public apps/web/public

# 移动入口文件
git mv index.html apps/web/index.html

# 移动其他应用相关文件（如果存在）
# git mv *.config.* apps/web/  # 注意：配置文件后续会移动到 config/
```

#### 1.2.2 浏览器扩展说明

**注意：** `browser-extension/` 是独立的 Chrome addon 项目，保持不变，不进行迁移。

#### 1.2.3 移动图片资源（可选）

根据实际情况选择：

```bash
# 方案1：移动到应用 public 目录
if [ -d "images" ]; then
  git mv images apps/web/public/images
fi

# 方案2：移动到文档目录
# if [ -d "images" ]; then
#   git mv images docs/images
# fi
```

#### 1.2.4 验证移动结果

```bash
# 检查移动后的结构
ls -la apps/web/
ls -la apps/web/src/  # 应该能看到源代码目录
ls -la apps/web/public/  # 应该能看到公共资源

# 验证 Git 历史
git log --follow --oneline apps/web/src/main.tsx | head -5
```

#### 1.2.5 提交移动结果

```bash
git add apps/web
git commit -m "refactor: move application code to apps/web"
```

---

### 步骤1.3：更新根目录 package.json（1天）

#### 1.3.1 备份当前 package.json

```bash
cp package.json package.json.backup
```

#### 1.3.2 更新根目录 package.json

创建新的根目录 `package.json`：

```json
{
  "name": "gitary-monorepo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*",
    "extensions/*"
  ],
  "scripts": {
    "dev": "pnpm --filter @gitary/web dev",
    "build": "pnpm --filter @gitary/web build",
    "build:all": "pnpm -r build",
    "build:fast": "pnpm --filter @gitary/web build:fast",
    "lint": "pnpm -r lint",
    "lint:fix": "pnpm -r lint:fix",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "preview": "pnpm --filter @gitary/web preview",
    "clean": "pnpm -r clean && rm -rf node_modules",
    "ext:gitary:build": "pnpm --filter @gitary/browser-extension build",
    "ext:gitary:watch": "pnpm --filter @gitary/browser-extension watch",
    "ext:gitary:pack": "pnpm --filter @gitary/browser-extension pack"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**关键变更说明：**

1. **workspaces 配置**：定义 Monorepo 工作空间
   - `apps/*`：所有应用
   - `packages/*`：所有共享包
   - `extensions/*`：所有扩展

2. **scripts 更新**：
   - 使用 `pnpm --filter` 过滤特定包
   - `@gitary/web` 是应用包的名称
   - `-r` 表示递归执行所有工作空间

3. **依赖管理**：
   - 根目录只保留 Monorepo 管理相关的依赖
   - 应用特定依赖迁移到 `apps/web/package.json`

#### 1.3.3 验证 package.json

```bash
# 检查 JSON 格式
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"

# 验证 workspaces 配置
pnpm list --depth=0
```

#### 1.3.4 提交变更

```bash
git add package.json
git commit -m "refactor: update root package.json for monorepo structure"
```

---

### 步骤1.4：创建 apps/web/package.json（1天）

#### 1.4.1 创建 apps/web/package.json

创建 `apps/web/package.json` 文件：

```json
{
  "name": "@gitary/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config ../../config/vite.config.ts",
    "build": "pnpm --filter @dty/ai-assistant-core run build && cross-env NODE_OPTIONS=--max-old-space-size=8192 tsc && cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config ../../config/vite.config.ts",
    "build:fast": "cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config ../../config/vite.config.ts",
    "preview": "vite preview",
    "typecheck": "cross-env NODE_OPTIONS=--max-old-space-size=8192 tsc --noEmit --project tsconfig.json",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives",
    "lint:fix": "eslint . --ext ts,tsx --report-unused-disable-directives --fix",
    "clean": "rm -rf dist node_modules/.vite"
  },
  "dependencies": {
    "@dty/ai-assistant-core": "workspace:*"
  },
  "devDependencies": {}
}
```

**注意：** 
- `dependencies` 和 `devDependencies` 需要从根目录 `package.json` 迁移
- 暂时使用 `../../config/vite.config.ts` 作为配置文件路径（后续会移动到 `config/`）

#### 1.4.2 迁移依赖

从根目录 `package.json` 迁移依赖到 `apps/web/package.json`：

**迁移策略：**

1. **生产依赖（dependencies）**：
   - 所有应用运行时需要的依赖
   - 保留在 `apps/web/package.json` 的 `dependencies` 中

2. **开发依赖（devDependencies）**：
   - 构建工具相关：`vite`、`typescript`、`@vitejs/plugin-react` 等
   - 代码质量工具：`eslint`、`prettier` 等
   - 测试工具：`vitest`、`@testing-library/react` 等
   - 保留在 `apps/web/package.json` 的 `devDependencies` 中

3. **共享依赖**：
   - 如果多个包都需要，可以保留在根目录
   - 或者创建共享包

**迁移步骤：**

```bash
# 1. 查看当前根目录依赖
cat package.json | grep -A 100 '"dependencies"'

# 2. 手动迁移到 apps/web/package.json
# 或者使用脚本自动迁移（需要根据实际情况调整）
```

#### 1.4.3 验证 package.json

```bash
# 检查 JSON 格式
node -e "JSON.parse(require('fs').readFileSync('apps/web/package.json', 'utf8'))"

# 验证包名称
cat apps/web/package.json | grep '"name"'
```

#### 1.4.4 提交变更

```bash
git add apps/web/package.json
git commit -m "feat: create apps/web/package.json with migrated dependencies"
```

---

### 步骤1.5：更新构建配置（2天）

#### 1.5.1 更新 vite.config.ts 路径引用

**当前状态：** `vite.config.ts` 在根目录（后续会移动到 `config/`）

**临时方案：** 更新 `vite.config.ts` 中的路径引用

**需要更新的路径：**

1. **入口文件路径**：
   ```typescript
   // 从
   input: resolve(__dirname, 'index.html')
   // 改为
   input: resolve(__dirname, 'apps/web/index.html')
   ```

2. **源码路径别名**：
   ```typescript
   // 从
   '@': resolve(__dirname, 'src')
   // 改为
   '@': resolve(__dirname, 'apps/web/src')
   ```

3. **公共资源路径**：
   ```typescript
   // 从
   publicDir: resolve(__dirname, 'public')
   // 改为
   publicDir: resolve(__dirname, 'apps/web/public')
   ```

**完整示例：**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      '@app': path.resolve(__dirname, 'apps/web/src/app'),
      '@plugin': path.resolve(__dirname, 'apps/web/src/plugin'),
      '@service': path.resolve(__dirname, 'apps/web/src/service'),
      '@toolkit': path.resolve(__dirname, 'apps/web/src/toolkit'),
      '@lib': path.resolve(__dirname, 'apps/web/src/lib'),
      '@shared': path.resolve(__dirname, 'apps/web/src/shared'),
      'xbook': path.resolve(__dirname, 'apps/web/src/toolkit/xbook'),
      'libs': path.resolve(__dirname, 'apps/web/src/lib'),
      '@gitary/ai-assistant-core': path.resolve(__dirname, 'packages/ai-assistant-core/src'),
    },
  },
  build: {
    outDir: 'apps/web/dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'apps/web/index.html'),
      },
    },
  },
  publicDir: path.resolve(__dirname, 'apps/web/public'),
});
```

#### 1.5.2 更新 tsconfig.json 路径引用

**需要更新的路径：**

1. **baseUrl**：
   ```json
   {
     "compilerOptions": {
       "baseUrl": "apps/web",
       // ...
     }
   }
   ```

2. **paths 配置**：
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./apps/web/src/*"],
         "@app/*": ["./apps/web/src/app/*"],
         // ... 其他路径别名
       }
     }
   }
   ```

3. **include 配置**：
   ```json
   {
     "include": [
       "apps/web/src/**/*",
       "apps/web/index.html"
     ]
   }
   ```

**完整示例：**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable", "ESNext.WeakRef"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": "apps/web",
    "paths": {
      "@/*": ["./apps/web/src/*"],
      "@app/*": ["./apps/web/src/app/*"],
      "@plugin/*": ["./apps/web/src/plugin/*"],
      "@service/*": ["./apps/web/src/service/*"],
      "@toolkit/*": ["./apps/web/src/toolkit/*"],
      "@lib/*": ["./apps/web/src/lib/*"],
      "@shared/*": ["./apps/web/src/shared/*"],
      "xbook/*": ["./apps/web/src/toolkit/xbook/*"],
      "xbook": ["./apps/web/src/toolkit/xbook"],
      "libs/*": ["./apps/web/src/lib/*"],
      "@gitary/ai-assistant-core/*": ["./packages/ai-assistant-core/src/*"]
    }
  },
  "include": [
    "apps/web/src/**/*",
    "apps/web/index.html"
  ]
}
```

#### 1.5.3 更新 index.html 入口路径

更新 `apps/web/index.html` 中的脚本入口：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gitary</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**注意：** 如果 `index.html` 中有相对路径引用，需要确保路径正确。

#### 1.5.4 更新其他配置文件

检查并更新其他可能受影响的配置文件：

- `tailwind.config.js`（如果存在）
- `postcss.config.js`（如果存在）
- `jest.config.js`（如果存在）
- 其他构建相关配置

#### 1.5.5 验证配置

```bash
# 检查 vite 配置语法
node -e "import('./vite.config.ts').then(() => console.log('Vite config OK'))"

# 检查 TypeScript 配置
tsc --showConfig --project tsconfig.json | head -20
```

#### 1.5.6 提交变更

```bash
git add vite.config.ts tsconfig.json apps/web/index.html
git commit -m "refactor: update build configs for monorepo structure"
```

---

### 步骤1.6：验证与测试（2天）

#### 1.6.1 安装依赖

```bash
# 清理旧的 node_modules
rm -rf node_modules

# 安装依赖
pnpm install
```

**预期结果：**
- 所有依赖安装成功
- 没有版本冲突
- workspace 链接正确

#### 1.6.2 验证开发服务器

```bash
# 启动开发服务器
pnpm dev
```

**检查项：**
- [ ] 服务器成功启动
- [ ] 没有编译错误
- [ ] 页面可以正常访问
- [ ] 热更新正常工作

#### 1.6.3 验证构建

```bash
# 执行构建
pnpm build
```

**检查项：**
- [ ] 构建成功完成
- [ ] 没有构建错误
- [ ] 构建产物在 `apps/web/dist/` 目录
- [ ] 构建产物大小合理

#### 1.6.4 验证类型检查

```bash
# 执行类型检查
pnpm typecheck
```

**检查项：**
- [ ] 类型检查通过
- [ ] 没有类型错误
- [ ] 路径别名解析正确

#### 1.6.5 功能测试清单

**核心功能测试：**

- [ ] 应用启动正常
- [ ] 页面路由正常
- [ ] 主要功能模块正常
- [ ] 数据加载正常
- [ ] 用户交互正常
- [ ] 样式显示正常

**具体测试项（根据实际项目调整）：**

- [ ] 登录/认证功能
- [ ] 主要业务功能
- [ ] 数据展示功能
- [ ] 表单提交功能
- [ ] 文件上传/下载功能
- [ ] AI 助手功能（如果存在）

#### 1.6.6 验证 Git 历史

```bash
# 验证文件历史保持完整
git log --follow --oneline apps/web/src/main.tsx | head -10

# 验证移动操作记录
git log --all --full-history -- apps/web/src/main.tsx | head -10
```

**预期结果：**
- 可以看到文件的历史提交记录
- 可以看到文件移动的记录

#### 1.6.7 提交验证结果

```bash
git add .
git commit -m "test: verify monorepo migration - all tests passing"
```

---

## 四、常见问题与解决方案

### 4.1 依赖安装问题

**问题：** `pnpm install` 失败

**可能原因：**
- workspace 配置错误
- 包名称冲突
- 依赖版本冲突

**解决方案：**
```bash
# 1. 检查 workspace 配置
cat package.json | grep -A 5 "workspaces"

# 2. 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. 检查包名称唯一性
pnpm list --depth=0
```

### 4.2 路径别名问题

**问题：** 导入路径找不到模块

**可能原因：**
- vite.config.ts 路径别名配置错误
- tsconfig.json 路径配置错误
- 路径别名不一致

**解决方案：**
```bash
# 1. 检查 vite 配置
cat vite.config.ts | grep -A 10 "alias"

# 2. 检查 tsconfig 配置
cat tsconfig.json | grep -A 10 "paths"

# 3. 确保两者一致
```

### 4.3 构建配置问题

**问题：** 构建失败或构建产物路径错误

**可能原因：**
- 入口文件路径错误
- 输出目录配置错误
- 公共资源路径错误

**解决方案：**
```bash
# 1. 检查入口文件
cat vite.config.ts | grep "input"

# 2. 检查输出目录
cat vite.config.ts | grep "outDir"

# 3. 检查公共资源目录
cat vite.config.ts | grep "publicDir"
```

### 4.4 开发服务器问题

**问题：** 开发服务器无法启动或页面无法访问

**可能原因：**
- 端口冲突
- 配置文件路径错误
- 依赖缺失

**解决方案：**
```bash
# 1. 检查端口占用
lsof -i :5173  # 或使用其他端口

# 2. 检查配置文件
ls -la config/vite.config.ts  # 或根目录 vite.config.ts

# 3. 检查依赖
pnpm list --depth=0
```

---

## 五、验收检查清单

### 5.1 目录结构检查

- [ ] `apps/web/` 目录存在
- [ ] `apps/web/src/` 目录存在
- [ ] `apps/web/public/` 目录存在
- [ ] `apps/web/index.html` 文件存在
- [ ] `apps/web/package.json` 文件存在

### 5.2 配置文件检查

- [ ] 根目录 `package.json` 包含 workspaces 配置
- [ ] `apps/web/package.json` 配置正确
- [ ] `vite.config.ts` 路径引用正确
- [ ] `tsconfig.json` 路径引用正确
- [ ] `index.html` 入口路径正确

### 5.3 功能验证检查

- [ ] `pnpm install` 成功
- [ ] `pnpm dev` 启动成功
- [ ] `pnpm build` 构建成功
- [ ] `pnpm typecheck` 类型检查通过
- [ ] 核心功能测试通过

### 5.4 Git 历史检查

- [ ] 文件历史保持完整
- [ ] 可以使用 `git log --follow` 追溯文件历史
- [ ] 所有移动操作使用 `git mv`

---

## 六、完成阶段1

### 6.1 最终提交

```bash
# 确保所有变更已提交
git status

# 如果有未提交的变更
git add .
git commit -m "refactor(stage-1): complete monorepo structure migration"

# 推送到远程
git push origin refactor/stage-1-monorepo
```

### 6.2 创建里程碑标签

```bash
# 创建阶段1完成标签
git tag -a refactor/stage-1-complete -m "阶段1完成：Monorepo 架构建立"
git push origin refactor/stage-1-complete
```

### 6.3 合并到主分支（可选）

如果阶段1验证通过，可以合并到主分支：

```bash
# 切换到主分支
git checkout main

# 合并阶段1分支
git merge refactor/stage-1-monorepo

# 推送到远程
git push origin main
```

### 6.4 更新文档

更新项目文档：

- [ ] 更新 README.md（说明新的 Monorepo 结构）
- [ ] 更新开发指南（说明新的开发流程）
- [ ] 更新架构文档（记录 Monorepo 结构）

---

## 七、下一步

完成阶段1后，可以开始：

- **阶段2：配置集中化**（1周）
  - 将所有配置文件移动到 `config/`
  - 更新配置引用路径
  - 保持配置功能正常

---

## 八、附录

### 8.1 参考命令速查

```bash
# 创建目录结构
mkdir -p apps/web packages config scripts
# 注意：browser-extension 是独立的 Chrome addon，保持不变

# 移动文件（保持 Git 历史）
git mv src apps/web/src
git mv public apps/web/public
git mv index.html apps/web/index.html

# 安装依赖
pnpm install

# 开发服务器
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 验证 Git 历史
git log --follow --oneline apps/web/src/main.tsx
```

### 8.2 回滚方案

如果阶段1出现问题，可以快速回滚：

```bash
# 回滚到阶段1开始前
git reset --hard refactor/before-stage-1

# 或回滚到备份分支
git checkout refactor/backup-stage-1-YYYYMMDD
```

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27  
**状态：** 待实施

