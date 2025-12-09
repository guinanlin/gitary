# Gitary 项目结构文档 v1.0

## 一、项目概述

Gitary 是一个基于 Monorepo 架构的现代化 Web 应用，采用 pnpm workspace 管理多个包和应用，使用 Turbo 进行高性能构建和任务编排。项目提供 Notion 风格的编辑体验和 Excalidraw 绘图能力，支持与 GitHub/Gitee/GitCode 等 Git 仓库集成。

## 二、根目录结构

```
gitary/
├── package.json              # 根 package.json（workspace 配置）
├── pnpm-workspace.yaml       # pnpm workspace 配置
├── pnpm-lock.yaml            # 锁文件
├── turbo.json                # Turbo 构建配置
├── tsconfig.json             # 根 TypeScript 配置
├── README.md                 # 项目说明（英文）
├── README.zh-CN.md           # 项目说明（中文）
├── LICENSE                   # 许可证
├── .gitignore               # Git 忽略配置
├── .eslintrc.cjs            # ESLint 配置
│
├── docs/                     # 📚 文档目录
│   ├── project/             # 项目文档
│   ├── prd/                 # 产品需求文档
│   ├── issues/              # 问题记录
│   ├── requirements/        # 需求文档
│   └── ...
│
├── images/                   # 🖼️ 图片资源
│   └── screenshots/         # 截图
│
├── scripts/                  # 🔧 脚本目录
│   ├── migrate-*.js         # 迁移脚本
│   ├── update-imports.js    # 导入路径更新脚本
│   └── ...
│
├── apps/                     # 🚀 应用目录
│   ├── web/                 # Web 主应用
│   └── browser-extension/   # 浏览器扩展
│
└── packages/                 # 📦 包目录
    ├── ai-assistant-core/   # AI 助手核心包
    ├── app-toolkit/         # 应用工具包
    ├── git-auth/            # Git 认证包
    ├── git-provider/        # Git 提供者包
    ├── rx-bean/             # RxJS Bean 包
    └── rx-nested-bean/      # RxJS Nested Bean 包
```

## 三、apps/ 应用目录详解

### 3.1 apps/web/ - Web 主应用

```
apps/web/
├── package.json              # 应用特定的 package.json
├── index.html                # 入口 HTML
├── tsconfig.json             # 应用特定的 TS 配置（继承 config/）
├── tailwind.config.js        # Tailwind 配置（应用级）
├── postcss.config.js         # PostCSS 配置（应用级）
│
├── config/                   # ⚙️ 配置文件目录
│   ├── vite.config.ts       # Vite 配置
│   ├── tsconfig.base.json    # 基础 TypeScript 配置
│   ├── tsconfig.node.json    # Node TypeScript 配置
│   ├── tailwind.config.js    # Tailwind 配置
│   ├── postcss.config.js     # PostCSS 配置
│   ├── jest.config.js        # Jest 配置
│   ├── components.json       # shadcn/ui 配置
│   └── splitChunks.ts        # 代码分割配置
│
├── src/                      # 📝 应用源码
│   ├── main.tsx              # 应用入口
│   ├── vite-env.d.ts         # Vite 类型定义
│   │
│   ├── app/                  # 应用层（Application Layer）
│   │   └── dashboard/        # 仪表板页面
│   │
│   ├── components/           # 组件目录
│   │   ├── ui/              # UI 基础组件（shadcn/ui）
│   │   ├── ai-quote-cards.tsx
│   │   ├── ai-resume-chat.tsx
│   │   ├── custom-monaco-editor/
│   │   ├── excalidraw-ai-canvas.tsx
│   │   ├── form-builder/
│   │   ├── mind-map/
│   │   └── ...
│   │
│   ├── constants/            # 常量定义
│   │   ├── eventKeys.ts
│   │   └── storageKeys.ts
│   │
│   ├── core/                 # 核心工具
│   │   └── utils/
│   │
│   ├── features/             # 业务功能模块
│   │   ├── add-initial-indexed-db-space/
│   │   ├── bind-space-with-route/
│   │   ├── browser-extension-activity/
│   │   ├── git-commit-panel/
│   │   ├── gitary-brand-activity/
│   │   ├── global-sidecar-providers/
│   │   ├── providers/
│   │   ├── search/
│   │   └── show-current-space-pages-only/
│   │
│   ├── helpers/              # 辅助函数
│   │   ├── file-system.helper.ts
│   │   ├── space.helper.ts
│   │   └── hooks/
│   │
│   ├── hooks/                # 应用级 Hooks
│   │   ├── use-behavior-subject-value.ts
│   │   ├── use-document.ts
│   │   ├── use-i18n.ts
│   │   └── ...
│   │
│   ├── i18n/                 # 国际化
│   │   ├── config.ts
│   │   └── locales/
│   │
│   ├── monaco/               # Monaco Editor 配置
│   │   ├── customMonaco.ts
│   │   └── keys.ts
│   │
│   ├── plugins/              # 插件层（Plugin Layer）
│   │   ├── core/             # 核心插件
│   │   ├── migrations/       # 数据迁移插件
│   │   ├── services/         # 插件服务
│   │   ├── space/            # Space 相关插件
│   │   ├── utilities/        # 工具插件
│   │   └── widgets/          # 小部件插件
│   │
│   ├── services/             # 服务层（Service Layer）
│   │   ├── ai/               # AI 服务
│   │   ├── search/           # 搜索服务
│   │   ├── auth.service.ts
│   │   ├── space.service.tsx
│   │   ├── opener.service.ts
│   │   └── ...
│   │
│   ├── toolkit/              # 工具层（Toolkit Layer）
│   │   ├── components/       # 工具组件
│   │   ├── factories/        # 工厂函数
│   │   ├── types/           # 工具类型定义
│   │   ├── utils/           # 工具函数
│   │   └── vscode/          # VSCode API 适配
│   │
│   ├── types/                # 应用类型定义
│   │   ├── index.ts
│   │   └── resume.ts
│   │
│   └── xbook/                # xbook 框架核心
│       ├── common/
│       ├── constants/
│       ├── global-sidecar/
│       ├── hooks/
│       ├── services/
│       ├── ui/
│       └── utils/
│
├── libs/                     # 📚 第三方库封装层
│   ├── git-client.types.ts
│   ├── gitcode-api/         # GitCode API 封装
│   ├── gitee-api/           # Gitee API 封装
│   ├── github-api/          # GitHub API 封装
│   ├── index.ts
│   └── repo.ts
│
└── public/                   # 🌐 静态资源
    ├── manifest.json
    ├── robots.txt
    ├── sitemap.xml
    ├── logo.png
    ├── logo.svg
    └── ...
```

### 3.2 apps/browser-extension/ - 浏览器扩展

```
apps/browser-extension/
└── gitary-companion/         # Gitary 浏览器扩展
    ├── package.json
    ├── manifest.json         # 扩展清单
    ├── tsconfig.json
    ├── README.md
    ├── README.zh-CN.md
    │
    ├── src/                  # 扩展源码
    │   ├── background.ts     # 后台脚本
    │   ├── config.ts         # 配置
    │   ├── gitary.ts         # 核心逻辑
    │   ├── repo-parser.ts    # 仓库解析
    │   └── chrome-api.d.ts   # Chrome API 类型定义
    │
    ├── icons/                # 图标资源
    │   ├── icon.svg
    │   ├── icon16.png
    │   ├── icon32.png
    │   └── ...
    │
    └── _locales/             # 国际化资源
        ├── en/
        └── zh_CN/
```

## 四、packages/ 包目录详解

### 4.1 packages/ai-assistant-core/ - AI 助手核心包

```
packages/ai-assistant-core/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts
│   ├── core/                 # 核心功能
│   │   ├── agent.ts
│   │   ├── ai-service.ts
│   │   └── ...
│   ├── interfaces/           # 接口定义
│   ├── tools/                # 工具集合
│   │   ├── fs/
│   │   ├── weather/
│   │   └── workspace-context/
│   ├── types/                # 类型定义
│   └── utils/                # 工具函数
└── dist/                     # 构建产物
```

### 4.2 packages/git-provider/ - Git 提供者包

```
packages/git-provider/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts
│   ├── filesystem/           # 文件系统实现
│   ├── providers/            # 提供者实现
│   │   ├── github-provider.ts
│   │   └── gitee-provider.ts
│   └── types/                # 类型定义
├── examples/                 # 使用示例
└── dist/                     # 构建产物
```

### 4.3 packages/git-auth/ - Git 认证包

```
packages/git-auth/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts
│   ├── git-auth.ts           # 核心认证逻辑
│   ├── providers/           # 认证提供者
│   │   ├── github.ts
│   │   └── gitee.ts
│   ├── types.ts
│   └── utils.ts
└── examples/                 # 使用示例
```

### 4.4 packages/rx-bean/ 和 packages/rx-nested-bean/

```
packages/rx-bean/
├── package.json
└── src/
    └── index.ts

packages/rx-nested-bean/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    └── v2.ts
```

### 4.5 packages/app-toolkit/ - 应用工具包

```
packages/app-toolkit/
├── package.json
└── src/
    ├── index.ts
    └── controller/
```

## 五、架构分层说明

### 5.1 应用层（Application Layer）- `src/app/`

- **职责**：应用级别的页面和路由
- **示例**：`dashboard/page.tsx`

### 5.2 插件层（Plugin Layer）- `src/plugins/`

- **职责**：可插拔的功能模块
- **子目录**：
  - `core/` - 核心插件
  - `space/` - Space 相关插件
  - `widgets/` - 小部件插件
  - `migrations/` - 数据迁移插件
  - `utilities/` - 工具插件

### 5.3 服务层（Service Layer）- `src/services/`

- **职责**：业务逻辑和状态管理
- **主要服务**：
  - `ai/` - AI 服务
  - `auth.service.ts` - 认证服务
  - `space.service.tsx` - Space 服务
  - `opener.service.ts` - 打开器服务
  - `search/` - 搜索服务

### 5.4 工具层（Toolkit Layer）- `src/toolkit/`

- **职责**：底层工具和框架适配
- **子目录**：
  - `components/` - 工具组件
  - `factories/` - 工厂函数
  - `vscode/` - VSCode API 适配
  - `utils/` - 工具函数

### 5.5 xbook 框架 - `src/xbook/`

- **职责**：xbook 框架核心实现
- **子目录**：
  - `services/` - 框架服务
  - `ui/` - 框架 UI 组件
  - `hooks/` - 框架 Hooks
  - `global-sidecar/` - 全局侧边栏

## 六、路径别名配置

### 6.1 Vite 别名（`apps/web/config/vite.config.ts`）

```typescript
alias: [
  { find: "@", replacement: resolve(__dirname, "../src") },
  // 其他别名...
]
```

### 6.2 TypeScript 路径映射（`apps/web/config/tsconfig.base.json`）

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      // 其他路径映射...
    }
  }
}
```

## 七、构建和开发

### 7.1 Turbo 构建系统

项目使用 **Turbo** 作为构建系统，提供以下优势：

- **并行构建**：自动并行执行独立任务，充分利用多核 CPU
- **智能缓存**：基于文件哈希的增量构建，未变更的包自动使用缓存
- **依赖管理**：自动分析包依赖关系，按正确顺序执行构建
- **任务编排**：统一管理构建、开发、测试、检查等任务

### 7.2 开发命令

```bash
# 启动开发服务器（Turbo 并行启动）
pnpm dev

# 构建生产版本（Turbo 并行构建，自动管理依赖）
pnpm build

# 快速构建（只构建 web 应用）
pnpm build:fast

# 类型检查（Turbo 并行执行）
pnpm typecheck

# 代码检查（Turbo 并行执行）
pnpm lint

# 修复代码问题（Turbo 并行执行）
pnpm lint:fix
```

### 7.3 Monorepo 命令

```bash
# 构建所有包（Turbo 并行构建，自动管理依赖顺序）
pnpm build:all

# 检查所有包（Turbo 并行执行）
pnpm lint:all

# 修复所有包（Turbo 并行执行）
pnpm lint:fix:all

# 测试所有包（Turbo 并行执行）
pnpm test

# 清理所有包
pnpm clean
```

### 7.4 Turbo 高级命令

```bash
# 查看构建计划（不实际执行）
pnpm turbo build --dry-run

# 只构建特定包及其依赖
pnpm turbo build --filter=@gitary/web

# 强制重新构建（忽略缓存）
pnpm turbo build --force

# 查看缓存统计
pnpm turbo build --summarize
```

### 7.3 浏览器扩展命令

```bash
# 构建扩展
pnpm ext:gitary:build

# 监听模式
pnpm ext:gitary:watch

# 打包扩展
pnpm ext:gitary:pack
```

## 八、依赖关系

### 8.1 Workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### 8.2 包依赖关系

```
apps/web
├── @dty/ai-assistant-core (workspace:*)
├── app-toolkit (workspace:*)
├── rx-bean (workspace:*)
├── rx-nested-bean (workspace:*)
└── 其他外部依赖...

packages/ai-assistant-core
└── 独立包，无 workspace 依赖

packages/git-provider
└── 独立包，无 workspace 依赖

packages/git-auth
└── 独立包，无 workspace 依赖
```

### 8.3 Turbo 依赖管理

Turbo 自动分析包依赖关系，确保构建顺序正确：

- **构建顺序**：Turbo 会先构建 `@dty/ai-assistant-core`、`app-toolkit`、`rx-bean`、`rx-nested-bean`，然后再构建 `@gitary/web`
- **并行构建**：独立的包（如 `@dimstack/git-auth`、`@dimstack/git-provider`、`@dty/ai-assistant-core`）可以并行构建
- **增量构建**：未变更的包会使用缓存，大幅减少构建时间

## 九、配置文件位置

### 9.1 根目录配置

- `package.json` - 根 package.json（包含 Turbo 脚本）
- `pnpm-workspace.yaml` - Workspace 配置
- `turbo.json` - Turbo 构建配置（任务管道、缓存策略等）
- `tsconfig.json` - 根 TypeScript 配置
- `.eslintrc.cjs` - ESLint 配置
- `.gitignore` - Git 忽略配置（包含 `.turbo` 缓存目录）

### 9.2 应用级配置（`apps/web/config/`）

- `vite.config.ts` - Vite 构建配置
- `tsconfig.base.json` - TypeScript 基础配置
- `tsconfig.node.json` - Node TypeScript 配置
- `tailwind.config.js` - Tailwind CSS 配置
- `postcss.config.js` - PostCSS 配置
- `jest.config.js` - Jest 测试配置
- `components.json` - shadcn/ui 配置
- `splitChunks.ts` - 代码分割配置

### 9.3 应用级覆盖配置（`apps/web/`）

- `tsconfig.json` - 继承 `config/tsconfig.base.json`
- `tailwind.config.js` - 应用特定的 Tailwind 配置
- `postcss.config.js` - 应用特定的 PostCSS 配置

## 十、关键特性

### 10.1 技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite (rolldown-vite) + Turbo
- **Monorepo 管理**：pnpm workspace + Turbo
- **样式**：Tailwind CSS + SCSS
- **状态管理**：Zustand + RxJS
- **UI 组件库**：Radix UI + shadcn/ui
- **编辑器**：Monaco Editor + Zenmark Editor
- **绘图**：Excalidraw

### 10.2 核心功能

- **文件系统**：支持多种文件系统提供者（IndexedDB、Git、Weiyun）
- **AI 助手**：集成 AI 功能，支持工具调用
- **插件系统**：可插拔的插件架构
- **国际化**：支持多语言（中文、英文）
- **搜索**：全文搜索功能
- **Git 集成**：支持 GitHub、Gitee、GitCode

## 十一、项目状态

### 11.1 当前结构特点

- ✅ 已实现 Monorepo 架构
- ✅ 集成 Turbo 构建系统，支持并行构建和智能缓存
- ✅ 应用代码位于 `apps/web/`
- ✅ 浏览器扩展位于 `apps/browser-extension/`
- ✅ 配置文件集中在 `apps/web/config/`
- ✅ 第三方库封装在 `apps/web/libs/`
- ✅ 采用分层架构（app/plugin/service/toolkit）
- ✅ Turbo 自动管理包依赖关系和构建顺序

### 11.2 与未来规划的差异

- ⚠️ 配置文件在 `apps/web/config/` 而非根目录 `config/`
- ⚠️ 浏览器扩展在 `apps/browser-extension/` 而非 `extensions/`
- ⚠️ 库封装在 `apps/web/libs/` 而非 `apps/web/src/lib/`

## 十二、开发规范

### 12.1 文件命名

- **目录**：kebab-case（如：`git-commit-panel/`）
- **文件**：kebab-case（如：`auth.service.ts`）
- **组件**：PascalCase 组件名 + kebab-case 文件名（如：`Button` 组件放在 `button.tsx`）

### 12.2 导入规范

- 使用 `@/` 别名进行绝对路径导入
- 避免使用相对路径（`../../`）
- 直接从具体文件导入，避免通过 index 文件

### 12.3 代码组织

- 按功能模块组织代码
- 保持单一职责原则
- 组件、服务、工具分离
- 使用 TypeScript 严格模式

## 十三、Turbo 构建系统

### 13.1 Turbo 配置

Turbo 配置文件位于根目录 `turbo.json`，定义了以下任务：

- **build**：构建任务，自动管理依赖关系（`dependsOn: ["^build"]`）
- **dev**：开发任务，持久化运行（`persistent: true`），不使用缓存
- **typecheck**：类型检查任务，依赖构建完成
- **lint**：代码检查任务
- **test**：测试任务，依赖构建完成
- **clean**：清理任务，不使用缓存

### 13.2 Turbo 缓存机制

- **本地缓存**：构建结果存储在 `.turbo` 目录（已添加到 `.gitignore`）
- **缓存键**：基于文件内容哈希、环境变量、依赖关系生成
- **缓存命中**：未变更的包自动使用缓存，跳过构建
- **缓存失效**：文件变更、环境变量变更、依赖变更时自动失效

### 13.3 性能优势

使用 Turbo 后，项目构建性能显著提升：

- **全量构建**：并行执行，时间减少 60-80%
- **增量构建**：智能缓存，时间减少 90%+
- **开发启动**：并行启动，时间减少 50-75%
- **CI/CD**：只构建变更的包，时间减少 70-80%

### 13.4 依赖管理

Turbo 自动分析 `package.json` 中的 workspace 依赖，确保：

- 依赖包先于被依赖包构建
- 独立包并行构建
- 构建顺序正确，避免构建错误

---

**文档版本**：v1.1  
**创建日期**：2025-01-27  
**最后更新**：2025-01-27  
**基于项目实际结构生成，已集成 Turbo 构建系统**

