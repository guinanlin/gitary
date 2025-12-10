import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconsDir = join(__dirname, '../resources/icons');
const sourceIcon = join(iconsDir, 'icon-512x512.png');

console.log('🎨 生成 Electron 应用图标...\n');

if (!existsSync(sourceIcon)) {
  console.error('❌ 源图标文件不存在:', sourceIcon);
  console.log('请确保 icon-512x512.png 文件存在于 resources/icons/ 目录');
  process.exit(1);
}

console.log('✅ 源图标文件已找到:', sourceIcon);
console.log('\n📝 图标生成说明：\n');

console.log('由于 .ico 和 .icns 格式需要特殊工具，请使用以下方法之一：\n');

console.log('方法 1: 使用在线工具（推荐）');
console.log('1. 访问 https://convertio.co/zh/png-ico/ 或 https://cloudconvert.com/png-to-ico');
console.log('2. 上传 icon-512x512.png');
console.log('3. 下载生成的 icon.ico 文件到 resources/icons/ 目录\n');

console.log('方法 2: 使用 ImageMagick（如果已安装）');
console.log('运行以下命令：');
console.log('  convert icon-512x512.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico');
console.log('  convert icon-512x512.png icon.icns\n');

console.log('方法 3: 使用 electron-icon-maker（需要安装）');
console.log('  npm install -g electron-icon-maker');
console.log('  electron-icon-maker --input=icon-512x512.png --output=./resources/icons\n');

console.log('方法 4: macOS 使用 iconutil（仅 macOS）');
console.log('  1. 创建 iconset 目录结构');
console.log('  2. 运行: iconutil -c icns icon.iconset\n');

console.log('⚠️  注意：');
console.log('- Linux 图标 (icon.png) 已准备就绪');
console.log('- Windows 图标 (icon.ico) 需要转换');
console.log('- macOS 图标 (icon.icns) 需要转换');
console.log('\n如果暂时没有这些文件，electron-builder 会使用默认图标。');


