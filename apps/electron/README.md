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

### 开发模式 vs 生产模式

**开发模式判断逻辑：**

应用通过以下条件判断是否为开发模式：

```typescript
const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && process.env.ELECTRON_FORCE_PRODUCTION !== 'true');
```

- **开发模式** (`isDev = true`)：
  - 加载 `http://localhost:5173`（本地开发服务器）
  - 自动打开开发者工具
  - 适用于日常开发调试

- **生产模式** (`isDev = false`)：
  - 加载 `https://gitdoc.st.datangyuan.cn/`（远程生产环境）
  - 不打开开发者工具
  - 适用于打包后的应用

**在本地测试生产模式：**

如果你想在本地开发环境中测试生产模式的行为（加载远程 URL），可以使用：

```bash
# 在 apps/electron 目录下
pnpm dev:production
```

这个命令会强制使用生产模式，即使应用未打包也会加载远程 URL。

## 构建

### 构建 Electron 应用

```bash
# 先构建 Web 应用
pnpm build --filter @gitary/web

# 然后构建 Electron
pnpm build --filter @gitary/electron
```

## 打包应用

Electron 应用支持两种打包模式：

### 方案A：打包本地构建的 Web 应用（推荐，离线可用）

这种方式会将 Web 应用的构建产物打包进 Electron，用户无需联网即可使用。

**完整打包步骤：**

```bash
# 1. 从项目根目录构建 Web 应用
pnpm build --filter @gitary/web

# 2. 构建 Electron 主进程代码
cd apps/electron
pnpm build

# 3. 打包 Electron 应用（根据你的系统选择）
# Windows:
pnpm pack:win

# macOS:
pnpm pack:mac

# Linux:
pnpm pack:linux

# 或者打包所有平台：
pnpm pack
```

**打包产物位置：**
- Windows: `apps/electron/dist/Gitary Setup x.x.x.exe` (安装包) 和 `apps/electron/dist/Gitary x.x.x-win.zip` (便携版)
- macOS: `apps/electron/dist/Gitary-x.x.x.dmg` (安装包) 和 `apps/electron/dist/Gitary-x.x.x-mac.zip` (压缩包)
- Linux: `apps/electron/dist/Gitary-x.x.x.AppImage` (AppImage) 和 `apps/electron/dist/gitary_x.x.x_amd64.deb` (Debian 包)

### 方案B：加载远程生产环境 URL

如果你想让 Electron 应用加载远程生产环境的 URL（比如 `https://your-production-domain.com`），可以这样配置：

**步骤1：设置环境变量**

在打包时设置 `ELECTRON_REMOTE_URL` 环境变量：

```bash
# Windows (PowerShell)
$env:ELECTRON_REMOTE_URL="https://your-production-domain.com"; pnpm pack:win

# Windows (CMD)
set ELECTRON_REMOTE_URL=https://your-production-domain.com && pnpm pack:win

# macOS/Linux
ELECTRON_REMOTE_URL=https://your-production-domain.com pnpm pack:mac
```

**步骤2：或者修改代码直接指定 URL**

如果你想永久使用远程 URL，可以直接修改 `apps/electron/src/main/window.ts`：

```typescript
// 将生产环境的 URL 硬编码
if (isDev) {
  win.loadURL('http://localhost:5173');
  win.webContents.openDevTools();
} else {
  // 直接使用远程 URL
  win.loadURL('https://your-production-domain.com');
}
```

**注意事项：**
- 使用远程 URL 时，应用需要联网才能使用
- 确保远程 URL 支持 CORS 和 Electron 的 User-Agent
- 如果远程 URL 使用 HTTPS，确保证书有效

### 打包配置说明

打包配置位于 `electron-builder.yml`，主要配置项：

- **appId**: 应用唯一标识符
- **productName**: 应用显示名称
- **directories.output**: 打包产物输出目录
- **files**: 需要打包的文件列表（已包含 Web 构建产物）
- **target**: 各平台的打包格式
  - Windows: NSIS 安装包 + ZIP 便携版
  - macOS: DMG 安装包 + ZIP 压缩包
  - Linux: AppImage + DEB 包

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

