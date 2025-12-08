# 重构迁移脚本

本目录包含项目目录结构重构所需的所有自动化脚本。

## 脚本列表

### 1. migrate-monorepo.js
**功能：** Monorepo 结构迁移
- 创建 Monorepo 目录结构
- 移动应用代码到 `apps/web/`
- 使用 `git mv` 保持 Git 历史

**使用方法：**
```bash
node scripts/migrate-monorepo.cjs
```

### 2. migrate-layers.js
**功能：** 分层架构迁移
- 迁移工具层代码到 `toolkit/`
- 迁移服务层代码到 `service/`
- 迁移插件层代码到 `plugin/`
- 迁移应用层代码到 `app/`

**使用方法：**
```bash
node scripts/migrate-layers.cjs
```

### 3. update-imports.js
**功能：** 批量更新导入路径
- 批量更新导入路径
- 支持路径别名替换
- 支持相对路径更新

**使用方法：**
```bash
node scripts/update-imports.cjs
```

### 4. verify-migration.js
**功能：** 验证迁移结果
- 检查目录结构
- 检查配置文件
- 检查导入路径
- 运行类型检查和构建验证

**使用方法：**
```bash
node scripts/verify-migration.cjs
```

### 5. create-backup.sh
**功能：** 创建备份分支和标签
- 创建备份分支
- 创建备份标签
- 推送到远程仓库

**使用方法：**
```bash
./scripts/create-backup.sh
```

## 注意事项

1. **执行前准备：**
   - 确保所有更改已提交或暂存
   - 确保 Git 工作区干净
   - 建议先创建备份分支

2. **脚本执行顺序：**
   - 阶段1：使用 `migrate-monorepo.cjs`
   - 阶段3-5：使用 `migrate-layers.cjs`
   - 每个阶段后：使用 `update-imports.cjs` 更新导入路径
   - 每个阶段后：使用 `verify-migration.cjs` 验证结果

3. **安全提示：**
   - 所有脚本都使用 `git mv` 保持 Git 历史
   - 建议在执行前创建备份分支
   - 建议在独立分支上执行迁移

## 相关文档

- `docs/project/项目架构重构/stage-0-preparation-plan.md` - 阶段0准备计划
- `docs/project/项目架构重构/refactor-implementation-plan.md` - 完整重构计划
- `docs/project/项目架构重构/migration-mapping.md` - 迁移映射表

