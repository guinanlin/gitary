# Gitary 项目目录结构重构建议书

## 一、问题分析

### 1.1 当前目录结构问题

虽然项目的分层架构逻辑清晰，但实际的目录结构存在以下问题：

#### 问题一：应用层分散
- `app/` 目录只有 `dashboard/`，应用入口 `main.tsx` 在根目录
- `components/`、`features/`、`hooks/`、`i18n/`、`types/` 等应用层内容都在根目录
- 应用层职责不明确，文件分散

#### 问题二：服务层混乱
- `services/` 在根目录
- `plugins/services/` 也在根目录
- 服务职责分散，难以统一管理

#### 问题三：工具层不清晰
- `toolkit/` 和 `xbook/` 分离，但 `xbook` 本质是工具层的一部分
- `helpers/`、`core/` 职责不清，与 `toolkit/` 关系不明
- 工具层边界模糊

#### 问题四：插件层位置不当
- `plugins/` 在根目录，但包含 `services/` 子目录
- 插件层和服务层混合，职责不清

#### 问题五：命名不一致
- 有些用复数（`services/`、`plugins/`），有些用单数（`core/`）
- 命名风格不统一

### 1.2 影响分析

**开发体验问题：**
- 新成员难以快速定位文件
- 文件查找效率低
- 代码组织不直观

**维护成本问题：**
- 修改影响范围不明确
- 依赖关系难以追踪
- 重构风险高

**扩展性问题：**
- 新增功能时不知道放在哪里
- 目录结构缺乏指导性
- 容易产生技术债务

## 二、重构目标

### 2.1 核心目标

1. **清晰的层级结构**：严格按照分层架构组织目录
2. **统一的命名规范**：使用单数形式，保持一致性
3. **明确的职责边界**：每个目录职责单一、清晰
4. **易于导航**：文件查找路径直观、可预测

### 2.2 设计原则

- **单一职责**：每个目录只负责一个明确的职责
- **依赖方向**：上层依赖下层，避免循环依赖
- **命名规范**：使用单数形式，语义清晰
- **渐进式重构**：分阶段进行，不破坏现有功能

## 三、重构方案

### 3.1 目标目录结构

```
src/
├── app/                          # 应用层 (Application Layer)
│   ├── main.tsx                  # 应用入口
│   ├── components/               # UI组件
│   │   ├── ui/                   # 基础UI组件 (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   └── business/             # 业务组件
│   │       ├── ai-quote-cards.tsx
│   │       ├── excalidraw-ai-canvas.tsx
│   │       └── ...
│   ├── features/                 # 业务功能模块
│   │   ├── search/               # 搜索功能
│   │   ├── git-commit-panel/     # Git提交面板
│   │   ├── browser-extension-activity/
│   │   └── ...
│   ├── pages/                    # 页面组件
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── hooks/                    # 应用级Hooks
│   │   ├── use-i18n.ts
│   │   ├── use-mobile.tsx
│   │   └── ...
│   ├── i18n/                     # 国际化
│   │   ├── config.ts
│   │   ├── utils.ts
│   │   └── locales/
│   ├── constants/                # 常量定义
│   │   ├── eventKeys.ts
│   │   └── storageKeys.ts
│   ├── types/                    # 应用类型定义
│   │   ├── index.ts
│   │   └── resume.ts
│   └── config/                   # 应用配置
│       └── domain-config.ts
│
├── plugin/                        # 插件层 (Plugin Layer)
│   ├── core/                     # 核心插件
│   │   ├── base/                 # 基础插件
│   │   ├── common-utility-providers/
│   │   └── index.tsx
│   ├── space/                    # Space相关插件
│   │   ├── addSpace/             # 添加Space插件
│   │   ├── displaySpaces/       # 显示Space插件
│   │   ├── folderTreeService/    # 文件夹树服务插件
│   │   ├── platforms/            # 平台注册插件
│   │   ├── provideFileSystems/   # 文件系统提供插件
│   │   └── spaceService/         # Space服务插件
│   ├── auth/                     # 认证插件
│   │   └── providers/            # 认证提供者
│   │       ├── github/
│   │       ├── gitee/
│   │       ├── gitcode/
│   │       └── weiyun/
│   ├── widgets/                  # 小部件插件
│   ├── migrations/               # 数据迁移插件
│   │   ├── migration-20240518/
│   │   └── migration-20240712/
│   └── utilities/                # 工具插件
│       ├── checkUrlParamAndQuickOpen.tsx
│       ├── clearLocalCache.tsx
│       └── theme.tsx
│
├── service/                      # 服务层 (Service Layer)
│   ├── space/                    # Space服务
│   │   ├── space.service.tsx
│   │   ├── space.service.interface.ts
│   │   └── space-platform.registry.ts
│   ├── auth/                     # 认证服务
│   │   ├── auth.service.ts
│   │   └── auth.service.interface.ts
│   ├── file-system/              # 文件系统服务
│   │   ├── providers/            # 文件系统提供者
│   │   │   ├── git-repo-file-system.provider.ts
│   │   │   ├── weiyun-file-system.provider.ts
│   │   │   ├── indexed-db-file-system.provider.ts
│   │   │   └── space-file-system-provider-proxy.ts
│   │   ├── folder-tree.service.ts
│   │   └── file-system.service.ts
│   ├── ai/                       # AI服务
│   │   ├── ai-agent-runner.ts
│   │   └── ...
│   ├── search/                   # 搜索服务
│   │   ├── provider-source.ts
│   │   └── ...
│   ├── staging/                  # 暂存服务
│   │   └── staging.service.ts
│   ├── opener/                   # 打开器服务
│   │   └── opener.service.ts
│   └── setting/                  # 设置服务
│       └── setting.service.ts
│
├── toolkit/                      # 工具层 (Toolkit Layer)
│   ├── xbook/                    # xbook框架核心
│   │   ├── services/             # xbook服务
│   │   │   ├── pluginService.ts
│   │   │   ├── eventBus.ts
│   │   │   ├── commandService.ts
│   │   │   └── ...
│   │   ├── ui/                   # xbook UI组件
│   │   ├── common/               # xbook通用工具
│   │   │   └── createPlugin.ts
│   │   ├── hooks/                # xbook Hooks
│   │   ├── constants/            # xbook常量
│   │   └── utils/                # xbook工具函数
│   ├── factories/                # 工厂函数
│   │   ├── dataStore.ts          # 数据存储工厂
│   │   ├── treeDataStore.ts      # 树形数据存储工厂
│   │   ├── atom.ts               # 原子工厂
│   │   ├── eventBus/             # 事件总线工厂
│   │   ├── serviceBus/           # 服务总线工厂
│   │   └── ...
│   ├── components/               # 工具组件
│   │   ├── tree/                 # 树组件
│   │   ├── modalForm/            # 模态表单
│   │   └── ...
│   ├── utils/                    # 工具函数
│   │   ├── path.ts               # 路径工具
│   │   ├── storage.ts            # 存储工具
│   │   ├── rx-utils.ts           # RxJS工具
│   │   └── helpers/              # 辅助函数 (从helpers/迁移)
│   │       ├── file-system.helper.ts
│   │       └── space.helper.ts
│   ├── vscode/                   # VSCode API适配
│   │   ├── file-system.ts        # 文件系统API
│   │   ├── uri.ts                # URI处理
│   │   ├── event.ts              # 事件API
│   │   └── ...
│   └── types/                    # 工具类型定义
│       ├── index.ts
│       └── space.d.ts
│
├── lib/                          # 第三方库封装层
│   ├── gitcode-api/              # GitCode API封装
│   ├── gitee-api/                # Gitee API封装
│   ├── github-api/               # GitHub API封装
│   └── repo.ts                   # 仓库工具
│
└── shared/                       # 共享资源
    ├── assets/                   # 静态资源
    └── styles/                   # 全局样式
```

### 3.2 目录职责说明

#### app/ - 应用层
**职责：** 应用入口、UI组件、业务功能、页面、配置

**包含内容：**
- `main.tsx` - 应用入口
- `components/` - 所有UI组件（基础组件和业务组件）
- `features/` - 业务功能模块
- `pages/` - 页面组件
- `hooks/` - 应用级React Hooks
- `i18n/` - 国际化配置
- `constants/` - 常量定义
- `types/` - 应用类型定义
- `config/` - 应用配置

**设计原则：**
- 只包含应用特定的代码
- 不包含可复用的工具函数
- 依赖 `plugin/`、`service/`、`toolkit/`

#### plugin/ - 插件层
**职责：** 插件定义、插件配置、插件逻辑

**包含内容：**
- `core/` - 核心插件
- `space/` - Space相关插件
- `auth/` - 认证插件
- `widgets/` - 小部件插件
- `migrations/` - 数据迁移插件
- `utilities/` - 工具插件

**设计原则：**
- 每个插件都是独立的模块
- 插件通过 `xbook` 框架注册
- 插件可以依赖 `service/` 和 `toolkit/`
- 插件不应该包含业务服务（服务应该在 `service/`）

#### service/ - 服务层
**职责：** 业务服务、数据访问、外部API封装

**包含内容：**
- `space/` - Space管理服务
- `auth/` - 认证服务
- `file-system/` - 文件系统服务（包含所有Provider）
- `ai/` - AI服务
- `search/` - 搜索服务
- `staging/` - 暂存服务
- `opener/` - 打开器服务
- `setting/` - 设置服务

**设计原则：**
- 服务是单例或可实例化的类
- 服务不包含UI逻辑
- 服务可以依赖 `toolkit/` 和 `lib/`
- 服务不应该依赖 `app/` 或 `plugin/`

#### toolkit/ - 工具层
**职责：** 核心工具、框架、通用组件、工具函数

**包含内容：**
- `xbook/` - xbook框架核心
- `factories/` - 工厂函数（创建Store、Service等）
- `components/` - 通用工具组件
- `utils/` - 工具函数
- `vscode/` - VSCode API适配
- `types/` - 工具类型定义

**设计原则：**
- 工具层应该是框架无关的（或框架特定的，如xbook）
- 工具函数应该是纯函数或工具类
- 工具层不应该依赖 `app/`、`plugin/`、`service/`
- 工具层可以依赖 `lib/`

#### lib/ - 第三方库封装层
**职责：** 第三方库的封装和适配

**包含内容：**
- `gitcode-api/` - GitCode API封装
- `gitee-api/` - Gitee API封装
- `github-api/` - GitHub API封装
- `repo.ts` - 仓库工具

**设计原则：**
- 只包含对第三方库的封装
- 提供统一的接口
- 不应该包含业务逻辑

#### shared/ - 共享资源
**职责：** 静态资源、全局样式

**包含内容：**
- `assets/` - 图片、字体等静态资源
- `styles/` - 全局样式文件

## 四、迁移方案

### 4.1 迁移映射表

| 当前路径 | 目标路径 | 说明 |
|---------|---------|------|
| `src/main.tsx` | `src/app/main.tsx` | 应用入口 |
| `src/components/` | `src/app/components/` | UI组件 |
| `src/features/` | `src/app/features/` | 业务功能 |
| `src/app/dashboard/` | `src/app/pages/dashboard/` | 页面组件 |
| `src/hooks/` | `src/app/hooks/` | 应用级Hooks |
| `src/i18n/` | `src/app/i18n/` | 国际化 |
| `src/constants/` | `src/app/constants/` | 常量定义 |
| `src/types/` | `src/app/types/` | 应用类型 |
| `src/core/utils/` | `src/app/config/` | 应用配置 |
| `src/plugins/` | `src/plugin/` | 插件（重命名） |
| `src/plugins/services/auth/` | `src/plugin/auth/` | 认证插件 |
| `src/services/` | `src/service/` | 服务（重命名） |
| `src/services/*-file-system.provider.ts` | `src/service/file-system/providers/` | 文件系统提供者 |
| `src/toolkit/` | `src/toolkit/` | 工具层（保持不变） |
| `src/xbook/` | `src/toolkit/xbook/` | xbook框架 |
| `src/helpers/` | `src/toolkit/utils/helpers/` | 辅助函数 |
| `src/monaco/` | `src/toolkit/monaco/` | Monaco编辑器工具 |
| `libs/` | `src/lib/` | 第三方库封装 |

### 4.2 路径别名配置

重构后需要更新路径别名：

```typescript
// vite.config.ts
resolve: {
  alias: {
    "@": resolve(__dirname, "src"),
    "@app": resolve(__dirname, "src/app"),
    "@plugin": resolve(__dirname, "src/plugin"),
    "@service": resolve(__dirname, "src/service"),
    "@toolkit": resolve(__dirname, "src/toolkit"),
    "@lib": resolve(__dirname, "src/lib"),
    "@shared": resolve(__dirname, "src/shared"),
    // 保持向后兼容
    "xbook": resolve(__dirname, "src/toolkit/xbook"),
    "libs": resolve(__dirname, "src/lib"),
  }
}
```

### 4.3 迁移步骤

#### 阶段一：准备阶段（1周）

1. **创建新目录结构**
   ```bash
   mkdir -p src/app/{components,features,pages,hooks,i18n,constants,types,config}
   mkdir -p src/plugin/{core,space,auth,widgets,migrations,utilities}
   mkdir -p src/service/{space,auth,file-system/providers,ai,search,staging,opener,setting}
   mkdir -p src/toolkit/{xbook,factories,components,utils/helpers,vscode,types}
   mkdir -p src/lib src/shared/{assets,styles}
   ```

2. **更新路径别名配置**
   - 更新 `vite.config.ts`
   - 更新 `tsconfig.json`

3. **创建迁移脚本**
   - 文件移动脚本
   - 导入路径更新脚本

#### 阶段二：底层迁移（2周）

**优先级：低影响、高价值**

1. **迁移工具层**
   - `src/xbook/` → `src/toolkit/xbook/`
   - `src/helpers/` → `src/toolkit/utils/helpers/`
   - `src/monaco/` → `src/toolkit/monaco/`
   - 更新所有导入路径

2. **迁移库封装层**
   - `libs/` → `src/lib/`
   - 更新所有导入路径

#### 阶段三：中层迁移（2周）

**优先级：中影响、中价值**

1. **迁移服务层**
   - `src/services/` → `src/service/`
   - 整合 `src/plugins/services/` 到 `src/service/`
   - 文件系统提供者统一到 `src/service/file-system/providers/`
   - 更新所有导入路径

2. **迁移插件层**
   - `src/plugins/` → `src/plugin/`
   - 清理插件中的服务代码
   - 更新所有导入路径

#### 阶段四：上层迁移（2周）

**优先级：高影响、高价值**

1. **迁移应用层**
   - `src/components/` → `src/app/components/`
   - `src/features/` → `src/app/features/`
   - `src/hooks/` → `src/app/hooks/`
   - `src/i18n/` → `src/app/i18n/`
   - `src/constants/` → `src/app/constants/`
   - `src/types/` → `src/app/types/`
   - `src/main.tsx` → `src/app/main.tsx`
   - 更新所有导入路径

2. **更新入口文件**
   - 更新 `index.html` 中的入口路径
   - 更新构建配置

#### 阶段五：清理和优化（1周）

1. **删除旧目录**
   - 确认所有文件已迁移
   - 删除旧目录结构

2. **代码审查**
   - 检查所有导入路径
   - 确保没有循环依赖
   - 验证功能正常

3. **文档更新**
   - 更新架构文档
   - 更新开发指南
   - 更新README

### 4.4 风险控制

#### 风险识别

1. **导入路径错误**
   - 风险：大量文件需要更新导入路径
   - 应对：使用自动化脚本批量替换

2. **功能回归**
   - 风险：迁移过程中可能破坏现有功能
   - 应对：分阶段迁移，每阶段完成后进行测试

3. **Git历史丢失**
   - 风险：文件移动可能导致Git历史丢失
   - 应对：使用 `git mv` 命令移动文件

#### 回滚方案

1. **保留旧结构**
   - 迁移过程中保留旧目录
   - 使用符号链接过渡

2. **分支管理**
   - 在独立分支进行重构
   - 完成后合并到主分支

3. **测试覆盖**
   - 每个阶段完成后运行完整测试
   - 确保功能正常后再继续

## 五、重构后的优势

### 5.1 开发体验提升

1. **文件查找更直观**
   - 按层级查找，路径可预测
   - 新成员快速上手

2. **职责更清晰**
   - 每个目录职责单一
   - 代码组织更合理

3. **依赖关系明确**
   - 上层依赖下层，避免循环依赖
   - 依赖方向清晰

### 5.2 维护成本降低

1. **修改影响范围可控**
   - 修改工具层不影响应用层
   - 修改服务层影响范围明确

2. **重构风险降低**
   - 层级清晰，重构更安全
   - 依赖关系明确，重构更简单

### 5.3 扩展性增强

1. **新增功能有章可循**
   - 明确知道新功能应该放在哪里
   - 目录结构提供指导

2. **技术债务减少**
   - 结构清晰，减少临时方案
   - 长期维护更容易

## 六、实施建议

### 6.1 时间规划

- **总时长：** 8-10周
- **阶段一：** 1周（准备）
- **阶段二：** 2周（底层迁移）
- **阶段三：** 2周（中层迁移）
- **阶段四：** 2周（上层迁移）
- **阶段五：** 1-2周（清理优化）

### 6.2 人员安排

- **架构师：** 负责整体规划和决策
- **开发人员：** 负责具体迁移工作
- **测试人员：** 负责功能验证

### 6.3 工具支持

1. **自动化脚本**
   - 文件移动脚本
   - 导入路径更新脚本
   - 批量替换脚本

2. **代码检查工具**
   - ESLint规则检查导入路径
   - TypeScript类型检查
   - 依赖关系检查

### 6.4 验收标准

1. **功能完整性**
   - 所有功能正常工作
   - 无功能回归

2. **代码质量**
   - 导入路径正确
   - 无循环依赖
   - 类型检查通过

3. **文档完整性**
   - 架构文档更新
   - 开发指南更新
   - README更新

## 七、总结

本次目录结构重构旨在将项目的实际目录结构与分层架构逻辑对齐，提升代码组织的清晰度和可维护性。

**核心改进：**
1. ✅ 应用层统一到 `app/`
2. ✅ 插件层统一到 `plugin/`
3. ✅ 服务层统一到 `service/`
4. ✅ 工具层统一到 `toolkit/`
5. ✅ 库封装层统一到 `lib/`

**预期收益：**
- 开发效率提升 30%+
- 新成员上手时间减少 50%+
- 代码维护成本降低 40%+
- 技术债务减少 60%+

**实施建议：**
- 分阶段进行，降低风险
- 充分测试，确保功能正常
- 及时文档，保持团队同步

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27

