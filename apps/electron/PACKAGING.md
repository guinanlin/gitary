# Electron 应用打包完整指南

## 📦 打包前准备

### 1. 检查依赖

确保已安装所有依赖：

```bash
# 从项目根目录
pnpm install
```

### 2. 准备应用图标

应用图标已配置在 `resources/icons/` 目录：
- `icon.icns` - macOS 图标
- `icon.ico` - Windows 图标
- `icon.png` - Linux 图标

如需重新生成图标，运行：

```bash
cd apps/electron
pnpm generate-icons
```

## 🚀 打包流程

### 完整打包流程（方案A：本地构建）

这是**推荐的打包方式**，会将 Web 应用打包进 Electron，用户无需联网即可使用。

```bash
# ========== 步骤 1: 构建 Web 应用 ==========
# 从项目根目录执行
pnpm build --filter @gitary/web

# 构建完成后，检查构建产物
# 应该能看到 dist/ 目录下有 index.html 等文件

# ========== 步骤 2: 构建 Electron 主进程 ==========
cd apps/electron
pnpm build

# 构建完成后，检查 dist/main/ 目录
# 应该能看到 main.js 等文件

# ========== 步骤 3: 打包 Electron 应用 ==========
# 根据你的目标平台选择：

# Windows 平台
pnpm pack:win

# macOS 平台
pnpm pack:mac

# Linux 平台
pnpm pack:linux

# 或者打包所有平台（需要对应系统的构建工具）
pnpm pack
```

### 打包产物位置

打包完成后，在 `apps/electron/dist/` 目录下可以找到：

**Windows:**
- `Gitary Setup x.x.x.exe` - NSIS 安装程序
- `Gitary x.x.x-win.zip` - 便携版压缩包

**macOS:**
- `Gitary-x.x.x.dmg` - DMG 安装镜像
- `Gitary-x.x.x-mac.zip` - 压缩包

**Linux:**
- `Gitary-x.x.x.AppImage` - AppImage 便携版
- `gitary_x.x.x_amd64.deb` - Debian 安装包

## 🌐 使用远程 URL（方案B）

如果你想让 Electron 应用加载远程生产环境的 URL，有两种方式：

### 方式1：通过环境变量（推荐）

在打包时设置环境变量：

```bash
# Windows PowerShell
$env:ELECTRON_REMOTE_URL="https://your-production-domain.com"
pnpm pack:win

# Windows CMD
set ELECTRON_REMOTE_URL=https://your-production-domain.com
pnpm pack:win

# macOS/Linux
ELECTRON_REMOTE_URL=https://your-production-domain.com pnpm pack:mac
```

### 方式2：修改代码

直接修改 `apps/electron/src/main/window.ts` 文件，将生产环境的 URL 硬编码：

```typescript
if (isDev) {
  win.loadURL('http://localhost:5173');
  win.webContents.openDevTools();
} else {
  // 修改这里的 URL
  win.loadURL('https://your-production-domain.com');
}
```

然后重新构建和打包：

```bash
pnpm build
pnpm pack:win  # 或其他平台
```

## ⚙️ 打包配置说明

### electron-builder.yml 主要配置

```yaml
appId: com.gitary.app          # 应用唯一标识
productName: Gitary            # 应用显示名称
directories:
  output: dist                 # 打包产物输出目录
  buildResources: resources    # 构建资源目录（图标等）

files:
  - dist/**/*                  # Electron 主进程构建产物
  - package.json               # package.json
  - "../../web/dist/**/*"     # Web 应用构建产物（方案A）
  - "!node_modules/**/*"      # 排除 node_modules

# 各平台配置
win:
  target:
    - nsis    # NSIS 安装程序
    - zip     # ZIP 便携版
  icon: resources/icons/icon.ico

mac:
  target:
    - dmg     # DMG 安装镜像
    - zip     # ZIP 压缩包
  icon: resources/icons/icon.icns

linux:
  target:
    - AppImage  # AppImage 便携版
    - deb       # Debian 安装包
  icon: resources/icons/icon.png
```

## 🔍 常见问题

### Q1: 打包时提示找不到 web/dist 目录

**原因：** 没有先构建 Web 应用

**解决：**
```bash
# 从项目根目录先构建 Web 应用
pnpm build --filter @gitary/web

# 然后再打包 Electron
cd apps/electron
pnpm pack:win
```

### Q2: 打包后的应用无法启动

**检查清单：**
1. 确认 Web 应用已正确构建（`dist/` 目录存在且包含 `index.html`）
2. 确认 Electron 主进程已构建（`apps/electron/dist/main/` 目录存在）
3. 检查控制台错误信息

### Q3: 如何测试打包后的应用？

**Windows:**
```bash
# 直接运行安装程序
.\dist\Gitary Setup x.x.x.exe

# 或运行便携版
# 解压 Gitary x.x.x-win.zip 后运行 Gitary.exe
```

**macOS:**
```bash
# 挂载 DMG 并安装
open dist/Gitary-x.x.x.dmg

# 或直接运行 App
open dist/mac/Gitary.app
```

**Linux:**
```bash
# 运行 AppImage
chmod +x dist/Gitary-x.x.x.AppImage
./dist/Gitary-x.x.x.AppImage

# 或安装 DEB 包
sudo dpkg -i dist/gitary_x.x.x_amd64.deb
```

### Q4: 打包文件太大怎么办？

**优化建议：**
1. 确保 `electron-builder.yml` 中正确排除了 `node_modules`
2. 检查 Web 构建产物是否已压缩（Vite 默认会压缩）
3. 考虑使用 `electron-builder` 的压缩选项

### Q5: 如何自定义安装程序？

修改 `electron-builder.yml` 中的 `nsis` 配置：

```yaml
nsis:
  oneClick: false                           # 允许自定义安装路径
  allowToChangeInstallationDirectory: true  # 允许用户选择安装目录
  createDesktopShortcut: true               # 创建桌面快捷方式
  createStartMenuShortcut: true            # 创建开始菜单快捷方式
```

## 📝 打包检查清单

打包前确认：

- [ ] Web 应用已构建（`dist/` 目录存在）
- [ ] Electron 主进程已构建（`apps/electron/dist/main/` 目录存在）
- [ ] 应用图标已准备（`resources/icons/` 目录存在）
- [ ] 已选择正确的打包平台命令
- [ ] 有足够的磁盘空间（至少 500MB）

打包后验证：

- [ ] 打包产物已生成在 `apps/electron/dist/` 目录
- [ ] 可以正常安装/运行打包后的应用
- [ ] 应用可以正常加载 UI（本地文件或远程 URL）
- [ ] 应用功能正常

## 🎯 快速打包命令（一键打包）

如果你经常需要打包，可以在项目根目录的 `package.json` 中添加快捷命令：

```json
{
  "scripts": {
    "pack:electron": "pnpm build --filter @gitary/web && cd apps/electron && pnpm build && pnpm pack",
    "pack:electron:win": "pnpm build --filter @gitary/web && cd apps/electron && pnpm build && pnpm pack:win"
  }
}
```

然后就可以从项目根目录一键打包：

```bash
# 打包所有平台
pnpm pack:electron

# 只打包 Windows
pnpm pack:electron:win
```

