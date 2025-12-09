# 配置文件迁移方案 - 迁移到 config/ 目录

## 文档信息

- **文档版本：** v1.0
- **创建日期：** 2025-01-27
- **状态：** 待实施
- **预计时长：** 1-2 天

## 一、迁移目标

### 1.1 核心目标

1. **集中管理配置文件**
   - 将所有应用级构建配置文件迁移到 `config/` 目录
   - 统一配置管理，便于维护和版本控制

2. **保持功能正常运行**
   - 所有构建工具正常识别配置文件
   - 开发服务器正常启动
   - 构建流程正常执行
   - 类型检查通过

3. **保持 Git 历史完整**
   - 使用 `git mv` 保持文件历史
   - 确保代码审查和追溯能力

### 1.2 迁移范围

**需要迁移的文件（7个）：**
1. `vite.config.ts` → `config/vite.config.ts`
2. `splitChunks.ts` → `config/splitChunks.ts`
3. `tailwind.config.js` → `config/tailwind.config.js`
4. `postcss.config.js` → `config/postcss.config.js`
5. `jest.config.js` → `config/jest.config.js`
6. `tsconfig.node.json` → `config/tsconfig.node.json`
7. `components.json` → `config/components.json`

**需要特殊处理的文件（1个）：**
8. `tsconfig.json` → 创建 `config/tsconfig.base.json` + `apps/web/tsconfig.json`

**不迁移的文件（1个）：**
9. `pnpm-workspace.yaml` → 保留在根目录（pnpm 要求）

## 二、前置准备

### 2.1 环境检查

在执行迁移之前，确保：

- [ ] 当前代码已提交到 Git（或创建备份分支）
- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 开发服务器正常运行
- [ ] 类型检查通过

### 2.2 创建备份

```bash
# 创建备份分支
git checkout -b refactor/backup-config-migration-$(date +%Y%m%d)
git push origin refactor/backup-config-migration-$(date +%Y%m%d)

# 创建标签
git tag -a refactor/before-config-migration -m "配置文件迁移开始前的备份点"
git push origin refactor/before-config-migration

# 返回工作分支
git checkout dev  # 或你的工作分支
```

### 2.3 创建阶段分支

```bash
# 创建配置文件迁移工作分支
git checkout -b refactor/config-migration
```

## 三、详细迁移步骤

### 步骤 1：创建 config/ 目录结构（5分钟）

#### 1.1 创建目录

```bash
# 在项目根目录执行
mkdir -p config
```

#### 1.2 验证目录创建

```bash
# 验证目录已创建
ls -la config
```

#### 1.3 提交初始结构

```bash
git add config
git commit -m "chore: create config directory structure"
```

---

### 步骤 2：迁移独立配置文件（30分钟）

#### 2.1 迁移 splitChunks.ts

```bash
# 迁移文件（保持 Git 历史）
git mv splitChunks.ts config/splitChunks.ts
```

#### 2.2 迁移 tailwind.config.js

```bash
git mv tailwind.config.js config/tailwind.config.js
```

#### 2.3 迁移 postcss.config.js

```bash
git mv postcss.config.js config/postcss.config.js
```

#### 2.4 迁移 jest.config.js

```bash
git mv jest.config.js config/jest.config.js
```

#### 2.5 迁移 tsconfig.node.json

```bash
git mv tsconfig.node.json config/tsconfig.node.json
```

#### 2.6 迁移 components.json

```bash
git mv components.json config/components.json
```

#### 2.7 验证移动结果

```bash
# 检查移动后的结构
ls -la config/

# 验证 Git 历史
git log --follow --oneline config/splitChunks.ts | head -5
```

#### 2.8 提交独立配置文件迁移

```bash
git add config/
git commit -m "refactor: move standalone config files to config directory"
```

---

### 步骤 3：迁移 vite.config.ts（20分钟）

#### 3.1 迁移文件

```bash
git mv vite.config.ts config/vite.config.ts
```

#### 3.2 更新 vite.config.ts 中的路径引用

需要更新的内容：

**更新前：**
```typescript
import { dependencies } from "./package.json";
import { renderChunksWithStrategy } from "./splitChunks";
// ...
root: "apps/web",
// ...
replacement: resolve(__dirname, "apps/web/src"),
replacement: resolve(__dirname, "apps/web/libs"),
// ...
outDir: "../../dist",
input: resolve(__dirname, "apps/web/index.html"),
```

**更新后：**
```typescript
import { dependencies } from "../apps/web/package.json";  // 或 "../package.json"
import { renderChunksWithStrategy } from "./splitChunks";
// ...
root: "../apps/web",  // 相对路径需要调整
// ...
replacement: resolve(__dirname, "../apps/web/src"),
replacement: resolve(__dirname, "../apps/web/libs"),
// ...
outDir: "../../dist",  // 保持不变（相对于 apps/web）
input: resolve(__dirname, "../apps/web/index.html"),
```

**关键变更：**
- `__dirname` 现在指向 `config/` 目录
- 所有路径需要加上 `../` 前缀
- `root: "apps/web"` 改为 `root: "../apps/web"`
- `outDir` 的路径可能需要调整，取决于你想要输出到哪里

#### 3.3 验证配置语法

```bash
# 检查 TypeScript 语法（如果 vite.config.ts 是 .ts 文件）
node -e "import('./config/vite.config.ts').then(() => console.log('Vite config OK'))"
```

#### 3.4 提交 vite.config.ts 迁移

```bash
git add config/vite.config.ts
git commit -m "refactor: move vite.config.ts to config directory and update paths"
```

---

### 步骤 4：处理 TypeScript 配置（30分钟）

#### 4.1 创建 config/tsconfig.base.json

创建 `config/tsconfig.base.json`，包含共享的基础配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable",
      "ESNext.WeakRef"
    ],
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
    "noEmitOnError": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "xbook/*": [
        "../apps/web/src/xbook/*"
      ],
      "xbook": [
        "../apps/web/src/xbook"
      ],
      "@/*": [
        "../apps/web/src/*"
      ],
      "libs/*": [
        "../apps/web/libs/*"
      ]
    }
  }
}
```

#### 4.2 创建 apps/web/tsconfig.json

创建 `apps/web/tsconfig.json`，继承基础配置：

```json
{
  "extends": "../../config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "xbook/*": [
        "./src/xbook/*"
      ],
      "xbook": [
        "./src/xbook"
      ],
      "@/*": [
        "./src/*"
      ],
      "libs/*": [
        "./libs/*"
      ]
    }
  },
  "include": [
    "src/**/*",
    "libs/**/*",
    "index.html"
  ],
  "references": [
    {
      "path": "../../config/tsconfig.node.json"
    }
  ]
}
```

#### 4.3 更新根目录 tsconfig.json（可选方案）

**方案 A：保留根目录 tsconfig.json 作为 workspace 配置**

```json
{
  "files": [],
  "references": [
    {
      "path": "./apps/web"
    }
  ]
}
```

**方案 B：删除根目录 tsconfig.json**

如果完全迁移到应用级别，可以删除根目录的 `tsconfig.json`。

#### 4.4 更新 tsconfig.node.json 引用路径

由于 `tsconfig.node.json` 已迁移到 `config/`，需要在 `apps/web/tsconfig.json` 中更新引用：

```json
{
  "references": [
    {
      "path": "../../config/tsconfig.node.json"
    }
  ]
}
```

但需要检查 `config/tsconfig.node.json` 的内容，确保路径正确。

#### 4.5 更新 config/tsconfig.node.json

检查并更新 `config/tsconfig.node.json` 中的 `include` 路径：

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "../package.json",
    "vite.config.ts",
    "splitChunks.ts"
  ]
}
```

#### 4.6 验证 TypeScript 配置

```bash
# 验证基础配置
tsc --showConfig --project config/tsconfig.base.json | head -20

# 验证应用配置
tsc --showConfig --project apps/web/tsconfig.json | head -20
```

#### 4.7 提交 TypeScript 配置迁移

```bash
git add config/tsconfig.base.json apps/web/tsconfig.json
# 如果删除或修改了根目录 tsconfig.json
git add tsconfig.json  # 或 git rm tsconfig.json
git commit -m "refactor: create tsconfig.base.json and apps/web/tsconfig.json"
```

---

### 步骤 5：更新配置文件中的路径引用（30分钟）

#### 5.1 更新 config/tailwind.config.js

检查并更新 `content` 路径（如果配置中的路径是相对于根目录的）：

**更新前：**
```javascript
content: [
  './apps/web/pages/**/*.{ts,tsx}',
  './apps/web/components/**/*.{ts,tsx}',
  './apps/web/app/**/*.{ts,tsx}',
  './apps/web/src/**/*.{ts,tsx}',
],
```

**更新后：**
```javascript
content: [
  '../apps/web/pages/**/*.{ts,tsx}',
  '../apps/web/components/**/*.{ts,tsx}',
  '../apps/web/app/**/*.{ts,tsx}',
  '../apps/web/src/**/*.{ts,tsx}',
],
```

#### 5.2 更新 config/jest.config.js

更新路径映射：

**更新前：**
```javascript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
},
```

**更新后：**
```javascript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/../apps/web/src/$1",
},
```

#### 5.3 更新 config/components.json

更新路径引用：

**更新前：**
```json
{
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/xbook/ui/styles/globals.scss",
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/toolkit/utils/shadcn-utils"
  }
}
```

**更新后（迁移到 config/ 目录后）：**
```json
{
  "tailwind": {
    "config": "tailwind.config.js",  // 相对路径，因为都在 config/ 目录下
    "css": "../apps/web/src/xbook/ui/styles/globals.scss",  // 相对路径
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/toolkit/utils/shadcn-utils"
  }
}
```

**说明：**
- `config` 路径：因为 `tailwind.config.js` 也在 `config/` 目录下，使用相对路径 `tailwind.config.js` 或 `./tailwind.config.js`
- `css` 路径：需要指向 `apps/web/src/xbook/ui/styles/globals.scss`，使用相对路径 `../apps/web/src/xbook/ui/styles/globals.scss`
- `aliases`：保持原样，因为这些是 TypeScript 路径别名，由 `tsconfig.json` 控制

**使用 shadcn CLI 时的注意事项：**
- shadcn CLI 默认在当前目录查找 `components.json`
- 如果 `components.json` 在 `config/` 目录，需要：
  - 在 `config/` 目录下执行命令，或
  - 使用 `--config` 参数：`npx shadcn-ui@latest add --config config/components.json`

#### 5.4 提交路径更新

```bash
git add config/
git commit -m "refactor: update path references in config files"
```

---

### 步骤 6：更新 package.json 脚本（20分钟）

#### 6.1 更新构建脚本

**更新前：**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "... && vite build",
    "build:fast": "vite build",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

**更新后：**
```json
{
  "scripts": {
    "dev": "vite --config config/vite.config.ts",
    "build": "... && vite build --config config/vite.config.ts",
    "build:fast": "vite build --config config/vite.config.ts",
    "test": "jest --config config/jest.config.js",
    "typecheck": "tsc --noEmit --project apps/web/tsconfig.json",
    "preview": "vite preview --config config/vite.config.ts"
  }
}
```

**注意：**
- 如果使用 pnpm workspace，可能需要在 `apps/web/package.json` 中配置这些脚本
- 检查是否需要更新工作目录（`--cwd` 或工作区过滤器）

#### 6.2 验证 package.json 格式

```bash
# 检查 JSON 格式
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
```

#### 6.3 提交脚本更新

```bash
git add package.json
git commit -m "refactor: update scripts to reference config directory"
```

---

### 步骤 7：验证与测试（1小时）

#### 7.1 安装依赖

```bash
# 清理并重新安装依赖
pnpm install
```

**预期结果：**
- 所有依赖安装成功
- 没有版本冲突
- workspace 链接正确

#### 7.2 验证开发服务器

```bash
# 启动开发服务器
pnpm dev
```

**检查项：**
- [ ] 服务器成功启动
- [ ] 没有编译错误
- [ ] 页面可以正常访问
- [ ] 热更新正常工作
- [ ] 路径别名解析正确

#### 7.3 验证构建

```bash
# 执行构建
pnpm build
```

**检查项：**
- [ ] 构建成功完成
- [ ] 没有构建错误
- [ ] 构建产物在预期位置
- [ ] 构建产物大小合理

#### 7.4 验证类型检查

```bash
# 执行类型检查
pnpm typecheck
```

**检查项：**
- [ ] 类型检查通过
- [ ] 没有类型错误
- [ ] 路径别名解析正确

#### 7.5 验证测试

```bash
# 执行测试
pnpm test
```

**检查项：**
- [ ] 测试执行成功
- [ ] 路径映射正确
- [ ] 测试覆盖率正常

#### 7.6 验证样式构建

检查 Tailwind CSS 和 PostCSS 是否正常工作：

```bash
# 启动开发服务器，检查样式
pnpm dev
# 在浏览器中检查样式是否正确应用
```

#### 7.7 提交验证结果

```bash
git add .
git commit -m "test: verify config migration - all tests passing"
```

---

## 四、常见问题与解决方案

### 4.1 路径解析问题

**问题：** 构建工具找不到配置文件

**可能原因：**
- 配置文件路径错误
- 相对路径计算错误
- `__dirname` 指向错误的位置

**解决方案：**
```bash
# 1. 检查配置文件是否存在
ls -la config/

# 2. 检查 package.json 脚本路径
cat package.json | grep -A 2 "scripts"

# 3. 验证相对路径
# 在 config/ 目录下执行
pwd
# 应该在项目根目录/config
```

### 4.2 TypeScript 配置问题

**问题：** TypeScript 找不到类型定义或路径别名

**可能原因：**
- `tsconfig.json` 继承路径错误
- `baseUrl` 配置错误
- `paths` 配置路径错误

**解决方案：**
```bash
# 1. 验证配置继承
tsc --showConfig --project apps/web/tsconfig.json

# 2. 检查路径映射
cat apps/web/tsconfig.json | grep -A 10 "paths"

# 3. 验证基础配置
tsc --showConfig --project config/tsconfig.base.json
```

### 4.3 构建工具配置问题

**问题：** Vite/Jest 等工具无法识别配置

**可能原因：**
- 配置文件路径指定错误
- 配置文件语法错误
- 工作目录不正确

**解决方案：**
```bash
# 1. 检查配置文件语法
node -e "require('./config/vite.config.ts')"

# 2. 验证脚本命令
cat package.json | grep "vite\|jest"

# 3. 尝试直接指定配置文件
vite --config config/vite.config.ts
```

### 4.4 Tailwind CSS 配置问题

**问题：** 样式没有正确应用

**可能原因：**
- `content` 路径错误
- PostCSS 配置路径错误
- Tailwind 配置文件位置不对

**解决方案：**
```bash
# 1. 检查 content 路径
cat config/tailwind.config.js | grep -A 5 "content"

# 2. 验证 PostCSS 配置
cat config/postcss.config.js

# 3. 检查 Vite 是否正确加载 PostCSS
```

---

## 五、验收检查清单

### 5.1 目录结构检查

- [ ] `config/` 目录存在
- [ ] `config/vite.config.ts` 存在
- [ ] `config/splitChunks.ts` 存在
- [ ] `config/tailwind.config.js` 存在
- [ ] `config/postcss.config.js` 存在
- [ ] `config/jest.config.js` 存在
- [ ] `config/tsconfig.node.json` 存在
- [ ] `config/components.json` 存在
- [ ] `config/tsconfig.base.json` 存在
- [ ] `apps/web/tsconfig.json` 存在

### 5.2 配置文件检查

- [ ] `vite.config.ts` 路径引用正确
- [ ] `tsconfig.json` 继承关系正确
- [ ] `tailwind.config.js` 路径正确
- [ ] `jest.config.js` 路径映射正确
- [ ] `components.json` 路径引用正确

### 5.3 脚本检查

- [ ] `package.json` 脚本路径正确
- [ ] `pnpm dev` 能正常启动
- [ ] `pnpm build` 能正常构建
- [ ] `pnpm typecheck` 类型检查通过
- [ ] `pnpm test` 测试执行成功

### 5.4 功能验证检查

- [ ] 开发服务器启动成功
- [ ] 构建成功完成
- [ ] 类型检查通过
- [ ] 测试执行成功
- [ ] 样式正确应用
- [ ] 路径别名解析正确

### 5.5 Git 历史检查

- [ ] 文件历史保持完整
- [ ] 可以使用 `git log --follow` 追溯文件历史
- [ ] 所有移动操作使用 `git mv`

---

## 六、完成迁移

### 6.1 最终提交

```bash
# 确保所有变更已提交
git status

# 如果有未提交的变更
git add .
git commit -m "refactor: complete config files migration to config directory"
```

### 6.2 创建里程碑标签

```bash
# 创建配置文件迁移完成标签
git tag -a refactor/config-migration-complete -m "配置文件迁移完成：所有配置文件已迁移到 config 目录"
git push origin refactor/config-migration-complete
```

### 6.3 合并到主分支（可选）

如果验证通过，可以合并到主分支：

```bash
# 切换到主分支
git checkout dev  # 或你的主分支

# 合并配置文件迁移分支
git merge refactor/config-migration

# 推送到远程
git push origin dev
```

---

## 七、回滚方案

如果迁移出现问题，可以快速回滚：

```bash
# 回滚到迁移开始前
git reset --hard refactor/before-config-migration

# 或回滚到备份分支
git checkout refactor/backup-config-migration-YYYYMMDD
```

---

## 八、后续工作

完成配置文件迁移后，可以考虑：

1. **优化配置结构**
   - 进一步拆分配置文件
   - 创建环境特定配置（dev/prod）

2. **文档更新**
   - 更新 README.md
   - 更新开发指南
   - 更新架构文档

3. **CI/CD 更新**
   - 更新构建脚本
   - 更新部署配置

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27  
**状态：** 待实施

