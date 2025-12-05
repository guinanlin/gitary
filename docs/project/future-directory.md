# Gitary 项目未来目录结构方案（Monorepo 架构）

## 一、设计目标

### 1.1 核心目标

1. **根目录极简化**：根目录只保留必要的配置文件和管理文件
2. **清晰的 Monorepo 结构**：apps/、packages/、extensions/ 清晰分离
3. **配置集中管理**：所有配置文件统一到 config/ 目录
4. **便于扩展**：支持未来添加新应用、新包、新扩展

### 1.2 设计原则

- **单一职责**：每个目录职责明确
- **易于导航**：文件查找路径直观
- **便于维护**：配置集中，依赖清晰
- **渐进式迁移**：分阶段进行，不破坏现有功能

## 二、目标根目录结构

```
gitary/
├── package.json              # 根 package.json（workspace 配置）
├── pnpm-workspace.yaml       # pnpm workspace 配置
├── pnpm-lock.yaml            # 锁文件
├── README.md                 # 项目说明
├── README.zh-CN.md           # 中文说明
├── LICENSE                   # 许可证
├── .gitignore               # Git 忽略配置
├── .gitattributes           # Git 属性（可选）
│
├── docs/                     # 📚 文档目录（保持不变）
│   ├── project/             # 项目文档
│   │   ├── directory-restructure-proposal.md
│   │   ├── future-directory.md
│   │   └── ...
│   ├── prd/                 # 产品需求文档
│   ├── issues/              # 问题记录
│   ├── requirements/        # 需求文档
│   └── ...
│
├── apps/                     # 🚀 应用目录（新建）
│   └── web/                 # Web 应用（主应用）
│       ├── package.json     # 应用特定的 package.json
│       ├── src/             # 应用源码
│       │   ├── app/         # 应用层（按分层架构重构后）
│       │   ├── plugin/      # 插件层
│       │   ├── service/     # 服务层
│       │   ├── toolkit/     # 工具层
│       │   └── lib/         # 库封装层
│       ├── public/          # 静态资源
│       ├── dist/            # 构建产物（可选：移到 .dist/web/）
│       ├── index.html       # 入口 HTML
│       ├── vite.config.ts   # 应用特定的 Vite 配置（继承 config/）
│       └── tsconfig.json    # 应用特定的 TS 配置（继承 config/）
│
├── packages/                 # 📦 包目录（已存在，保持不变）
│   ├── ai-assistant-core/   # AI 助手核心包
│   ├── app-toolkit/         # 应用工具包
│   ├── git-auth/            # Git 认证包
│   ├── git-provider/        # Git 提供者包
│   ├── rx-bean/             # RxJS Bean 包
│   ├── rx-nested-bean/      # RxJS Nested Bean 包
│   └── ...
│
├── extensions/               # 🔌 扩展目录（重命名）
│   └── browser-extension/   # 浏览器扩展
│       └── gitary-companion/
│           ├── package.json
│           ├── src/
│           ├── manifest.json
│           └── ...
│
├── config/                   # ⚙️ 配置文件目录（新建）
│   ├── vite.config.ts       # 主应用 Vite 配置
│   ├── tsconfig.base.json    # 基础 TypeScript 配置
│   ├── tailwind.config.js    # Tailwind 配置
│   ├── postcss.config.js     # PostCSS 配置
│   ├── jest.config.js        # Jest 配置
│   ├── components.json       # shadcn/ui 配置
│   └── splitChunks.ts       # 代码分割配置
│
└── scripts/                  # 🔧 脚本目录（新建，可选）
    ├── build.js              # 构建脚本
    ├── migrate.js            # 迁移脚本
    └── ...
```

## 三、详细目录结构

### 3.1 apps/web/ 结构

```
apps/web/
├── package.json
├── index.html
├── vite.config.ts            # 继承 config/vite.config.ts
├── tsconfig.json             # 继承 config/tsconfig.base.json
│
├── src/
│   ├── app/                  # 应用层 (Application Layer)
│   │   ├── main.tsx          # 应用入口
│   │   ├── components/       # UI组件
│   │   │   ├── ui/           # 基础UI组件 (shadcn/ui)
│   │   │   └── business/     # 业务组件
│   │   ├── features/         # 业务功能模块
│   │   ├── pages/            # 页面组件
│   │   ├── hooks/            # 应用级Hooks
│   │   ├── i18n/             # 国际化
│   │   ├── constants/        # 常量定义
│   │   ├── types/            # 应用类型定义
│   │   └── config/           # 应用配置
│   │
│   ├── plugin/               # 插件层 (Plugin Layer)
│   │   ├── core/             # 核心插件
│   │   ├── space/            # Space相关插件
│   │   ├── auth/             # 认证插件
│   │   ├── widgets/          # 小部件插件
│   │   ├── migrations/       # 数据迁移插件
│   │   └── utilities/        # 工具插件
│   │
│   ├── service/              # 服务层 (Service Layer)
│   │   ├── space/            # Space服务
│   │   ├── auth/             # 认证服务
│   │   ├── file-system/      # 文件系统服务
│   │   ├── ai/               # AI服务
│   │   ├── search/           # 搜索服务
│   │   ├── staging/          # 暂存服务
│   │   ├── opener/           # 打开器服务
│   │   └── setting/          # 设置服务
│   │
│   ├── toolkit/              # 工具层 (Toolkit Layer)
│   │   ├── xbook/            # xbook框架核心
│   │   ├── factories/         # 工厂函数
│   │   ├── components/        # 工具组件
│   │   ├── utils/            # 工具函数
│   │   ├── vscode/           # VSCode API适配
│   │   └── types/            # 工具类型定义
│   │
│   └── lib/                  # 第三方库封装层
│       ├── gitcode-api/      # GitCode API封装
│       ├── gitee-api/        # Gitee API封装
│       ├── github-api/       # GitHub API封装
│       └── repo.ts           # 仓库工具
│
├── public/                   # 静态资源
│   ├── manifest.json
│   ├── robots.txt
│   ├── sitemap.xml
│   └── ...
│
└── dist/                     # 构建产物（可选：移到 .dist/web/）
```

### 3.2 config/ 结构

```
config/
├── vite.config.ts            # 主应用 Vite 配置
├── tsconfig.base.json         # 基础 TypeScript 配置
├── tailwind.config.js         # Tailwind 配置
├── postcss.config.js          # PostCSS 配置
├── jest.config.js             # Jest 配置
├── components.json            # shadcn/ui 配置
└── splitChunks.ts             # 代码分割配置
```

### 3.3 packages/ 结构（保持不变）

```
packages/
├── ai-assistant-core/        # AI 助手核心包
├── app-toolkit/              # 应用工具包
├── git-auth/                 # Git 认证包
├── git-provider/             # Git 提供者包
├── rx-bean/                  # RxJS Bean 包
└── rx-nested-bean/           # RxJS Nested Bean 包
```

### 3.4 extensions/ 结构

```
extensions/
└── browser-extension/         # 浏览器扩展
    └── gitary-companion/
        ├── package.json
        ├── src/
        ├── manifest.json
        ├── icons/
        └── _locales/
```

## 四、迁移映射表

| 当前路径 | 目标路径 | 说明 |
|---------|---------|------|
| `src/` | `apps/web/src/` | 主应用源码 |
| `public/` | `apps/web/public/` | 静态资源 |
| `index.html` | `apps/web/index.html` | 入口 HTML |
| `dist/` | `apps/web/dist/` 或 `.dist/web/` | 构建产物 |
| `vite.config.ts` | `config/vite.config.ts` | Vite 配置 |
| `tsconfig.json` | `config/tsconfig.base.json` + `apps/web/tsconfig.json` | TS 配置 |
| `tsconfig.node.json` | `config/tsconfig.node.json` | Node TS 配置 |
| `tailwind.config.js` | `config/tailwind.config.js` | Tailwind 配置 |
| `postcss.config.js` | `config/postcss.config.js` | PostCSS 配置 |
| `jest.config.js` | `config/jest.config.js` | Jest 配置 |
| `components.json` | `config/components.json` | shadcn/ui 配置 |
| `splitChunks.ts` | `config/splitChunks.ts` | 代码分割配置 |
| `browser-extension/` | `extensions/browser-extension/` | 浏览器扩展 |
| `libs/` | `apps/web/src/lib/` 或 `packages/shared-libs/` | 库封装 |
| `images/` | `apps/web/public/images/` 或 `docs/images/` | 图片资源 |
| `packages/` | `packages/` | 保持不变 |
| `docs/` | `docs/` | 保持不变 |

## 五、配置文件调整

### 5.1 根目录 package.json

```json
{
  "name": "gitary-monorepo",
  "private": true,
  "version": "0.0.0",
  "description": "Notion-like editing + Excalidraw drawing for your Git repositories",
  "license": "MIT",
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
    "@types/node": "^20.5.6",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "cross-env": "^7.0.3",
    "eslint": "^8.45.0",
    "typescript": "^5.0.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 5.2 apps/web/package.json

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
    "lint:fix": "eslint . --ext ts,tsx --report-unused-disable-directives --fix"
  },
  "dependencies": {
    "@dty/ai-assistant-core": "workspace:*",
    "@ag-ui/client": "^0.0.41",
    "@babel/standalone": "^7.26.2",
    "@chakra-ui/icons": "^2.1.0",
    "@chakra-ui/react": "^2.8.0",
    "@emotion/css": "^11.11.2",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@excalidraw/excalidraw": "^0.18.0",
    "@google/genai": "^1.30.0",
    "@monaco-editor/react": "^4.6.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "rxjs": "^7.8.1",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "sass": "^1.66.1",
    "tailwindcss": "^3.4.4",
    "vite": "npm:rolldown-vite@latest",
    "vite-plugin-monaco-editor": "^1.1.0"
  }
}
```

### 5.3 config/vite.config.ts

```typescript
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { dependencies } from "../apps/web/package.json";
import { renderChunksWithStrategy } from "./splitChunks";
import monacoEditorPluginRaw from "vite-plugin-monaco-editor";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    (monacoEditorPluginRaw as any).default
      ? (monacoEditorPluginRaw as any).default({
          languageWorkers: [
            "editorWorkerService",
            "css",
            "html",
            "json",
            "typescript",
          ],
        })
      : (monacoEditorPluginRaw as any)({
          languageWorkers: [
            "editorWorkerService",
            "css",
            "html",
            "json",
            "typescript",
          ],
        }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "../apps/web/src"),
      "@app": resolve(__dirname, "../apps/web/src/app"),
      "@plugin": resolve(__dirname, "../apps/web/src/plugin"),
      "@service": resolve(__dirname, "../apps/web/src/service"),
      "@toolkit": resolve(__dirname, "../apps/web/src/toolkit"),
      "@lib": resolve(__dirname, "../apps/web/src/lib"),
      "@shared": resolve(__dirname, "../apps/web/src/shared"),
      "xbook": resolve(__dirname, "../apps/web/src/toolkit/xbook"),
      "libs": resolve(__dirname, "../apps/web/src/lib"),
      "@gitary/ai-assistant-core": resolve(__dirname, "../packages/ai-assistant-core/src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    minify: "esbuild",
    outDir: resolve(__dirname, "../apps/web/dist"),
    rollupOptions: {
      input: resolve(__dirname, "../apps/web/index.html"),
      output: {
        manualChunks: renderChunksWithStrategy(dependencies),
      },
    },
  },
});
```

### 5.4 config/tsconfig.base.json

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
  }
}
```

### 5.5 apps/web/tsconfig.json

```json
{
  "extends": "../../config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@plugin/*": ["./src/plugin/*"],
      "@service/*": ["./src/service/*"],
      "@toolkit/*": ["./src/toolkit/*"],
      "@lib/*": ["./src/lib/*"],
      "@shared/*": ["./src/shared/*"],
      "xbook/*": ["./src/toolkit/xbook/*"],
      "xbook": ["./src/toolkit/xbook"],
      "libs/*": ["./src/lib/*"]
    }
  },
  "include": [
    "src",
    "index.html"
  ],
  "references": [
    {
      "path": "../../config/tsconfig.node.json"
    }
  ]
}
```

## 六、迁移步骤

### 阶段一：准备阶段（1-2天）

1. **创建新目录结构**
   ```bash
   mkdir -p apps/web
   mkdir -p config
   mkdir -p extensions
   mkdir -p scripts
   ```

2. **更新根目录 package.json**
   - 配置 workspaces
   - 更新 scripts 命令

3. **创建应用 package.json**
   - 创建 `apps/web/package.json`
   - 迁移应用特定的依赖和脚本

### 阶段二：迁移应用代码（3-5天）

1. **移动源码目录**
   ```bash
   git mv src apps/web/src
   git mv public apps/web/public
   git mv index.html apps/web/index.html
   ```

2. **移动配置文件**
   ```bash
   git mv vite.config.ts config/
   git mv tailwind.config.js config/
   git mv postcss.config.js config/
   git mv jest.config.js config/
   git mv components.json config/
   git mv splitChunks.ts config/
   git mv tsconfig.node.json config/
   ```

3. **创建应用特定配置**
   - 创建 `apps/web/tsconfig.json`（继承 base）
   - 创建 `apps/web/vite.config.ts`（引用 config/）

4. **更新配置文件中的路径引用**
   - 更新 Vite 配置中的路径
   - 更新 TypeScript 配置中的路径
   - 更新其他配置文件中的路径

### 阶段三：迁移扩展和库（1-2天）

1. **移动浏览器扩展**
   ```bash
   git mv browser-extension extensions/browser-extension
   ```

2. **移动库封装**
   ```bash
   git mv libs apps/web/src/lib
   ```

3. **移动图片资源**
   ```bash
   git mv images apps/web/public/images
   # 或
   git mv images docs/images
   ```

### 阶段四：更新引用和测试（2-3天）

1. **更新所有导入路径**
   - 使用自动化脚本批量替换
   - 手动检查关键文件

2. **更新构建配置**
   - 更新 Vite 配置
   - 更新 TypeScript 配置
   - 更新其他构建工具配置

3. **测试功能**
   - 运行开发服务器
   - 运行构建命令
   - 测试所有功能模块

4. **更新 CI/CD 配置**
   - 更新构建路径
   - 更新部署脚本

## 七、优势分析

### 7.1 根目录清晰化

**优化前：**
```
gitary/
├── src/
├── public/
├── packages/
├── browser-extension/
├── libs/
├── docs/
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── jest.config.js
├── components.json
├── splitChunks.ts
├── index.html
└── ... (20+ 个文件/目录)
```

**优化后：**
```
gitary/
├── package.json
├── pnpm-workspace.yaml
├── README.md
├── LICENSE
├── docs/
├── apps/
├── packages/
├── extensions/
├── config/
└── scripts/
```

### 7.2 更好的 Monorepo 支持

- ✅ 清晰的 apps/、packages/、extensions/ 分离
- ✅ 每个应用独立构建和部署
- ✅ 便于扩展新应用（如 mobile、desktop）
- ✅ 包依赖关系更清晰

### 7.3 配置集中管理

- ✅ 所有配置文件在 `config/` 目录
- ✅ 便于维护和复用
- ✅ 减少配置重复
- ✅ 统一配置标准

### 7.4 更灵活的构建

- ✅ 每个应用独立构建
- ✅ 可以单独部署
- ✅ 支持并行构建
- ✅ 更好的缓存策略

## 八、注意事项

### 8.1 路径别名更新

- 所有 `@/` 引用需要调整
- Vite 和 TypeScript 配置都需要更新
- 建议使用自动化脚本批量替换

### 8.2 构建脚本调整

- 构建路径变化
- CI/CD 配置需要更新
- 部署脚本需要调整

### 8.3 Git 历史保持

- 使用 `git mv` 保持历史
- 或使用 `git log --follow` 追踪文件历史
- 建议在独立分支进行重构

### 8.4 依赖关系

- 确保 workspace 依赖正确配置
- 检查包之间的依赖关系
- 更新内部包的引用路径

## 九、性能影响评估

### 9.1 运行时性能

**结论：无影响**

- 目录结构只是文件组织方式，不影响代码执行
- Vite/Rollup 会将所有模块打包成 bundle
- 运行时只关心 bundle 内容

### 9.2 构建性能

**结论：影响可忽略（< 1%）**

- 路径别名解析时间略有增加
- 现代构建工具优化良好
- 影响可忽略不计

### 9.3 性能优化机会

**结论：可能带来优化**

- 更精细的代码分割策略
- 更清晰的懒加载边界
- 更好的 tree shaking 效果

## 十、实施建议

### 10.1 重构时机

- ✅ 建议与性能优化一起进行
- ✅ 可以在重构过程中优化代码分割策略
- ✅ 可以在重构过程中实施懒加载优化

### 10.2 重构策略

1. **分阶段进行**：降低风险
2. **充分测试**：确保功能正常
3. **及时文档**：保持团队同步
4. **使用自动化**：减少人工错误

### 10.3 验收标准

1. **功能完整性**：所有功能正常工作
2. **代码质量**：导入路径正确，无循环依赖
3. **文档完整性**：架构文档更新
4. **性能指标**：构建时间和 bundle 大小无明显变化

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27

