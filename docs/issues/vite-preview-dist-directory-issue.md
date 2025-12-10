# Vite Preview 无法找到 dist 目录问题

## 问题概述

在部署到 Dokploy 时，执行 `pnpm start` 启动预览服务器时，`vite preview` 无法找到构建输出的 `dist` 目录，导致启动失败。

## 项目结构

项目采用 monorepo 结构（使用 Turbo），主要结构如下：

```
项目根目录/
├── apps/
│   └── web/                    # Web 应用
│       ├── config/
│       │   └── vite.config.ts  # Vite 配置文件
│       ├── src/
│       └── package.json
├── dist/                        # 构建输出目录（项目根目录）
├── package.json                 # 根 package.json
└── ...
```

## 构建配置现状

### 1. 构建输出位置

- **构建命令**：`pnpm build`（执行 `turbo build --filter=@gitary/web`）
- **构建输出目录**：项目根目录的 `dist/` 目录
- **Vite 配置中的 outDir**：`resolve(__dirname, "../../dist")`（相对于 `apps/web/config/`，即项目根目录）

### 2. 启动脚本配置

**根目录 `package.json` 中的 `start` 脚本**：
```json
"start": "cross-env VITE_PREVIEW=true vite preview --config apps/web/config/vite.config.ts --host 0.0.0.0 --port ${PORT:-3000}"
```

### 3. Vite 配置文件

**`apps/web/config/vite.config.ts` 关键配置**：

```typescript
const __dirname = resolve(__filename, "..");  // apps/web/config
const projectRoot = resolve(__dirname, "../..");  // 项目根目录
const isPreview = process.argv.includes("preview") || process.env.VITE_PREVIEW === "true";

export default defineConfig({
  root: isPreview ? projectRoot : resolve(__dirname, ".."),  // 预览时使用项目根目录，构建时使用 apps/web
  build: {
    outDir: isPreview ? resolve(projectRoot, "dist") : resolve(__dirname, "../../dist"),
    // ...
  },
  preview: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    strictPort: false,
  },
});
```

## 问题现象

### 错误信息

执行 `pnpm start` 时，出现以下错误：

```
error when starting preview server:

Error: The directory "dist" does not exist. Did you build your project?

    at preview (file:///.../node_modules/.pnpm/rolldown-vite@.../dist/node/chunks/node.js:34371:200)
    at async CAC.<anonymous> (file:///.../node_modules/.pnpm/rolldown-vite@.../dist/node/cli.js:669:18)

ELIFECYCLE  Command failed with exit code 1.
```

### 问题分析

1. **构建成功**：`pnpm build` 能够成功构建，输出到项目根目录的 `dist/` 目录
2. **目录存在**：通过 `ls` 命令确认项目根目录下存在 `dist/` 目录
3. **预览失败**：`vite preview` 无法找到 `dist` 目录，即使配置中已经设置了 `outDir`

### 可能的原因

1. **路径解析问题**：`vite preview` 在解析 `outDir` 时，可能基于 `root` 配置来解析相对路径，而不是使用绝对路径
2. **工作目录问题**：`vite preview` 可能基于当前工作目录来查找 `dist`，而不是基于配置中的 `root` 和 `outDir`
3. **配置优先级问题**：`vite preview` 可能没有正确读取 `build.outDir` 配置，或者配置的优先级有问题
4. **rolldown-vite 兼容性**：项目使用的是 `rolldown-vite`（`npm:rolldown-vite@latest`），可能与标准 Vite 的行为有差异

## 当前尝试过的方案

1. **修改 outDir 为绝对路径**：将 `outDir` 从相对路径改为绝对路径 `resolve(projectRoot, "dist")`
2. **修改 root 配置**：在预览模式下，将 `root` 设置为项目根目录
3. **使用环境变量**：通过 `VITE_PREVIEW=true` 环境变量来区分预览模式
4. **添加 preview 配置**：在 `preview` 配置中明确指定 host 和 port
5. **命令行参数**：尝试使用 `--outDir` 参数（但 vite preview 可能不支持此参数）

以上方案均未能解决问题，`vite preview` 仍然无法找到 `dist` 目录。

## 部署环境

- **部署平台**：Dokploy
- **Node.js 版本**：未明确（需要确认）
- **包管理器**：pnpm 10.20.0
- **Vite 版本**：rolldown-vite@7.2.10

## 期望行为

执行 `pnpm start` 时，`vite preview` 应该能够：
1. 正确读取 `build.outDir` 配置
2. 在项目根目录找到 `dist/` 目录
3. 成功启动预览服务器，监听指定端口（默认 3000）

## 相关文件

- `package.json` - 根目录 package.json，包含 `start` 脚本
- `apps/web/config/vite.config.ts` - Vite 配置文件
- `apps/web/package.json` - Web 应用的 package.json

## 备注

- 本地构建成功，`dist/` 目录确实存在于项目根目录
- 问题主要出现在部署环境（Dokploy）中执行 `pnpm start` 时
- 需要确保构建和启动是分离的两个阶段（构建在部署流程的其他阶段完成）

