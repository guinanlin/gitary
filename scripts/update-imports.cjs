#!/usr/bin/env node

/**
 * 导入路径更新脚本
 * 
 * 功能：
 * 1. 批量更新导入路径
 * 2. 支持路径别名替换
 * 3. 支持相对路径更新
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_SRC = path.join(ROOT_DIR, 'apps/web/src');

// 导入路径替换规则
const IMPORT_REPLACEMENTS = [
  // 工具层
  { from: /from ['"]@\/xbook\//g, to: "from '@toolkit/xbook/" },
  { from: /from ['"]xbook\//g, to: "from '@toolkit/xbook/" },
  { from: /from ['"]@\/helpers\//g, to: "from '@toolkit/utils/helpers/" },
  { from: /from ['"]@\/monaco\//g, to: "from '@toolkit/monaco/" },
  
  // 库封装
  { from: /from ['"]libs\//g, to: "from '@lib/" },
  
  // 服务层
  { from: /from ['"]@\/services\//g, to: "from '@service/" },
  
  // 插件层
  { from: /from ['"]@\/plugins\//g, to: "from '@plugin/" },
  
  // 应用层
  { from: /from ['"]@\/components\//g, to: "from '@app/components/" },
  { from: /from ['"]@\/features\//g, to: "from '@app/features/" },
  { from: /from ['"]@\/hooks\//g, to: "from '@app/hooks/" },
  { from: /from ['"]@\/i18n\//g, to: "from '@app/i18n/" },
  { from: /from ['"]@\/constants\//g, to: "from '@app/constants/" },
  { from: /from ['"]@\/types\//g, to: "from '@app/types/" },
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getAllFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  IMPORT_REPLACEMENTS.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

function updateImports() {
  console.log('🔄 更新导入路径...\n');
  
  if (!fs.existsSync(WEB_SRC)) {
    console.log('  ⚠️  apps/web/src 目录不存在，请先执行 Monorepo 迁移');
    return;
  }
  
  const files = getAllFiles(WEB_SRC);
  let updatedCount = 0;
  
  files.forEach(file => {
    if (updateImportsInFile(file)) {
      console.log(`  ✅ 更新: ${path.relative(ROOT_DIR, file)}`);
      updatedCount++;
    }
  });
  
  console.log(`\n✅ 共更新 ${updatedCount} 个文件`);
}

function main() {
  console.log('🚀 开始更新导入路径...\n');
  
  // updateImports();
  
  console.log('\n✅ 导入路径更新准备完成！');
  console.log('💡 请检查替换规则后执行 updateImports() 函数');
}

if (require.main === module) {
  main();
}

module.exports = { updateImports, updateImportsInFile };

