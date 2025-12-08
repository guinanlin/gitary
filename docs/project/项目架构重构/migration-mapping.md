# 重构迁移映射表

## 文档信息

- **文档版本：** v1.0
- **创建日期：** 2025-01-27
- **适用范围：** 所有重构阶段

## 一、Monorepo 架构迁移映射（阶段1-2）

### 1.1 应用代码迁移

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `src/` | `apps/web/src/` | 阶段1 | 主应用源码 |
| `public/` | `apps/web/public/` | 阶段1 | 静态资源 |
| `index.html` | `apps/web/index.html` | 阶段1 | 入口 HTML |
| `dist/` | `apps/web/dist/` | 阶段1 | 构建产物（保持不变） |

### 1.2 扩展迁移

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `browser-extension/` | `browser-extension/` | - | 浏览器扩展（独立项目，保持不变） |

### 1.3 配置文件迁移（阶段2）

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `vite.config.ts` | `config/vite.config.ts` | 阶段2 | Vite 配置 |
| `tsconfig.json` | `config/tsconfig.base.json` + `apps/web/tsconfig.json` | 阶段2 | TS 配置（拆分为基础配置和应用配置） |
| `tsconfig.node.json` | `config/tsconfig.node.json` | 阶段2 | Node TS 配置 |
| `tailwind.config.js` | `config/tailwind.config.js` | 阶段2 | Tailwind 配置 |
| `postcss.config.js` | `config/postcss.config.js` | 阶段2 | PostCSS 配置 |
| `jest.config.js` | `config/jest.config.js` | 阶段2 | Jest 配置 |
| `components.json` | `config/components.json` | 阶段2 | shadcn/ui 配置 |
| `splitChunks.ts` | `config/splitChunks.ts` | 阶段2 | 代码分割配置 |

### 1.4 资源文件迁移

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `libs/` | `apps/web/src/lib/` | 阶段3 | 第三方库封装 |
| `images/` | `apps/web/public/images/` 或 `docs/images/` | 阶段1 | 图片资源（可选） |

### 1.5 保持不变

| 路径 | 说明 |
|------|------|
| `packages/` | 包目录保持不变 |
| `docs/` | 文档目录保持不变 |

---

## 二、分层架构迁移映射（阶段3-5）

### 2.1 工具层迁移（阶段3）

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `apps/web/src/xbook/` | `apps/web/src/toolkit/xbook/` | 阶段3 | xbook 框架 |
| `apps/web/src/helpers/` | `apps/web/src/toolkit/utils/helpers/` | 阶段3 | 辅助函数 |
| `apps/web/src/monaco/` | `apps/web/src/toolkit/monaco/` | 阶段3 | Monaco 编辑器工具 |
| `libs/` | `apps/web/src/lib/` | 阶段3 | 第三方库封装 |

### 2.2 服务层迁移（阶段4）

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `apps/web/src/services/` | `apps/web/src/service/` | 阶段4 | 服务层（重命名） |
| `apps/web/src/services/*-file-system.provider.ts` | `apps/web/src/service/file-system/providers/*-file-system.provider.ts` | 阶段4 | 文件系统提供者统一管理 |
| `apps/web/src/plugins/services/` | `apps/web/src/service/` | 阶段4 | 整合插件中的服务到服务层 |

**文件系统提供者详细映射：**
- `gite-repo-file-system.provider.ts` → `service/file-system/providers/gite-repo-file-system.provider.ts`
- `weiyun-file-system.provider.ts` → `service/file-system/providers/weiyun-file-system.provider.ts`
- `indexed-db-file-system.provider.ts` → `service/file-system/providers/indexed-db-file-system.provider.ts`
- `space-file-system-provider-proxy.ts` → `service/file-system/space-file-system-provider-proxy.ts`

### 2.3 插件层迁移（阶段4）

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `apps/web/src/plugins/` | `apps/web/src/plugin/` | 阶段4 | 插件层（重命名） |
| `apps/web/src/plugins/core/` | `apps/web/src/plugin/core/` | 阶段4 | 核心插件 |
| `apps/web/src/plugins/space/` | `apps/web/src/plugin/space/` | 阶段4 | Space 相关插件 |
| `apps/web/src/plugins/services/auth/` | `apps/web/src/plugin/auth/` | 阶段4 | 认证插件（从 services 迁移） |
| `apps/web/src/plugins/widgets/` | `apps/web/src/plugin/widgets/` | 阶段4 | 小部件插件 |
| `apps/web/src/plugins/migrations/` | `apps/web/src/plugin/migrations/` | 阶段4 | 数据迁移插件 |
| `apps/web/src/plugins/utilities/` | `apps/web/src/plugin/utilities/` | 阶段4 | 工具插件 |

### 2.4 应用层迁移（阶段5）

| 当前路径 | 目标路径 | 阶段 | 说明 |
|---------|---------|------|------|
| `apps/web/src/main.tsx` | `apps/web/src/app/main.tsx` | 阶段5 | 应用入口 |
| `apps/web/src/components/` | `apps/web/src/app/components/` | 阶段5 | UI 组件 |
| `apps/web/src/features/` | `apps/web/src/app/features/` | 阶段5 | 业务功能模块 |
| `apps/web/src/app/dashboard/` | `apps/web/src/app/pages/dashboard/` | 阶段5 | 页面组件（重命名） |
| `apps/web/src/hooks/` | `apps/web/src/app/hooks/` | 阶段5 | 应用级 Hooks |
| `apps/web/src/i18n/` | `apps/web/src/app/i18n/` | 阶段5 | 国际化 |
| `apps/web/src/constants/` | `apps/web/src/app/constants/` | 阶段5 | 常量定义 |
| `apps/web/src/types/` | `apps/web/src/app/types/` | 阶段5 | 应用类型定义 |
| `apps/web/src/core/utils/domain-config.ts` | `apps/web/src/app/config/domain-config.ts` | 阶段5 | 应用配置 |

---

## 三、路径别名迁移映射

### 3.1 当前路径别名

| 别名 | 当前路径 | 说明 |
|------|---------|------|
| `@/` | `src/` | 源码根目录 |
| `xbook` | `src/xbook/` | xbook 框架 |
| `libs` | `libs/` | 第三方库封装 |

### 3.2 目标路径别名（阶段2后）

| 别名 | 目标路径 | 说明 |
|------|---------|------|
| `@/` | `apps/web/src/` 或 `apps/web/src/app/` | 源码根目录（根据实际情况） |
| `@app/` | `apps/web/src/app/` | 应用层 |
| `@plugin/` | `apps/web/src/plugin/` | 插件层 |
| `@service/` | `apps/web/src/service/` | 服务层 |
| `@toolkit/` | `apps/web/src/toolkit/` | 工具层 |
| `@lib/` | `apps/web/src/lib/` | 库封装层 |
| `@shared/` | `apps/web/src/shared/` | 共享资源 |
| `xbook` | `apps/web/src/toolkit/xbook/` | xbook 框架（保持向后兼容） |
| `libs` | `apps/web/src/lib/` | 第三方库封装（保持向后兼容） |

### 3.3 导入路径迁移示例

#### 工具层导入路径迁移

**迁移前：**
```typescript
import { something } from '@/xbook/services/pluginService';
import { helper } from '@/helpers/file-system.helper';
import { monacoConfig } from '@/monaco/customMonaco';
```

**迁移后：**
```typescript
import { something } from '@toolkit/xbook/services/pluginService';
// 或保持向后兼容
import { something } from 'xbook/services/pluginService';

import { helper } from '@toolkit/utils/helpers/file-system.helper';
import { monacoConfig } from '@toolkit/monaco/customMonaco';
```

#### 库封装导入路径迁移

**迁移前：**
```typescript
import { GitHubClient } from 'libs/github-api/github-client';
import { GiteeClient } from 'libs/gitee-api/gitee-client';
```

**迁移后：**
```typescript
import { GitHubClient } from '@lib/github-api/github-client';
// 或保持向后兼容
import { GitHubClient } from 'libs/github-api/github-client';
```

#### 服务层导入路径迁移

**迁移前：**
```typescript
import { spaceService } from '@/services/space.service';
import { authService } from '@/services/auth.service';
```

**迁移后：**
```typescript
import { spaceService } from '@service/space/space.service';
import { authService } from '@service/auth/auth.service';
```

#### 插件层导入路径迁移

**迁移前：**
```typescript
import { CorePlugin } from '@/plugins/core';
import { SpacePlugin } from '@/plugins/space';
```

**迁移后：**
```typescript
import { CorePlugin } from '@plugin/core';
import { SpacePlugin } from '@plugin/space';
```

#### 应用层导入路径迁移

**迁移前：**
```typescript
import { Button } from '@/components/ui/button';
import { SearchFeature } from '@/features/search';
import { useI18n } from '@/hooks/use-i18n';
```

**迁移后：**
```typescript
import { Button } from '@app/components/ui/button';
import { SearchFeature } from '@app/features/search';
import { useI18n } from '@app/hooks/use-i18n';
```

---

## 四、配置文件迁移映射

### 4.1 Vite 配置迁移

**迁移前：** `vite.config.ts`（根目录）
```typescript
resolve: {
  alias: {
    "@": resolve(__dirname, "src"),
    "xbook": resolve(__dirname, "src/xbook"),
    "libs": resolve(__dirname, "libs"),
  }
}
```

**迁移后：** `config/vite.config.ts`
```typescript
resolve: {
  alias: {
    "@": resolve(__dirname, "../apps/web/src"),
    "@app": resolve(__dirname, "../apps/web/src/app"),
    "@plugin": resolve(__dirname, "../apps/web/src/plugin"),
    "@service": resolve(__dirname, "../apps/web/src/service"),
    "@toolkit": resolve(__dirname, "../apps/web/src/toolkit"),
    "@lib": resolve(__dirname, "../apps/web/src/lib"),
    "xbook": resolve(__dirname, "../apps/web/src/toolkit/xbook"),
    "libs": resolve(__dirname, "../apps/web/src/lib"),
  }
}
```

### 4.2 TypeScript 配置迁移

**迁移前：** `tsconfig.json`（根目录）
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "xbook/*": ["./src/xbook/*"],
      "libs/*": ["./libs/*"]
    }
  }
}
```

**迁移后：** `config/tsconfig.base.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./apps/web/src/*"],
      "@app/*": ["./apps/web/src/app/*"],
      "@plugin/*": ["./apps/web/src/plugin/*"],
      "@service/*": ["./apps/web/src/service/*"],
      "@toolkit/*": ["./apps/web/src/toolkit/*"],
      "@lib/*": ["./apps/web/src/lib/*"],
      "xbook/*": ["./apps/web/src/toolkit/xbook/*"],
      "libs/*": ["./apps/web/src/lib/*"]
    }
  }
}
```

**apps/web/tsconfig.json**
```json
{
  "extends": "../../config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      // ...
    }
  }
}
```

---

## 五、package.json 迁移映射

### 5.1 根目录 package.json

**主要变更：**
- 添加 `workspaces` 配置
- 更新 `scripts` 命令，使用 `pnpm --filter` 过滤

### 5.2 apps/web/package.json

**主要变更：**
- 从根目录 `package.json` 迁移应用特定依赖
- 更新 `scripts` 命令，引用 `config/` 下的配置文件

---

## 六、迁移检查清单

### 6.1 文件移动检查

- [ ] 所有文件使用 `git mv` 移动（保持 Git 历史）
- [ ] 目标目录已创建
- [ ] 文件移动后功能正常

### 6.2 导入路径更新检查

- [ ] 所有导入路径已更新
- [ ] 路径别名配置正确
- [ ] TypeScript 类型检查通过
- [ ] 构建成功

### 6.3 配置文件更新检查

- [ ] Vite 配置路径正确
- [ ] TypeScript 配置路径正确
- [ ] 其他工具配置路径正确

---

## 七、迁移顺序说明

### 7.1 阶段1：Monorepo 基础架构
- 移动应用代码到 `apps/web/`
- 移动浏览器扩展到 `extensions/`
- 创建基本目录结构

### 7.2 阶段2：配置集中化
- 移动配置文件到 `config/`
- 创建配置继承关系
- 更新配置引用

### 7.3 阶段3：底层工具层迁移
- 迁移工具层代码
- 迁移库封装
- 更新导入路径

### 7.4 阶段4：服务层与插件层迁移
- 迁移服务层代码
- 迁移插件层代码
- 清理服务与插件的混合

### 7.5 阶段5：应用层迁移
- 迁移应用层代码
- 更新入口文件
- 更新所有导入路径

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27

