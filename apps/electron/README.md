# Gitary Electron 桌面应用

这是 Gitary 的 Electron 桌面应用版本，允许用户在本地文件系统上使用 Gitary 的所有功能。

## 开发

### 前置要求

- Node.js 18+
- pnpm 10+

### 开发模式

开发模式会同时启动 Web 开发服务器和 Electron 应用：

```bash
# 从项目根目录运行
pnpm dev:desktop
```

这个命令会：
1. 启动 Web 开发服务器（`http://localhost:5173`）
2. 等待服务器就绪
3. 启动 Electron 应用并加载 Web 应用

### 单独运行 Electron

如果 Web 服务器已经在运行，可以单独启动 Electron：

```bash
pnpm dev:electron
```

## 构建

### 构建 Electron 应用

```bash
# 先构建 Web 应用
pnpm build --filter @gitary/web

# 然后构建 Electron
pnpm build --filter @gitary/electron
```

### 打包应用

打包配置使用 `electron-builder`，配置文件位于 `electron-builder.yml`。

```bash
# 在 apps/electron 目录下
pnpm electron-builder
```

## 文件系统集成

Electron 应用通过 `ElectronFileSystemProvider` 提供本地文件系统访问能力：

- **URI Scheme**: `local://`
- **工作目录**: 应用启动时会提示用户选择工作目录
- **功能**: 支持完整的文件系统操作（读取、写入、删除、重命名等）

## 架构

```
apps/electron/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── main.ts        # 主进程入口
│   │   ├── window.ts      # 窗口管理
│   │   ├── menu.ts        # 菜单配置
│   │   └── ipc-handlers.ts # IPC 处理器
│   └── preload/           # Preload 脚本
│       └── preload.ts     # 安全桥接
├── resources/             # 资源文件
│   └── icons/            # 应用图标
└── dist/                  # 构建产物
```

## 安全配置

应用使用以下安全配置：

- `nodeIntegration: false` - 禁用 Node.js 集成
- `contextIsolation: true` - 启用上下文隔离
- `preload` - 通过 preload 脚本安全暴露 API

## 注意事项

1. **开发模式**: 必须先启动 Web 开发服务器
2. **生产构建**: 必须先构建 Web 应用
3. **图标**: 应用图标已准备在 `resources/icons/` 目录下
   - 如需重新生成: `pnpm generate-icons`
4. **路径验证**: 所有文件系统操作都包含路径验证，防止路径遍历攻击

