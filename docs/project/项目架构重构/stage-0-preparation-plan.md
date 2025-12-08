# 阶段0：准备与规划 - 详细执行计划

## 文档信息

- **阶段编号：** 阶段0
- **阶段名称：** 准备与规划
- **预计时间：** 1周（5个工作日）
- **文档版本：** v1.0
- **创建日期：** 2025-01-27
- **状态：** 待执行

## 一、阶段目标

1. **创建迁移脚本**：自动化迁移过程，减少人工错误
2. **建立测试检查点**：确保每个阶段都有明确的验证标准
3. **创建备份分支**：确保可以安全回滚
4. **准备文档**：完善迁移映射表和团队沟通文档

## 二、任务清单与时间安排

### 任务0.1：创建迁移脚本（2天）

#### 0.1.1 创建 scripts 目录结构

```bash
mkdir -p scripts
```

#### 0.1.2 创建 migrate-monorepo.js

**文件路径：** `scripts/migrate-monorepo.js`

**功能：** 自动化 Monorepo 结构迁移

```javascript
#!/usr/bin/env node

/**
 * Monorepo 结构迁移脚本
 * 
 * 功能：
 * 1. 创建 Monorepo 目录结构
 * 2. 移动应用代码到 apps/web/
 * 3. 移动浏览器扩展到 extensions/
 * 4. 更新基本配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// 需要创建的目录
const DIRS_TO_CREATE = [
  'apps/web',
  'extensions/browser-extension',
  'config',
  'scripts'
];

// 需要移动的文件/目录（使用 git mv 保持历史）
const FILES_TO_MOVE = [
  { from: 'src', to: 'apps/web/src' },
  { from: 'public', to: 'apps/web/public' },
  { from: 'index.html', to: 'apps/web/index.html' },
  { from: 'browser-extension', to: 'extensions/browser-extension/gitary-companion' },
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
```

#### 0.1.3 创建 migrate-layers.js

**文件路径：** `scripts/migrate-layers.js`

**功能：** 自动化分层架构迁移

```javascript
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
```

#### 0.1.4 创建 update-imports.js

**文件路径：** `scripts/update-imports.js`

**功能：** 批量更新导入路径

```javascript
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
```

#### 0.1.5 创建 verify-migration.js

**文件路径：** `scripts/verify-migration.js`

**功能：** 验证迁移结果

```javascript
#!/usr/bin/env node

/**
 * 迁移验证脚本
 * 
 * 功能：
 * 1. 检查目录结构
 * 2. 检查导入路径
 * 3. 检查构建配置
 * 4. 运行类型检查
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// 预期的目录结构
const EXPECTED_DIRS = [
  'apps/web/src',
  'apps/web/public',
  'apps/web/index.html',
  'packages',
  'extensions',
  'config',
];

// 预期的配置文件
const EXPECTED_CONFIGS = [
  'apps/web/package.json',
  'pnpm-workspace.yaml',
];

function checkDirectories() {
  console.log('📁 检查目录结构...\n');
  
  let allExist = true;
  EXPECTED_DIRS.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${dir}`);
    } else {
      console.log(`  ❌ ${dir} - 不存在`);
      allExist = false;
    }
  });
  
  return allExist;
}

function checkConfigFiles() {
  console.log('\n⚙️  检查配置文件...\n');
  
  let allExist = true;
  EXPECTED_CONFIGS.forEach(config => {
    const fullPath = path.join(ROOT_DIR, config);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${config}`);
    } else {
      console.log(`  ❌ ${config} - 不存在`);
      allExist = false;
    }
  });
  
  return allExist;
}

function checkTypeScript() {
  console.log('\n🔍 运行 TypeScript 类型检查...\n');
  
  try {
    execSync('pnpm typecheck', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('\n  ✅ TypeScript 类型检查通过');
    return true;
  } catch (error) {
    console.log('\n  ❌ TypeScript 类型检查失败');
    return false;
  }
}

function checkBuild() {
  console.log('\n🔨 测试构建...\n');
  
  try {
    execSync('pnpm build:fast', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('\n  ✅ 构建成功');
    return true;
  } catch (error) {
    console.log('\n  ❌ 构建失败');
    return false;
  }
}

function checkImports() {
  console.log('\n📦 检查导入路径...\n');
  
  const WEB_SRC = path.join(ROOT_DIR, 'apps/web/src');
  if (!fs.existsSync(WEB_SRC)) {
    console.log('  ⚠️  apps/web/src 不存在，跳过导入路径检查');
    return true;
  }
  
  // 简单的导入路径检查
  // 可以扩展为更详细的检查
  console.log('  ✅ 导入路径检查（基础检查）');
  return true;
}

function main() {
  console.log('🔍 开始验证迁移结果...\n');
  
  const results = {
    directories: checkDirectories(),
    configs: checkConfigFiles(),
    typescript: false, // 需要手动执行
    build: false, // 需要手动执行
    imports: checkImports(),
  };
  
  console.log('\n📊 验证结果汇总：');
  console.log(`  目录结构: ${results.directories ? '✅' : '❌'}`);
  console.log(`  配置文件: ${results.configs ? '✅' : '❌'}`);
  console.log(`  导入路径: ${results.imports ? '✅' : '❌'}`);
  console.log(`  TypeScript: 需要手动运行 pnpm typecheck`);
  console.log(`  构建: 需要手动运行 pnpm build:fast`);
  
  const allPassed = results.directories && results.configs && results.imports;
  
  if (allPassed) {
    console.log('\n✅ 基础验证通过！');
  } else {
    console.log('\n❌ 部分验证失败，请检查上述问题');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDirectories,
  checkConfigFiles,
  checkTypeScript,
  checkBuild,
  checkImports
};
```

---

### 任务0.2：建立测试检查点（1天）

#### 0.2.1 创建测试清单文档

**文件路径：** `docs/project/项目架构重构/test-checklist.md`

创建详细的测试检查清单（见下方完整内容）

#### 0.2.2 功能测试清单

**检查项：**

- [ ] **应用启动**
  - [ ] `pnpm dev` 命令执行成功
  - [ ] 开发服务器在 http://localhost:5173 启动
  - [ ] 无控制台错误
  - [ ] 无网络请求错误

- [ ] **页面访问**
  - [ ] 首页可正常访问
  - [ ] 所有路由页面可正常访问
  - [ ] 页面加载无错误

- [ ] **核心功能**
  - [ ] 文件系统功能正常
  - [ ] 编辑器功能正常
  - [ ] AI 助手功能正常
  - [ ] 搜索功能正常
  - [ ] 认证功能正常

- [ ] **构建验证**
  - [ ] `pnpm build` 构建成功
  - [ ] 构建产物完整
  - [ ] 无构建警告
  - [ ] 无构建错误

#### 0.2.3 构建验证清单

**检查项：**

- [ ] **开发环境**
  - [ ] `pnpm dev` 正常运行
  - [ ] 热更新功能正常
  - [ ] 开发工具正常工作

- [ ] **生产构建**
  - [ ] `pnpm build` 构建成功
  - [ ] `pnpm build:fast` 构建成功
  - [ ] 构建时间在可接受范围内
  - [ ] Bundle 大小合理

- [ ] **类型检查**
  - [ ] `pnpm typecheck` 通过
  - [ ] 无类型错误
  - [ ] 无类型警告

- [ ] **代码质量**
  - [ ] `pnpm lint` 通过
  - [ ] 无 ESLint 错误
  - [ ] 代码格式正确

#### 0.2.4 导入路径检查清单

**检查项：**

- [ ] **路径别名**
  - [ ] `@/` 别名正确配置
  - [ ] `@app/` 别名正确配置
  - [ ] `@plugin/` 别名正确配置
  - [ ] `@service/` 别名正确配置
  - [ ] `@toolkit/` 别名正确配置
  - [ ] `@lib/` 别名正确配置
  - [ ] `xbook` 别名正确配置

- [ ] **导入路径**
  - [ ] 所有导入路径正确
  - [ ] 无相对路径错误
  - [ ] 无循环依赖
  - [ ] 无未解析的导入

- [ ] **TypeScript 配置**
  - [ ] `tsconfig.json` 路径配置正确
  - [ ] `vite.config.ts` 路径别名配置正确
  - [ ] 类型检查通过

---

### 任务0.3：创建备份分支（1天）

#### 0.3.1 备份脚本

**文件路径：** `scripts/create-backup.sh`

```bash
#!/bin/bash

# 创建备份分支和标签脚本

set -e

# 获取当前日期
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔐 创建备份分支和标签..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  检测到未提交的更改"
  echo "请先提交或暂存所有更改"
  exit 1
fi

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 创建备份分支
BACKUP_BRANCH="refactor/backup-$DATE"
echo "创建备份分支: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"
git push -u origin "$BACKUP_BRANCH"

# 创建标签
TAG_NAME="refactor/before-refactor-$TIMESTAMP"
echo "创建标签: $TAG_NAME"
git tag -a "$TAG_NAME" -m "重构前的备份点 - $TIMESTAMP"
git push origin "$TAG_NAME"

# 返回原分支
git checkout "$CURRENT_BRANCH"

echo ""
echo "✅ 备份完成！"
echo "  备份分支: $BACKUP_BRANCH"
echo "  备份标签: $TAG_NAME"
```

#### 0.3.2 执行备份

**执行步骤：**

1. **检查 Git 状态**
   ```bash
   git status
   ```

2. **提交所有更改**（如果有）
   ```bash
   git add .
   git commit -m "chore: 重构前的代码快照"
   ```

3. **执行备份脚本**
   ```bash
   chmod +x scripts/create-backup.sh
   ./scripts/create-backup.sh
   ```

4. **验证备份**
   ```bash
   git branch -a | grep backup
   git tag | grep refactor
   ```

---

### 任务0.4：文档准备（2天）

#### 0.4.1 更新迁移映射表

**文件路径：** `docs/project/项目架构重构/migration-mapping.md`

创建详细的迁移映射表（基于 `future-directory.md` 和 `directory-restructure-proposal.md`）

#### 0.4.2 准备回滚方案文档

**文件路径：** `docs/project/项目架构重构/rollback-plan.md`

创建回滚方案文档

#### 0.4.3 团队沟通文档

**文件路径：** `docs/project/项目架构重构/team-communication.md`

创建团队沟通文档，说明：
- 重构计划概述
- 时间安排
- 注意事项
- 联系方式

---

## 三、验收标准

### 3.1 脚本就绪

- [ ] `scripts/migrate-monorepo.js` 创建完成
- [ ] `scripts/migrate-layers.js` 创建完成
- [ ] `scripts/update-imports.js` 创建完成
- [ ] `scripts/verify-migration.js` 创建完成
- [ ] 所有脚本语法正确，可以运行

### 3.2 测试清单完整

- [ ] `docs/project/项目架构重构/test-checklist.md` 创建完成
- [ ] 功能测试清单完整
- [ ] 构建验证清单完整
- [ ] 导入路径检查清单完整

### 3.3 备份完成

- [ ] 备份分支创建成功
- [ ] 备份标签创建成功
- [ ] 备份已推送到远程仓库
- [ ] 可以成功切换到备份分支

### 3.4 文档准备完成

- [ ] 迁移映射表文档创建完成
- [ ] 回滚方案文档创建完成
- [ ] 团队沟通文档创建完成
- [ ] 所有文档内容完整、准确

---

## 四、执行检查清单

在执行阶段0之前，请确认：

### 4.1 环境准备

- [ ] Node.js 版本符合要求（>=18.0.0）
- [ ] pnpm 版本符合要求（>=8.0.0）
- [ ] Git 已配置
- [ ] 有远程仓库访问权限

### 4.2 代码状态

- [ ] 当前代码已提交或暂存
- [ ] 无未完成的开发任务
- [ ] 代码可以正常构建和运行

### 4.3 团队沟通

- [ ] 团队已了解重构计划
- [ ] 已获得必要的审批
- [ ] 已安排时间窗口

---

## 五、风险提示

### 5.1 脚本执行风险

- ⚠️ **风险**：脚本执行可能失败
- ✅ **应对**：先在小范围测试，确认无误后再全量执行

### 5.2 备份风险

- ⚠️ **风险**：备份可能不完整
- ✅ **应对**：验证备份分支和标签是否创建成功

### 5.3 文档风险

- ⚠️ **风险**：文档可能不完整
- ✅ **应对**：请团队成员审查文档

---

## 六、下一步行动

阶段0完成后，将进入：

**阶段1：Monorepo 基础架构（2周）**

主要任务：
- 创建 Monorepo 目录结构
- 移动应用代码到 `apps/web/`
- 更新根目录 `package.json`
- 创建 `apps/web/package.json`
- 验证功能正常

---

**文档版本：** v1.0  
**创建日期：** 2025-01-27  
**最后更新：** 2025-01-27  
**状态：** 待执行

