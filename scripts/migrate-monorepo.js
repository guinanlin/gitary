#!/usr/bin/env node

/**
 * Monorepo 结构迁移脚本
 * 
 * 功能：
 * 1. 创建 Monorepo 目录结构
 * 2. 移动应用代码到 apps/web/
 * 3. 更新基本配置
 * 
 * 注意：browser-extension 是独立的 Chrome addon，位于 apps/browser-extension/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// 需要创建的目录
const DIRS_TO_CREATE = [
  'apps/web',
  'config',
  'scripts'
];

// 需要移动的文件/目录（使用 git mv 保持历史）
// 注意：browser-extension 是独立的 Chrome addon，保持不变
const FILES_TO_MOVE = [
  { from: 'src', to: 'apps/web/src' },
  { from: 'public', to: 'apps/web/public' },
  { from: 'index.html', to: 'apps/web/index.html' },
];

// 需要移动到 config/ 的配置文件（阶段2使用）
const CONFIG_FILES_TO_MOVE = [
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'jest.config.js',
  'components.json',
  'splitChunks.ts',
  'tsconfig.node.json'
];

function createDirectories() {
  console.log('📁 创建目录结构...');
  DIRS_TO_CREATE.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  ✅ 创建目录: ${dir}`);
    } else {
      console.log(`  ⚠️  目录已存在: ${dir}`);
    }
  });
}

function moveFiles() {
  console.log('📦 移动文件（使用 git mv 保持历史）...');
  FILES_TO_MOVE.forEach(({ from, to }) => {
    const fromPath = path.join(ROOT_DIR, from);
    const toPath = path.join(ROOT_DIR, to);
    
    if (fs.existsSync(fromPath)) {
      try {
        // 确保目标目录存在
        const toDir = path.dirname(toPath);
        if (!fs.existsSync(toDir)) {
          fs.mkdirSync(toDir, { recursive: true });
        }
        
        // 使用 git mv 保持历史
        execSync(`git mv "${fromPath}" "${toPath}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
        console.log(`  ✅ 移动: ${from} → ${to}`);
      } catch (error) {
        console.error(`  ❌ 移动失败: ${from} → ${to}`, error.message);
        throw error;
      }
    } else {
      console.log(`  ⚠️  文件不存在，跳过: ${from}`);
    }
  });
}

function checkGitStatus() {
  console.log('🔍 检查 Git 状态...');
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf-8' });
    if (status.trim()) {
      console.log('  ⚠️  检测到未提交的更改:');
      console.log(status);
      console.log('  💡 建议：先提交或暂存当前更改');
    } else {
      console.log('  ✅ Git 工作区干净');
    }
  } catch (error) {
    console.error('  ❌ Git 状态检查失败:', error.message);
  }
}

function main() {
  console.log('🚀 开始 Monorepo 结构迁移...\n');
  
  checkGitStatus();
  console.log('');
  
  createDirectories();
  console.log('');
  
  console.log('⚠️  准备移动文件，这将使用 git mv 命令');
  console.log('⚠️  请确保已提交或暂存所有更改\n');
  
  // 询问确认（在实际执行时）
  // moveFiles();
  
  console.log('\n✅ Monorepo 结构迁移准备完成！');
  console.log('💡 请手动检查后执行 moveFiles() 函数');
}

if (require.main === module) {
  main();
}

module.exports = { createDirectories, moveFiles, checkGitStatus };

