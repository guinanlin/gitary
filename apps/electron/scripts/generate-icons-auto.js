import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconsDir = join(__dirname, '../resources/icons');
const sourceIcon = join(iconsDir, 'icon-512x512.png');
const outputDir = iconsDir;

console.log('🎨 自动生成 Electron 应用图标...\n');

if (!existsSync(sourceIcon)) {
  console.error('❌ 源图标文件不存在:', sourceIcon);
  console.log('请确保 icon-512x512.png 文件存在于 resources/icons/ 目录');
  process.exit(1);
}

console.log('✅ 源图标文件已找到:', sourceIcon);
console.log('📦 使用 electron-icon-maker 生成图标...\n');

try {
  execSync(
    `npx electron-icon-maker --input="${sourceIcon}" --output="${outputDir}"`,
    { stdio: 'inherit', cwd: join(__dirname, '..') }
  );
  
  const generatedIconsDir = join(outputDir, 'icons');
  const macIcon = join(generatedIconsDir, 'mac', 'icon.icns');
  const winIcon = join(generatedIconsDir, 'win', 'icon.ico');
  
  if (existsSync(macIcon)) {
    execSync(`cp "${macIcon}" "${join(outputDir, 'icon.icns')}"`, { stdio: 'inherit' });
    console.log('✅ macOS 图标已复制到正确位置');
  }
  
  if (existsSync(winIcon)) {
    execSync(`cp "${winIcon}" "${join(outputDir, 'icon.ico')}"`, { stdio: 'inherit' });
    console.log('✅ Windows 图标已复制到正确位置');
  }
  
  execSync(`rm -rf "${generatedIconsDir}"`, { stdio: 'inherit' });
  console.log('🧹 已清理临时文件');
  
  console.log('\n✅ 图标生成完成！');
  console.log('\n生成的文件：');
  console.log('  - icon.ico (Windows)');
  console.log('  - icon.icns (macOS)');
  console.log('  - icon.png (Linux)');
} catch (error) {
  console.error('\n❌ 图标生成失败:', error.message);
  console.log('\n💡 备选方案：');
  console.log('1. 使用在线工具转换: https://convertio.co/zh/png-ico/');
  console.log('2. 手动安装 electron-icon-maker: npm install -g electron-icon-maker');
  process.exit(1);
}

