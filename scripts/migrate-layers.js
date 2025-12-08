#!/usr/bin/env node

/**
 * 分层架构迁移脚本
 * 
 * 功能：
 * 1. 迁移工具层代码到 toolkit/
 * 2. 迁移服务层代码到 service/
 * 3. 迁移插件层代码到 plugin/
 * 4. 迁移应用层代码到 app/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_SRC = path.join(ROOT_DIR, 'apps/web/src');

// 工具层迁移映射
const TOOLKIT_MIGRATIONS = [
  { from: 'xbook', to: 'toolkit/xbook' },
  { from: 'helpers', to: 'toolkit/utils/helpers' },
  { from: 'monaco', to: 'toolkit/monaco' },
];

// 库封装迁移映射
const LIB_MIGRATIONS = [
  { from: '../../libs', to: 'lib' },
];

// 服务层迁移映射
const SERVICE_MIGRATIONS = [
  { from: 'services', to: 'service' },
];

// 插件层迁移映射
const PLUGIN_MIGRATIONS = [
  { from: 'plugins', to: 'plugin' },
];

// 应用层迁移映射
const APP_MIGRATIONS = [
  { from: 'main.tsx', to: 'app/main.tsx' },
  { from: 'components', to: 'app/components' },
  { from: 'features', to: 'app/features' },
  { from: 'hooks', to: 'app/hooks' },
  { from: 'i18n', to: 'app/i18n' },
  { from: 'constants', to: 'app/constants' },
  { from: 'types', to: 'app/types' },
];

function moveWithGitMv(from, to, baseDir = WEB_SRC) {
  const fromPath = path.join(baseDir, from);
  const toPath = path.join(baseDir, to);
  
  if (!fs.existsSync(fromPath)) {
    console.log(`  ⚠️  文件不存在，跳过: ${from}`);
    return false;
  }
  
  try {
    // 确保目标目录存在
    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }
    
    // 使用 git mv 保持历史
    execSync(`git mv "${fromPath}" "${toPath}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log(`  ✅ 移动: ${from} → ${to}`);
    return true;
  } catch (error) {
    console.error(`  ❌ 移动失败: ${from} → ${to}`, error.message);
    return false;
  }
}

function migrateToolkit() {
  console.log('🔧 迁移工具层...');
  TOOLKIT_MIGRATIONS.forEach(({ from, to }) => {
    moveWithGitMv(from, to);
  });
}

function migrateLib() {
  console.log('📚 迁移库封装...');
  // libs 在根目录，需要特殊处理
  const libsPath = path.join(ROOT_DIR, 'libs');
  const targetPath = path.join(WEB_SRC, 'lib');
  
  if (fs.existsSync(libsPath)) {
    try {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      execSync(`git mv "${libsPath}" "${targetPath}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log(`  ✅ 移动: libs → apps/web/src/lib`);
    } catch (error) {
      console.error(`  ❌ 移动失败: libs`, error.message);
    }
  }
}

function migrateService() {
  console.log('⚙️  迁移服务层...');
  SERVICE_MIGRATIONS.forEach(({ from, to }) => {
    moveWithGitMv(from, to);
  });
}

function migratePlugin() {
  console.log('🔌 迁移插件层...');
  PLUGIN_MIGRATIONS.forEach(({ from, to }) => {
    moveWithGitMv(from, to);
  });
}

function migrateApp() {
  console.log('📱 迁移应用层...');
  APP_MIGRATIONS.forEach(({ from, to }) => {
    moveWithGitMv(from, to);
  });
}

function main() {
  console.log('🚀 开始分层架构迁移...\n');
  
  // 按顺序执行迁移
  // migrateToolkit();
  // migrateLib();
  // migrateService();
  // migratePlugin();
  // migrateApp();
  
  console.log('\n✅ 分层架构迁移准备完成！');
  console.log('💡 请根据阶段计划逐步执行迁移');
}

if (require.main === module) {
  main();
}

module.exports = {
  migrateToolkit,
  migrateLib,
  migrateService,
  migratePlugin,
  migrateApp
};

