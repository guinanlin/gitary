# Gitary 启动性能优化 PRD

> **文档版本：** v1.0  
> **创建日期：** 2025-12-08  
> **状态：** 待评审

---

## 一、背景与目标

### 1.1 问题概述

项目发布后发现启动速度明显偏慢。通过构建分析发现：

| 指标 | 当前值 |
|-----|-------|
| 初始 bundle (Gzip) | **~6.3 MB** |
| 主应用 bundle (未压缩) | **~11.17 MB** |
| 启动时加载的插件 | **全部 12+ 个** |

### 1.2 根本原因

**所有插件和编辑器在启动时同步加载**，不论用户是否会使用。

详细分析见：[性能分析报告](file:///d:/just-for-test/dty-gitdoc/dty-gitary/docs/issues/performance-startup-slow-analysis.md)

### 1.3 优化目标

| 指标 | 目标值 | 预期改善 |
|-----|-------|---------|
| 初始 bundle (Gzip) | **< 1.5 MB** | **减少 75%+** |
| 启动时加载的插件 | **2-3 个** | **减少 80%** |
| 首屏可交互时间 | 用户可浏览文件树 | **显著提升** |

---

## 二、产品需求

### 2.1 核心原则

1. **Markdown 编辑器（ZenMark）作为核心功能**，启动时加载
2. **其他编辑器按需加载**，用户打开对应文件时才加载
3. **加载过程对用户友好**，在编辑区域显示 Loading 指示器

### 2.2 用户场景

| 场景 | 预期行为 |
|-----|---------|
| 用户启动应用 | 立即看到文件树，可浏览和导航 |
| 用户打开 `.md` 文件 | 立即打开编辑器（无延迟） |
| 用户按 `Ctrl+/` 切换源码模式 | 首次触发时加载 Monaco，显示 Loading |
| 用户首次打开 `.mindmap.json` | 显示 Loading，加载 MindFlow 后渲染 |
| 用户再次打开 `.mindmap.json` | 直接渲染（编辑器已在内存中） |
| 用户首次打开 `.excalidraw` | 显示 Loading，加载 Excalidraw 后渲染 |

### 2.3 加载策略

```
┌─────────────────────────────────────────────────────────────┐
│                    启动时加载（核心功能）                      │
├─────────────────────────────────────────────────────────────┤
│  ✓ xbook 核心框架                                            │
│  ✓ 文件系统抽象层 + 文件树组件                                │
│  ✓ Chakra UI                                                │
│  ✓ ZenMark 编辑器（Markdown）                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    按需加载（用户触发时）                      │
├─────────────────────────────────────────────────────────────┤
│  ◆ Monaco 编辑器    ← 用户按 Ctrl+/ 或打开代码文件时          │
│  ◆ MindFlow 脑图    ← 用户打开 .mindmap.json 时              │
│  ◆ ReactFlow + ELK  ← 用户打开 .flow 文件时                  │
│  ◆ Excalidraw       ← 用户打开 .excalidraw 文件时            │
│  ◆ Drawio           ← 用户打开 .drawio 文件时                │
│  ◆ 其他 App Providers                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、技术方案

### 3.1 当前代码结构

**插件加载链：**

```
main.tsx
  └─ pluginService.use([...])
      └─ features (plugin)
          └─ pluginForProviders (plugin)
              ├─ provideZenmarkEditor  ← Markdown 编辑器
              ├─ provideCommonTextFileOpener
              └─ provideApps (plugin)
                  ├─ provideAppAIQuotes
                  ├─ provideAppAIStoryCards
                  ├─ provideAppAIResume
                  ├─ provideAppMeetingMinutes  ← 使用 Monaco
                  ├─ provideAppMakePPT
                  ├─ provideStreamingNote
                  ├─ provideZenNotes
                  ├─ provideCommunity
                  ├─ provideMindFlow      ← 脑图编辑器
                  ├─ provideFlowDemo      ← 流程图 (ReactFlow + ELK)
                  ├─ provideExcalidraw    ← 绘图
                  └─ provideDrawio        ← Drawio
```

**关键发现：**

1. 所有 import 都是同步的，导致启动时加载全部代码
2. `pluginService.use()` 立即调用 `plugin.activate()`，无延迟机制
3. Monaco 在部分组件中已使用动态 `import()`（如 `text-file-view`）

### 3.2 改造方案概述

#### 方案一：App Providers 延迟注册（推荐）

**核心思想**：将 App Providers 改为"声明式注册 + 延迟加载"

**改造前：**
```typescript
// src/features/providers/provide-apps/index.tsx
import { provideMindFlow } from "./provide-mind-flow";
import { provideFlowDemo } from "./provide-react-flow";
// ... 全部同步导入

xbook.pluginService.use([
  provideMindFlow,
  provideFlowDemo,
  // ... 全部同步激活
]);
```

**改造后：**
```typescript
// src/features/providers/provide-apps/index.tsx
// 不再同步导入，改为注册延迟加载器

const lazyProviders = [
  {
    id: "mind-flow",
    match: [".mindflow.json", ".mindmap.json"],
    loader: () => import("./provide-mind-flow"),
  },
  {
    id: "flow-demo",
    match: [".flow.json"],
    loader: () => import("./provide-react-flow"),
  },
  // ... 其他
];

// 只在用户打开对应文件时才加载插件
```

#### 方案二：增强 pluginService 支持延迟加载

**扩展 `pluginService` API：**

```typescript
// 新增 registerLazy 方法
pluginService.registerLazy({
  id: "mind-flow",
  condition: () => userOpensMindMapFile,
  loader: () => import("./provide-mind-flow"),
});
```

### 3.3 详细改造步骤

---

#### 步骤 1：创建延迟加载器基础设施

**新增文件：** `src/services/lazy-opener.service.ts`

**功能：**
- 维护"文件扩展名 → 插件加载器"的映射
- 拦截文件打开请求，判断插件是否已加载
- 未加载时显示 Loading，动态加载插件后再渲染

---

#### 步骤 2：改造 `provideApps`

**修改文件：** [src/features/providers/provide-apps/index.tsx](file:///d:/just-for-test/dty-gitdoc/dty-gitary/src/features/providers/provide-apps/index.tsx)

**改造内容：**
- 移除顶层同步 import
- 改为声明式配置 + 动态 `import()`

```typescript
// 改造示例
export const lazyAppConfigs = [
  {
    id: "mind-flow",
    match: [".mindflow.json", ".mindmap.json"],
    loader: () => import("./provide-mind-flow").then(m => m.provideMindFlow),
  },
  {
    id: "flow-demo",
    match: [".flow.json", ".reactflow.json"],
    loader: () => import("./provide-react-flow").then(m => m.provideFlowDemo),
  },
  {
    id: "excalidraw",
    match: [".excalidraw"],
    loader: () => import("./provide-excalidraw").then(m => m.provideExcalidraw),
  },
  {
    id: "drawio",
    match: [".drawio", ".dio"],
    loader: () => import("./provide-drawio").then(m => m.provideDrawio),
  },
  // ... 其他 App Providers
];
```

---

#### 步骤 3：改造 openerService

**修改文件：** [src/services/opener.service.ts](file:///d:/just-for-test/dty-gitdoc/dty-gitary/src/services/opener.service.ts)

**改造内容：**
- 新增 `registerLazy()` 方法
- 打开文件时检查对应插件是否已加载
- 未加载时触发 `loader()`，加载完成后再打开文件

---

#### 步骤 4：创建 Loading 组件

**新增文件：** `src/components/lazy-loading-placeholder.tsx`

**功能：**
- 在编辑区域显示 Loading 动画
- 显示正在加载的编辑器名称
- 支持加载失败时显示错误信息和重试按钮

---

#### 步骤 5：处理 Monaco 延迟加载

**涉及文件：** 
- [src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx](file:///d:/just-for-test/dty-gitdoc/dty-gitary/src/features/providers/provide-zenmark-editor/zenmark-editor-component.tsx)

**改造内容：**
- Ctrl+/ 切换源码模式时，首次触发 Monaco 加载
- 加载期间显示 Loading
- 已有部分代码使用动态 import，需统一

---

#### 步骤 6：保持 ZenMark 同步加载

**文件：** [src/features/providers/index.tsx](file:///d:/just-for-test/dty-gitdoc/dty-gitary/src/features/providers/index.tsx)

**确认：**
- `provideZenmarkEditor` 保持同步 import 和注册
- 确保 Markdown 文件打开无延迟

---

### 3.4 需要修改的文件清单

| 文件路径 | 改动类型 | 说明 |
|---------|---------|------|
| `src/services/lazy-opener.service.ts` | **新增** | 延迟加载器服务 |
| `src/components/lazy-loading-placeholder.tsx` | **新增** | Loading 占位组件 |
| `src/features/providers/provide-apps/index.tsx` | **修改** | 移除同步 import，改为延迟配置 |
| `src/services/opener.service.ts` | **修改** | 新增 `registerLazy()` 方法 |
| `src/xbook/services/pluginService.ts` | **可选修改** | 新增 `registerLazy()` API |
| `src/features/providers/index.tsx` | **修改** | 调整加载顺序 |
| 各 App Provider 的 `index.tsx` | **修改** | 确保支持动态导入模式 |

---

## 四、工作量估算

### 4.1 任务拆分

| 任务 | 优先级 | 预估工时 | 复杂度 |
|-----|-------|---------|-------|
| 1. 创建延迟加载器服务 | P0 | 4h | 中 |
| 2. 创建 Loading 占位组件 | P0 | 2h | 低 |
| 3. 改造 `provideApps` | P0 | 4h | 中 |
| 4. 改造 `openerService` | P0 | 3h | 中 |
| 5. 改造各 App Provider | P0 | 4h | 中 |
| 6. Monaco 延迟加载 | P1 | 3h | 中 |
| 7. 测试与调试 | P0 | 4h | 中 |
| 8. 性能验证与优化 | P1 | 2h | 低 |

**总计：约 26 工时（3-4 个工作日）**

### 4.2 里程碑

| 阶段 | 目标 | 预计完成 |
|-----|-----|---------|
| Phase 1 | 基础设施搭建（延迟加载器 + Loading 组件） | Day 1 |
| Phase 2 | App Providers 延迟化改造 | Day 2 |
| Phase 3 | Monaco 延迟加载 + 集成测试 | Day 3 |
| Phase 4 | 性能验证 + 问题修复 | Day 4 |

---

## 五、风险评估

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|-----|-----|---------|
| 插件依赖关系复杂 | 可能导致运行时错误 | 充分测试每个插件的独立加载 |
| 首次加载延迟过长 | 用户体验不佳 | 优化 Loading 动画，考虑预加载策略 |
| 缓存失效问题 | 插件重复加载 | 确保模块缓存机制正确工作 |

### 5.2 兼容性风险

| 风险 | 影响 | 缓解措施 |
|-----|-----|---------|
| 现有功能回归 | 部分功能不可用 | 回归测试所有文件类型的打开 |
| 事件订阅时序问题 | 事件丢失 | 延迟加载后重新订阅事件 |

---

## 六、验收标准

### 6.1 功能验收

- [ ] 启动后可立即浏览文件树
- [ ] 打开 `.md` 文件无延迟
- [ ] 首次打开脑图/流程图/Excalidraw 显示 Loading 后正常渲染
- [ ] 再次打开同类型文件无 Loading（已缓存）
- [ ] Ctrl+/ 切换源码模式正常工作

### 6.2 性能验收

- [ ] 初始 bundle (Gzip) < 2 MB
- [ ] 首屏可交互时间 < 3 秒（中等网络）
- [ ] 编辑器加载时间 < 3 秒（中等网络）

### 6.3 测试验收

- [ ] 手动测试所有文件类型的打开
- [ ] 构建分析验证 bundle 大小
- [ ] 弱网环境测试

---

## 七、附录

### 7.1 相关文档

- [项目架构分析](file:///d:/just-for-test/dty-gitdoc/dty-gitary/docs/project/project-current-struture.md)
- [性能问题分析报告](file:///d:/just-for-test/dty-gitdoc/dty-gitary/docs/issues/performance-startup-slow-analysis.md)

### 7.2 参考资料

- [Vite 代码分割文档](https://vitejs.dev/guide/features.html#async-chunk-loading-optimization)
- [React.lazy 与 Suspense](https://react.dev/reference/react/lazy)

---

**文档状态：** 待评审  
**下一步：** 请资深工程师评审后开始实施
