# Electron 应用图标

## 当前状态

✅ **所有图标已准备就绪**:
- `icon.png` (512x512) - Linux 图标
- `icon.ico` - Windows 图标
- `icon.icns` - macOS 图标

## 重新生成图标

如果需要重新生成图标，运行：

```bash
# 在 apps/electron 目录下
pnpm generate-icons
```

这个命令会：
1. 从 `icon-512x512.png` 生成所有格式的图标
2. 自动将文件移动到正确位置
3. 清理临时文件

## 快速生成图标

### 方法 1: 使用在线工具（最简单）

1. **Windows 图标 (.ico)**:
   - 访问: https://convertio.co/zh/png-ico/
   - 上传 `icon-512x512.png`
   - 下载生成的 `icon.ico` 到本目录

2. **macOS 图标 (.icns)**:
   - 访问: https://cloudconvert.com/png-to-icns
   - 上传 `icon-512x512.png`
   - 下载生成的 `icon.icns` 到本目录

### 方法 2: 使用 electron-icon-maker

```bash
# 安装工具
npm install -g electron-icon-maker

# 生成所有格式的图标
electron-icon-maker --input=icon-512x512.png --output=./
```

### 方法 3: 使用 ImageMagick

```bash
# Windows 图标
convert icon-512x512.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# macOS 图标
convert icon-512x512.png icon.icns
```

### 方法 4: macOS 使用 iconutil（仅 macOS）

```bash
# 创建 iconset 目录
mkdir icon.iconset

# 复制不同尺寸的图标
cp icon-512x512.png icon.iconset/icon_512x512.png
# ... 其他尺寸

# 生成 icns
iconutil -c icns icon.iconset
```

## 图标要求

- **Windows (.ico)**: 建议包含多个尺寸 (16x16, 32x32, 48x48, 256x256)
- **macOS (.icns)**: 建议至少 512x512 像素
- **Linux (.png)**: 至少 512x512 像素（已准备）

## 验证

生成图标后，可以运行：

```bash
# 在 apps/electron 目录下
node scripts/generate-icons.js
```

## 临时方案

如果没有生成 .ico 和 .icns 文件，electron-builder 会使用默认图标。应用仍然可以正常构建和运行。
