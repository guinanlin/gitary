# Web 前端启动性能优化方案

> **文档版本：** v1.0  
> **创建日期：** 2025-01-27  
> **状态：** 待实施  
> **优先级：** 高

---

## 一、问题分析

### 1.1 当前性能问题

根据最新的构建输出分析，发现以下主要问题：

| 文件 | 原始大小 | Gzip 后 | 说明 | 优先级 |
|------|---------|---------|------|--------|
| `index-mij4Qf1E.js` | **9,442.08 kB** | **3,087.73 kB** | 主应用 bundle（最严重） | ⭐⭐⭐⭐⭐ |
| `monaco-1kYVy38h.js` | 3,477.61 kB | 895.33 kB | Monaco 编辑器 | ⭐⭐⭐⭐ |
| `chunk-EIO257PC-DB2BWn5g.js` | 1,821.47 kB | 744.30 kB | 未知大 chunk | ⭐⭐⭐ |
| `flowchart-elk-definition-*.js` | 1,447.47 kB | 450.00 kB | ELK 布局引擎 | ⭐⭐⭐ |
| `provide-excalidraw-*.js` | 547.54 kB | 169.61 kB | Excalidraw 绘图 | ⭐⭐ |
| `react-syntax-highlighter-*.js` | 637.07 kB | 226.22 kB | 代码高亮 | ⭐⭐ |
| `chakra-ui-*.js` | 459.96 kB | 155.11 kB | Chakra UI 组件库 | ⭐⭐ |

**总计：约 18.8 MB（未压缩），约 6.1 MB（Gzip 压缩）**

### 1.2 根本原因

#### 问题一：主 Bundle 过大（9.4MB）

**原因分析：**
- 所有 features 在 `main.tsx` 中同步导入
- 大量业务代码和第三方库混合打包
- 缺少合理的代码分割策略
- 大型库（excalidraw、mermaid、reactflow 等）可能被打包到主 bundle

**影响：**
- 首屏必须加载全部代码，即使很多功能不会立即使用
- 用户首次访问需要等待 9.4MB 的下载和解析
- 启动时间显著延长

#### 问题二：Monaco 编辑器体积过大（3.5MB）

**原因分析：**
- `customMonaco.ts` 导入了所有语言支持（20+ 种语言）
- 大部分语言支持在启动时同步加载
- 即使用户只使用几种语言，也会加载全部

**影响：**
- Monaco chunk 体积达到 3.5MB
- 启动时必须加载，即使不立即使用编辑器

#### 问题三：大量语言包被打包

**原因分析：**
- 构建输出显示大量 mermaid 语言包（50+ 个）
- 所有语言包在启动时同步加载
- 用户通常只需要 1-2 种语言

**影响：**
- 增加了不必要的 bundle 体积
- 影响启动性能

#### 问题四：代码分割策略不完善

**原因分析：**
- `splitChunks.ts` 策略较简单
- 未针对大型库（excalidraw、mermaid、reactflow、cytoscape 等）进行分割
- 部分大型库可能被打包到主 bundle

**影响：**
- 无法实现按需加载
- 主 bundle 体积过大

---

## 二、优化目标

### 2.1 性能指标目标

| 指标 | 当前值 | 目标值 | 预期改善 |
|------|--------|--------|---------|
| 主 bundle (Gzip) | 3,087.73 kB | **< 2,000 kB** | **减少 35%+** |
| Monaco chunk (Gzip) | 895.33 kB | **< 500 kB** | **减少 45%+** |
| 总初始加载 (Gzip) | ~6,100 kB | **< 3,500 kB** | **减少 43%+** |
| 首屏可交互时间 | 较慢 | **< 2s** | **显著提升** |
| 构建时间 | 44.19s | **< 50s** | 基本保持 |

### 2.2 用户体验目标

1. **启动速度提升**：用户打开应用后能更快看到界面
2. **按需加载**：大型功能在需要时才加载
3. **加载体验**：加载过程中显示友好的 Loading 指示器
4. **功能完整性**：所有功能正常工作，不影响现有功能

---

## 三、优化方案

### 3.1 方案一：优化 Monaco 编辑器（优先级：⭐⭐⭐⭐⭐）

**目标：** 将 Monaco chunk 从 3.5MB 减少到 1-1.5MB

**策略：**
- 只导入核心语言（TypeScript、JSON、HTML、CSS、Markdown、YAML）
- 其他语言改为按需加载
- 在用户打开对应文件类型时动态加载语言支持

**预期效果：**
- Monaco chunk 减少 60-70%
- 启动时减少 2-2.5MB 的加载

### 3.2 方案二：增强代码分割策略（优先级：⭐⭐⭐⭐）

**目标：** 将大型库独立分割，避免打包到主 bundle

**策略：**
- 为大型库（excalidraw、mermaid、reactflow、cytoscape 等）创建独立 chunk
- 优化 splitChunks 配置
- 确保按需加载的库不会被提前加载

**预期效果：**
- 主 bundle 减少 30-40%
- 大型库按需加载，不影响启动速度

### 3.3 方案三：优化 Vite 构建配置（优先级：⭐⭐⭐）

**目标：** 优化构建输出，提升加载性能

**策略：**
- 优化 chunk 命名策略
- 调整 chunkSizeWarningLimit
- 优化资源文件命名

**预期效果：**
- 更好的缓存策略
- 更清晰的构建输出

---

## 四、详细实施步骤

### 阶段一：优化 Monaco 编辑器（预计耗时：2-3 小时）

#### 步骤 1.1：修改 `customMonaco.ts` 实现按需加载

**文件：** `apps/web/src/monaco/customMonaco.ts`

**操作：**
1. 保留核心语言同步导入（TypeScript、JSON、HTML、CSS、Markdown、YAML）
2. 将其他语言改为按需加载函数
3. 导出 `loadLanguage` 函数供外部调用

**代码示例：**
```typescript
// 核心语言（同步导入）
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution";
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution";

// 其他语言（按需加载）
const languageLoaders: Record<string, () => Promise<void>> = {
  xml: () => import("monaco-editor/esm/vs/basic-languages/xml/xml.contribution").then(() => {}),
  sql: () => import("monaco-editor/esm/vs/basic-languages/sql/sql.contribution").then(() => {}),
  // ... 其他语言
};

export const loadLanguage = async (language: string) => {
  const loader = languageLoaders[language];
  if (loader) {
    await loader();
  }
};
```

**验收标准：**
- [ ] 核心语言正常加载
- [ ] 按需加载函数正常工作
- [ ] 不影响现有功能

#### 步骤 1.2：更新使用 Monaco 的组件

**文件：** `apps/web/src/components/custom-monaco-editor/index.tsx`

**操作：**
1. 在组件挂载时检查语言是否需要按需加载
2. 如果需要，调用 `loadLanguage` 函数
3. 显示加载状态（可选）

**验收标准：**
- [ ] 编辑器正常打开
- [ ] 语言支持按需加载
- [ ] 用户体验良好

#### 步骤 1.3：测试验证

**操作：**
1. 构建项目，检查 Monaco chunk 大小
2. 测试各种文件类型的打开
3. 验证语言支持是否正常

**验收标准：**
- [ ] Monaco chunk 大小减少 60%+
- [ ] 所有语言支持正常工作
- [ ] 无功能回归

---

### 阶段二：增强代码分割策略（预计耗时：1-2 小时）

#### 步骤 2.1：更新 `splitChunks.ts`

**文件：** `apps/web/config/splitChunks.ts`

**操作：**
1. 添加大型库的分割规则
2. 确保每个大型库都有独立的 chunk
3. 优化分割策略

**代码示例：**
```typescript
export const strategy: SplitChunkStrategy = [
  // ... 现有规则 ...
  
  // 大型库独立分割
  {
    match: [/^@excalidraw\/excalidraw$/],
    name: "excalidraw",
  },
  {
    match: [/^mermaid/, /^@mermaid-js/],
    name: "mermaid",
  },
  {
    match: [/^reactflow/, /^@reactflow/],
    name: "reactflow",
  },
  {
    match: [/^cytoscape/],
    name: "cytoscape",
  },
  {
    match: [/^react-syntax-highlighter/],
    name: "syntax-highlighter",
  },
  {
    match: [/^zenmark-editor/],
    name: "zenmark-editor",
  },
];
```

**验收标准：**
- [ ] 所有大型库都有独立 chunk
- [ ] 主 bundle 大小减少
- [ ] 构建正常完成

#### 步骤 2.2：测试验证

**操作：**
1. 构建项目，检查各 chunk 大小
2. 验证主 bundle 是否减少
3. 检查各功能是否正常

**验收标准：**
- [ ] 主 bundle 减少 30%+
- [ ] 大型库独立分割
- [ ] 无功能回归

---

### 阶段三：优化 Vite 构建配置（预计耗时：0.5-1 小时）

#### 步骤 3.1：更新 `vite.config.ts`

**文件：** `apps/web/config/vite.config.ts`

**操作：**
1. 优化 `build.rollupOptions.output` 配置
2. 调整 `chunkSizeWarningLimit`
3. 优化资源文件命名

**代码示例：**
```typescript
build: {
  minify: "esbuild",
  outDir: isPreview ? "dist" : "../../dist",
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    input: resolve(__dirname, "../index.html"),
    output: {
      manualChunks: renderChunksWithStrategy(dependencies),
      chunkFileNames: "assets/[name]-[hash].js",
      entryFileNames: "assets/[name]-[hash].js",
      assetFileNames: "assets/[name]-[hash].[ext]",
    },
  },
},
```

**验收标准：**
- [ ] 构建配置优化完成
- [ ] 构建正常完成
- [ ] 输出文件命名清晰

---

## 五、测试计划

### 5.1 功能测试

**测试项：**
1. **Monaco 编辑器功能**
   - [ ] 打开各种文件类型（.ts, .js, .json, .html, .css, .md, .yaml, .xml, .sql, .py, .java, .cpp, .go, .rs, .php, .rb, .lua, .pl, .cs, .fs, .swift, .kt, .scala, .coffee, .ps1, .bat）
   - [ ] 验证语法高亮正常
   - [ ] 验证代码补全正常
   - [ ] 验证语言支持按需加载

2. **大型功能加载**
   - [ ] Excalidraw 绘图功能
   - [ ] Mermaid 图表功能
   - [ ] ReactFlow 流程图功能
   - [ ] 其他大型功能

3. **整体功能**
   - [ ] 文件打开功能
   - [ ] 文件编辑功能
   - [ ] 文件保存功能
   - [ ] 其他核心功能

### 5.2 性能测试

**测试项：**
1. **构建性能**
   - [ ] 构建时间 < 50s
   - [ ] 构建产物大小符合预期

2. **运行时性能**
   - [ ] 首屏加载时间 < 2s
   - [ ] 主 bundle 大小 < 2MB (Gzip)
   - [ ] Monaco chunk 大小 < 500KB (Gzip)

3. **按需加载性能**
   - [ ] 大型功能按需加载正常
   - [ ] 加载时间合理
   - [ ] 用户体验良好

### 5.3 兼容性测试

**测试项：**
1. **浏览器兼容性**
   - [ ] Chrome/Edge 最新版
   - [ ] Firefox 最新版
   - [ ] Safari 最新版

2. **功能兼容性**
   - [ ] 所有现有功能正常
   - [ ] 无功能回归
   - [ ] 用户体验良好

---

## 六、回滚计划

### 6.1 回滚条件

如果出现以下情况，需要回滚：
1. 功能严重回归，影响核心功能
2. 性能优化未达到预期，甚至变差
3. 构建失败或构建产物异常
4. 用户反馈严重问题

### 6.2 回滚步骤

1. **立即回滚**
   - 使用 Git 回滚到优化前的版本
   - 确保构建和功能正常

2. **问题分析**
   - 分析问题原因
   - 记录问题详情
   - 制定修复方案

3. **重新实施**
   - 修复问题后重新实施优化
   - 充分测试后再发布

---

## 七、预期效果

### 7.1 性能提升

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 主 bundle (Gzip) | 3,087.73 kB | < 2,000 kB | **-35%** |
| Monaco chunk (Gzip) | 895.33 kB | < 500 kB | **-45%** |
| 总初始加载 (Gzip) | ~6,100 kB | < 3,500 kB | **-43%** |
| 首屏可交互时间 | 较慢 | < 2s | **显著提升** |

### 7.2 用户体验提升

1. **启动速度更快**：用户打开应用后能更快看到界面
2. **按需加载**：大型功能在需要时才加载，不影响启动速度
3. **加载体验更好**：加载过程中显示友好的 Loading 指示器
4. **功能完整**：所有功能正常工作，不影响现有功能

### 7.3 开发体验提升

1. **构建更清晰**：构建输出更清晰，便于分析
2. **维护更容易**：代码分割更合理，便于维护
3. **扩展更方便**：按需加载机制便于扩展新功能

---

## 八、风险评估

### 8.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 按需加载失败 | 高 | 低 | 充分测试，提供降级方案 |
| 功能回归 | 高 | 中 | 完整测试，逐步实施 |
| 构建失败 | 中 | 低 | 充分测试，及时修复 |
| 性能未达预期 | 中 | 中 | 持续优化，调整策略 |

### 8.2 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 用户体验下降 | 高 | 低 | 充分测试，收集反馈 |
| 功能不可用 | 高 | 低 | 完整测试，及时修复 |
| 用户投诉 | 中 | 低 | 及时响应，快速修复 |

---

## 九、后续优化方向

### 9.1 短期优化（1-2 周）

1. **进一步优化 Monaco**
   - 考虑使用 CDN 加载 Monaco
   - 优化 Monaco 配置

2. **优化其他大型库**
   - 优化 Excalidraw 加载
   - 优化 Mermaid 加载
   - 优化其他大型库

3. **优化资源加载**
   - 优化字体加载
   - 优化图片加载
   - 优化其他资源加载

### 9.2 中期优化（1-2 月）

1. **路由级别的代码分割**
   - 实现路由级别的懒加载
   - 优化路由加载策略

2. **预加载策略**
   - 实现智能预加载
   - 优化预加载策略

3. **缓存策略优化**
   - 优化浏览器缓存
   - 优化 Service Worker 缓存

### 9.3 长期优化（3-6 月）

1. **架构优化**
   - 考虑微前端架构
   - 优化插件系统

2. **性能监控**
   - 实现性能监控
   - 持续优化性能

3. **用户体验优化**
   - 优化加载体验
   - 优化交互体验

---

## 十、参考资料

1. [性能分析报告](../issues/performance-startup-slow-analysis.md)
2. [Bundle Size 优化问题](../issues/bundle-size-optimization.md)
3. [启动性能优化 PRD](./startup-performance-optimization-prd.md)
4. [Vite 官方文档](https://vitejs.dev/)
5. [Monaco Editor 文档](https://microsoft.github.io/monaco-editor/)
6. [Rollup 代码分割文档](https://rollupjs.org/configuration-options/#output-manualchunks)

---

## 十一、更新记录

| 版本 | 日期 | 作者 | 更新内容 |
|------|------|------|---------|
| v1.0 | 2025-01-27 | AI Assistant | 初始版本 |

---

**文档状态：** 待评审  
**下一步行动：** 评审文档，确认优化方案后开始实施
