#!/usr/bin/env node

/**
 * Stage 1 最小化迁移脚本
 * 只移动应用代码到 apps/web/，不改变 Monorepo 配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

function log(message) {
  console.log(`[迁移脚本] ${message}`);
}

function error(message) {
  console.error(`[错误] ${message}`);
  process.exit(1);
}

function checkGitClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      error('Git 工作区不干净，请先提交或暂存所有更改');
    }
    log('✓ Git 工作区干净');
  } catch (e) {
    error('无法检查 Git 状态');
  }
}

function checkFilesExist() {
  const requiredFiles = ['src', 'public', 'index.html'];
  const missing = requiredFiles.filter(file => {
    const filePath = path.join(ROOT_DIR, file);
    return !fs.existsSync(filePath);
  });

  if (missing.length > 0) {
    error(`缺少必要文件: ${missing.join(', ')}`);
  }
  log('✓ 所有必要文件存在');
}

function createAppsWebDir() {
  const appsWebDir = path.join(ROOT_DIR, 'apps', 'web');
  if (fs.existsSync(appsWebDir)) {
    error('apps/web 目录已存在，请先删除或重命名');
  }
  fs.mkdirSync(appsWebDir, { recursive: true });
  log('✓ 创建 apps/web 目录');
}

function moveFiles() {
  const moves = [
    { from: 'src', to: 'apps/web/src' },
    { from: 'public', to: 'apps/web/public' },
    { from: 'index.html', to: 'apps/web/index.html' },
  ];

  log('开始移动文件（使用 git mv 保持历史）...');
  moves.forEach(({ from, to }) => {
    try {
      execSync(`git mv ${from} ${to}`, { cwd: ROOT_DIR, stdio: 'inherit' });
      log(`✓ 移动 ${from} → ${to}`);
    } catch (e) {
      error(`移动 ${from} 失败: ${e.message}`);
    }
  });
}

function updateViteConfig() {
  const viteConfigPath = path.join(ROOT_DIR, 'vite.config.ts');
  if (!fs.existsSync(viteConfigPath)) {
    error('vite.config.ts 不存在');
  }

  let content = fs.readFileSync(viteConfigPath, 'utf-8');

  // 更新路径别名 - 精确匹配
  content = content.replace(
    /replacement: resolve\(__dirname, "src"\)/g,
    'replacement: resolve(__dirname, "apps/web/src")'
  );

  content = content.replace(
    /replacement: resolve\(__dirname, "src\/xbook"\)/g,
    'replacement: resolve(__dirname, "apps/web/src/xbook")'
  );

  // libs 路径保持不变（因为 libs 还在根目录）
  // replacement: resolve(__dirname, "libs") 不需要修改

  // 更新入口文件
  content = content.replace(
    /app: "index\.html"/g,
    'app: "apps/web/index.html"'
  );

  // 输出目录保持 dist/（在根目录），或者可以改为 apps/web/dist/
  // 暂时保持 dist/，后续可以调整

  fs.writeFileSync(viteConfigPath, content, 'utf-8');
  log('✓ 更新 vite.config.ts');
}

function updateTsConfig() {
  const tsConfigPath = path.join(ROOT_DIR, 'tsconfig.json');
  if (!fs.existsSync(tsConfigPath)) {
    error('tsconfig.json 不存在');
  }

  const config = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));

  // 更新 paths
  if (config.compilerOptions && config.compilerOptions.paths) {
    const paths = config.compilerOptions.paths;
    
    if (paths['@/*']) {
      paths['@/*'] = ['./apps/web/src/*'];
    }
    
    if (paths['xbook/*']) {
      paths['xbook/*'] = ['./apps/web/src/xbook/*'];
    }
    
    if (paths['xbook']) {
      paths['xbook'] = ['./apps/web/src/xbook'];
    }
    
    // libs 保持不变
    // paths['libs/*'] 不需要修改
  }

  // 更新 include
  if (config.include) {
    config.include = config.include.map(item => {
      if (item === 'src') {
        return 'apps/web/src';
      }
      return item;
    });
  }

  fs.writeFileSync(tsConfigPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  log('✓ 更新 tsconfig.json');
}

function main() {
  log('开始 Stage 1 最小化迁移...');
  log('');

  // 1. 检查 Git 状态
  log('步骤 1: 检查 Git 状态');
  checkGitClean();
  log('');

  // 2. 检查必要文件
  log('步骤 2: 检查必要文件');
  checkFilesExist();
  log('');

  // 3. 创建目录
  log('步骤 3: 创建 apps/web 目录');
  createAppsWebDir();
  log('');

  // 4. 移动文件
  log('步骤 4: 移动文件');
  moveFiles();
  log('');

  // 5. 更新配置文件
  log('步骤 5: 更新配置文件');
  updateViteConfig();
  updateTsConfig();
  log('');

  log('✅ 迁移完成！');
  log('');
  log('下一步操作：');
  log('1. 检查更改: git status');
  log('2. 查看差异: git diff');
  log('3. 测试功能: pnpm dev');
  log('4. 如果一切正常，提交更改: git commit -m "refactor: move app code to apps/web"');
  log('');
  log('⚠️  如果发现问题，可以使用以下命令回滚：');
  log('   git reset --hard HEAD');
}

main();

