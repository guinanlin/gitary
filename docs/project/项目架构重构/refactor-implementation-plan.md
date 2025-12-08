# 项目目录结构重构 - 分阶段推进计划

## 文档信息

- **文档版本：** v1.0
- **创建日期：** 2025-01-27
- **最后更新：** 2025-01-27
- **状态：** 规划中

## 一、总体策略

### 1.1 重构目标

本次重构整合两个方案：
1. **Monorepo 架构重构**：将项目改造为标准的 Monorepo 结构
2. **分层架构重构**：按照分层架构重新组织代码结构

### 1.2 实施策略

采用**"先 Monorepo，后分层"**的策略：
- **阶段1-2**：先完成 Monorepo 架构重构（影响范围小，风险低）
- **阶段3-6**：在 Monorepo 基础上完成分层架构重构

### 1.3 核心原则

- **渐进式迁移**：分阶段进行，不破坏现有功能
- **保持 Git 历史**：使用 `git mv` 保持文件历史
- **充分测试**：每个阶段完成后立即验证
- **文档同步**：每个阶段同步更新文档

## 二、阶段划分总览

```
阶段0：准备与规划（1周）
  ↓
阶段1：Monorepo 基础架构（2周）
  ↓
阶段2：配置集中化（1周）
  ↓
阶段3：底层工具层迁移（2周）
  ↓
阶段4：服务层与插件层迁移（2周）
  ↓
阶段5：应用层迁移（2周）
  ↓
阶段6：清理与优化（1周）
```

**总时长：约 11 周（2.5 个月）**

## 三、详细阶段计划

### 阶段0：准备与规划（1周）

#### 目标
- 完成重构前的准备工作
- 制定详细迁移脚本
- 建立测试验证机制

#### 任务清单

##### 0.1 创建迁移脚本（2天）

创建以下脚本文件：

```bash
scripts/
├── migrate-monorepo.js      # Monorepo迁移脚本
├── migrate-layers.js         # 分层架构迁移脚本
├── update-imports.js          # 批量更新导入路径
└── verify-migration.js        # 验证迁移结果
```

**脚本功能：**
- `migrate-monorepo.js`：自动化 Monorepo 结构迁移
- `migrate-layers.js`：自动化分层架构迁移
- `update-imports.js`：批量更新导入路径（支持路径别名）
- `verify-migration.js`：验证迁移结果（检查导入路径、构建等）

##### 0.2 建立测试检查点（1天）

创建测试清单：

- **功能测试清单**
  - [ ] 应用启动正常
  - [ ] 所有页面可访问
  - [ ] 核心功能正常
  - [ ] 构建成功

- **构建验证清单**
  - [ ] `pnpm dev` 正常运行
  - [ ] `pnpm build` 构建成功
  - [ ] `pnpm typecheck` 类型检查通过
  - [ ] 无构建警告和错误

- **导入路径检查清单**
  - [ ] 所有导入路径正确
  - [ ] 路径别名配置正确
  - [ ] 无循环依赖
  - [ ] TypeScript 类型检查通过

##### 0.3 创建备份分支（1天）

```bash
# 创建备份分支
git checkout -b refactor/backup-$(date +%Y%m%d)
git push origin refactor/backup-$(date +%Y%m%d)

# 创建标签
git tag -a refactor/before-refactor -m "重构前的备份点"
git push origin refactor/before-refactor
```

##### 0.4 文档准备（2天）

- 更新迁移映射表（基于 `future-directory.md` 和 `directory-restructure-proposal.md`）
- 准备回滚方案文档
- 团队沟通文档（说明重构计划、时间安排、注意事项）

#### 验收标准

- [ ] 所有迁移脚本就绪并测试通过
- [ ] 测试清单完整
- [ ] 备份分支和标签创建
- [ ] 团队已了解计划并达成共识

---

### 阶段1：Monorepo 基础架构（2周）

#### 目标
- 建立标准 Monorepo 结构
- 移动应用代码到 `apps/web/`
- 保持功能正常运行

#### 任务清单

##### 1.1 创建目录结构（1天）

```bash
mkdir -p apps/web
mkdir -p config
mkdir -p scripts
# 注意：browser-extension 是独立的 Chrome addon，保持不变
```

##### 1.2 移动应用代码（3天）

使用 `git mv` 保持 Git 历史：

```bash
# 移动源码目录
git mv src apps/web/src
git mv public apps/web/public
git mv index.html apps/web/index.html

# 注意：browser-extension 是独立的 Chrome addon，保持不变

# 移动图片资源（可选）
git mv images apps/web/public/images
# 或
git mv images docs/images
```

##### 1.3 更新根目录 package.json（1天）

更新根目录 `package.json`：

```json
{
  "name": "gitary-monorepo",
  "private": true,
  "version": "0.0.0",
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
    "ext:gitary:build": "pnpm -C browser-extension/gitary-companion run pack",
    "ext:gitary:watch": "pnpm -C browser-extension/gitary-companion run build:watch",
    "ext:gitary:pack": "pnpm -C browser-extension/gitary-companion run pack"
  }
}
```

##### 1.4 创建 apps/web/package.json（1天）

创建 `apps/web/package.json`：

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
    // ... 其他依赖从根 package.json 迁移
  },
  "devDependencies": {
    // ... 开发依赖从根 package.json 迁移
  }
}
```

##### 1.5 更新构建配置（2天）

临时更新配置文件路径（后续会移动到 `config/`）：

- 更新 `vite.config.ts` 中的路径引用
- 更新 `tsconfig.json` 中的路径引用
- 更新 `index.html` 中的入口路径

##### 1.6 验证与测试（2天）

- 运行 `pnpm install` 安装依赖
- 运行 `pnpm dev` 启动开发服务器
- 运行 `pnpm build` 测试构建
- 功能测试（所有核心功能）

#### 验收标准

- [ ] 应用在 `apps/web/` 下正常运行
- [ ] 开发服务器启动成功
- [ ] 构建成功
- [ ] 所有功能正常
- [ ] Git 历史保持完整

#### 里程碑

✅ **里程碑1**：Monorepo 架构完成，应用正常运行

---

### 阶段2：配置集中化（1周）

#### 目标
- 将所有配置文件移动到 `config/`
- 更新配置引用路径
- 保持配置功能正常

#### 任务清单

##### 2.1 移动配置文件（1天）

```bash
git mv vite.config.ts config/
git mv tailwind.config.js config/
git mv postcss.config.js config/
git mv jest.config.js config/
git mv components.json config/
git mv splitChunks.ts config/
git mv tsconfig.node.json config/
```

##### 2.2 创建基础配置（2天）

**config/tsconfig.base.json**：
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

**apps/web/tsconfig.json**：
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
  "include": ["src", "index.html"],
  "references": [
    {
      "path": "../../config/tsconfig.node.json"
    }
  ]
}
```

**apps/web/vite.config.ts**：
```typescript
import { defineConfig } from "vite";
import baseConfig from "../../config/vite.config";

export default defineConfig({
  ...baseConfig,
  // 应用特定的配置覆盖
});
```

##### 2.3 更新配置引用（2天）

- 更新 `config/vite.config.ts` 中的路径别名
- 更新 `config/tsconfig.base.json` 中的路径
- 更新其他工具的配置引用（Tailwind、PostCSS 等）

##### 2.4 验证配置（2天）

- 验证构建配置
- 验证开发服务器
- 验证类型检查
- 验证样式构建

#### 验收标准

- [ ] 所有配置文件在 `config/` 下
- [ ] 配置继承关系正确
- [ ] 构建和开发正常
- [ ] 类型检查通过

---

### 阶段3：底层工具层迁移（2周）

#### 目标
- 迁移工具层代码到 `toolkit/`
- 迁移库封装到 `lib/`
- 更新所有导入路径

#### 任务清单

##### 3.1 迁移 xbook 框架（3天）

```bash
git mv apps/web/src/xbook apps/web/src/toolkit/xbook
```

**更新导入路径：**
- 所有 `from 'xbook/...'` → `from '@toolkit/xbook/...'` 或 `from 'xbook/...'`（保持别名）
- 更新路径别名配置

##### 3.2 迁移 helpers（2天）

```bash
git mv apps/web/src/helpers apps/web/src/toolkit/utils/helpers
```

**更新导入路径：**
- 所有 `from '@/helpers/...'` → `from '@toolkit/utils/helpers/...'`

##### 3.3 迁移 monaco（1天）

```bash
git mv apps/web/src/monaco apps/web/src/toolkit/monaco
```

**更新导入路径：**
- 所有 `from '@/monaco/...'` → `from '@toolkit/monaco/...'`

##### 3.4 迁移库封装（2天）

```bash
git mv libs apps/web/src/lib
```

**更新导入路径：**
- 所有 `from 'libs/...'` → `from '@lib/...'`
- 更新路径别名配置

##### 3.5 更新路径别名（1天）

更新以下配置文件：
- `config/vite.config.ts`
- `config/tsconfig.base.json`
- `apps/web/tsconfig.json`

##### 3.6 验证与测试（3天）

- 运行类型检查
- 运行构建
- 功能测试（重点测试工具层相关功能）

#### 验收标准

- [ ] 所有工具层代码在 `toolkit/` 下
- [ ] 所有库封装在 `lib/` 下
- [ ] 导入路径全部更新
- [ ] 构建和功能正常
- [ ] 类型检查通过

#### 里程碑

✅ **里程碑2**：底层迁移完成，工具层清晰

---

### 阶段4：服务层与插件层迁移（2周）

#### 目标
- 统一服务层到 `service/`
- 统一插件层到 `plugin/`
- 清理服务与插件的混合

#### 任务清单

##### 4.1 迁移服务层（3天）

```bash
# 重命名 services 为 service
git mv apps/web/src/services apps/web/src/service

# 整合 plugins/services 到 service
# 需要逐个分析并迁移
```

**迁移策略：**
- 分析 `plugins/services/` 中的服务
- 根据服务类型迁移到对应的 `service/` 子目录
- 更新所有服务导入路径

##### 4.2 迁移文件系统提供者（2天）

统一所有文件系统提供者：

```bash
# 移动所有 *-file-system.provider.ts 到统一目录
# 例如：
# apps/web/src/service/gite-repo-file-system.provider.ts
# → apps/web/src/service/file-system/providers/gite-repo-file-system.provider.ts
```

**更新导入路径：**
- 更新所有文件系统提供者的导入路径

##### 4.3 迁移插件层（3天）

```bash
git mv apps/web/src/plugins apps/web/src/plugin
```

**清理工作：**
- 清理插件中的服务代码（已迁移到 `service/`）
- 更新所有插件导入路径

##### 4.4 更新路径别名（1天）

更新以下路径别名：
- `@service` → `apps/web/src/service`
- `@plugin` → `apps/web/src/plugin`

##### 4.5 验证与测试（3天）

- 验证服务层功能
- 验证插件层功能
- 完整功能测试
- 检查服务与插件的依赖关系

#### 验收标准

- [ ] 所有服务在 `service/` 下
- [ ] 所有插件在 `plugin/` 下
- [ ] 服务与插件职责清晰
- [ ] 功能正常
- [ ] 无循环依赖

---

### 阶段5：应用层迁移（2周）

#### 目标
- 统一应用层代码到 `app/`
- 移动入口文件
- 更新所有导入路径

#### 任务清单

##### 5.1 迁移应用入口（1天）

```bash
git mv apps/web/src/main.tsx apps/web/src/app/main.tsx
```

**更新引用：**
- 更新 `index.html` 中的入口路径

##### 5.2 迁移组件（2天）

```bash
git mv apps/web/src/components apps/web/src/app/components
```

**更新导入路径：**
- 所有 `from '@/components/...'` → `from '@app/components/...'`

##### 5.3 迁移功能模块（2天）

```bash
git mv apps/web/src/features apps/web/src/app/features
```

**更新导入路径：**
- 所有 `from '@/features/...'` → `from '@app/features/...'`

##### 5.4 迁移其他应用层代码（2天）

```bash
git mv apps/web/src/hooks apps/web/src/app/hooks
git mv apps/web/src/i18n apps/web/src/app/i18n
git mv apps/web/src/constants apps/web/src/app/constants
git mv apps/web/src/types apps/web/src/app/types
```

**更新导入路径：**
- 更新所有相关导入路径

##### 5.5 迁移配置（1天）

```bash
git mv apps/web/src/core/utils/domain-config.ts apps/web/src/app/config/domain-config.ts
```

##### 5.6 更新路径别名（1天）

更新以下路径别名：
- `@app` → `apps/web/src/app`
- `@/` → `apps/web/src/app`（或保持为 `apps/web/src`，根据实际情况）

##### 5.7 验证与测试（3天）

- 完整功能测试
- 构建验证
- 性能测试
- 检查所有导入路径

#### 验收标准

- [ ] 所有应用层代码在 `app/` 下
- [ ] 入口文件正确
- [ ] 所有功能正常
- [ ] 构建成功
- [ ] 性能无明显下降

#### 里程碑

✅ **里程碑3**：所有迁移完成，功能正常

---

### 阶段6：清理与优化（1周）

#### 目标
- 删除旧目录和文件
- 优化导入路径
- 更新文档

#### 任务清单

##### 6.1 清理旧文件（1天）

- 删除空的旧目录
- 清理未使用的文件
- 清理临时文件
- 检查 `.gitignore` 配置

##### 6.2 优化导入路径（2天）

- 统一使用路径别名
- 优化相对路径导入
- 检查循环依赖
- 使用工具自动修复导入路径

##### 6.3 代码审查（2天）

- 检查所有导入路径
- 验证依赖关系
- 优化代码结构
- 检查代码质量

##### 6.4 文档更新（2天）

- 更新架构文档
  - 更新 `future-directory.md`
  - 更新 `directory-restructure-proposal.md`
- 更新开发指南
- 更新 README
- 更新贡献指南

#### 验收标准

- [ ] 无旧文件残留
- [ ] 导入路径统一
- [ ] 文档完整
- [ ] 代码质量达标
- [ ] 无循环依赖

#### 里程碑

✅ **里程碑4**：重构完成，文档更新

---

## 四、风险控制措施

### 4.1 分支策略

每个阶段在独立分支进行：

```bash
# 阶段1
git checkout -b refactor/stage-1-monorepo
# ... 完成工作 ...
git checkout main
git merge refactor/stage-1-monorepo

# 阶段2
git checkout -b refactor/stage-2-config
# ... 依此类推
```

### 4.2 回滚方案

**标签策略：**
```bash
# 每个阶段完成后创建标签
git tag -a refactor/stage-1-complete -m "阶段1完成"
git tag -a refactor/stage-2-complete -m "阶段2完成"
# ... 依此类推
```

**快速回滚：**
```bash
# 回滚到指定阶段
git reset --hard refactor/stage-1-complete
```

### 4.3 测试策略

**自动化测试：**
- 每个阶段完成后运行完整测试套件
- 使用 CI/CD 自动验证

**手动测试：**
- 关键功能手动验证
- 性能测试
- 用户体验测试

### 4.4 进度跟踪

- 使用 Issue 跟踪任务
- 每日进度同步
- 周报总结
- 里程碑评审

---

## 五、时间估算

| 阶段 | 时间 | 累计时间 | 优先级 |
|------|------|----------|--------|
| 阶段0：准备与规划 | 1周 | 1周 | 高 |
| 阶段1：Monorepo 基础架构 | 2周 | 3周 | 高 |
| 阶段2：配置集中化 | 1周 | 4周 | 高 |
| 阶段3：底层工具层迁移 | 2周 | 6周 | 中 |
| 阶段4：服务层与插件层迁移 | 2周 | 8周 | 中 |
| 阶段5：应用层迁移 | 2周 | 10周 | 中 |
| 阶段6：清理与优化 | 1周 | 11周 | 低 |

**总计：约 11 周（2.5 个月）**

### 5.1 关键里程碑时间点

- **里程碑1（3周后）**：Monorepo 架构完成，应用正常运行
- **里程碑2（6周后）**：底层迁移完成，工具层清晰
- **里程碑3（10周后）**：所有迁移完成，功能正常
- **里程碑4（11周后）**：重构完成，文档更新

---

## 六、关键决策点

### 6.1 路径别名策略

**决策：** 保持向后兼容的路径别名

- `@/` → `apps/web/src`（或 `apps/web/src/app`，根据实际情况）
- `@app/` → `apps/web/src/app`
- `@plugin/` → `apps/web/src/plugin`
- `@service/` → `apps/web/src/service`
- `@toolkit/` → `apps/web/src/toolkit`
- `@lib/` → `apps/web/src/lib`
- `xbook` → `apps/web/src/toolkit/xbook`（保持向后兼容）

### 6.2 构建产物位置

**决策：** 构建产物保留在 `apps/web/dist/`

- 便于应用独立部署
- 符合 Monorepo 最佳实践

### 6.3 静态资源位置

**决策：** 静态资源保留在 `apps/web/public/`

- 符合应用结构
- 便于管理

---

## 七、实施建议

### 7.1 优先级建议

1. **高优先级（必须完成）**：阶段0-2
   - 这些阶段完成后，项目结构已经大幅改善
   - 可以暂停后续阶段，根据实际情况决定是否继续

2. **中优先级（建议完成）**：阶段3-5
   - 完成这些阶段后，分层架构清晰
   - 代码组织更加合理

3. **低优先级（可选）**：阶段6
   - 优化和清理工作
   - 可以根据实际情况调整

### 7.2 并行工作建议

**可以部分并行的工作：**
- 阶段3-5 可以部分并行，但需要注意依赖关系
- 文档更新可以在每个阶段完成后立即进行

**不能并行的工作：**
- 每个阶段必须按顺序完成
- 前一个阶段验证通过后才能开始下一个阶段

### 7.3 小步快跑建议

- **每个阶段完成后立即测试和验证**
- **不要等到所有阶段完成再测试**
- **及时发现问题，及时修复**

### 7.4 文档先行建议

- **每个阶段同步更新文档**
- **保持文档与代码同步**
- **便于团队协作和知识传承**

---

## 八、验收标准总结

### 8.1 功能完整性

- [ ] 所有功能正常工作
- [ ] 无功能回归
- [ ] 性能无明显下降

### 8.2 代码质量

- [ ] 导入路径正确
- [ ] 无循环依赖
- [ ] 类型检查通过
- [ ] 代码结构清晰

### 8.3 文档完整性

- [ ] 架构文档更新
- [ ] 开发指南更新
- [ ] README 更新
- [ ] 迁移文档完整

### 8.4 构建和部署

- [ ] 构建成功
- [ ] 开发服务器正常
- [ ] 类型检查通过
- [ ] 部署流程正常

---

## 九、后续工作

### 9.1 持续优化

- 根据实际使用情况优化目录结构
- 持续改进代码组织
- 优化构建性能

### 9.2 团队培训

- 组织团队培训，讲解新结构
- 更新开发规范
- 分享最佳实践

### 9.3 监控和反馈

- 收集团队反馈
- 监控构建性能
- 持续改进

---

## 十、附录

### 10.1 参考文档

- `docs/project/future-directory.md` - Monorepo 架构方案
- `docs/project/directory-restructure-proposal.md` - 分层架构重构方案

### 10.2 相关工具

- **Git**：版本控制和文件移动
- **pnpm**：Monorepo 包管理
- **TypeScript**：类型检查
- **Vite**：构建工具
- **ESLint**：代码检查

### 10.3 联系方式

如有问题或建议，请：
- 创建 Issue 讨论
- 联系项目维护者
- 更新本文档

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27  
**状态：** 规划中

