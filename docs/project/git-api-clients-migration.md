# Git API 客户端迁移文档

## 📋 概述

本文档描述如何将 `apps/web/libs/` 下的 Git API 客户端迁移到 `@dty/git-provider` 包中，以实现代码复用和统一管理。

## 🎯 迁移目标

### 源位置
```
apps/web/libs/
├── github-api/          → 迁移到 @dty/git-provider
│   ├── github-client.ts
│   └── github-fs.ts
├── gitee-api/           → 迁移到 @dty/git-provider
│   ├── gitee-client.ts
│   └── gitee-fs.ts
├── gitcode-api/         → 迁移到 @dty/git-provider（新增）
│   └── gitcode-client.ts
├── repo.ts              → 迁移类型定义
└── git-client.types.ts  → 迁移类型定义
```

### 目标位置
```
packages/git-provider/
├── src/
│   ├── clients/              # 新增：兼容旧 API 的客户端适配器
│   │   ├── github-client.ts  # 迁移自 apps/web/libs/github-api/github-client.ts
│   │   ├── github-fs.ts      # 迁移自 apps/web/libs/github-api/github-fs.ts
│   │   ├── gitee-client.ts   # 迁移自 apps/web/libs/gitee-api/gitee-client.ts
│   │   ├── gitee-fs.ts       # 迁移自 apps/web/libs/gitee-api/gitee-fs.ts
│   │   ├── gitcode-client.ts # 迁移自 apps/web/libs/gitcode-api/gitcode-client.ts
│   │   └── index.ts          # 统一导出
│   ├── providers/            # 现有：统一接口的 Provider
│   │   ├── github-provider.ts
│   │   ├── gitee-provider.ts
│   │   └── index.ts
│   ├── types/                # 现有：类型定义
│   │   ├── git-client.ts
│   │   └── index.ts
│   └── index.ts
```

## 📊 现状分析

### 现有实现差异

#### 1. API 接口差异

**`apps/web/libs/` 中的客户端** (旧版 API)：
```typescript
// 返回 GiteeClient 类型
const client = createGithubClient({ getAccessToken: () => token });
client.File.get({ owner, repo, path });
client.Repo.getList({ page: 1, per_page: 20 });
client.User.getInfo();
client.Branch.getList({ owner, repo });
```

**`@dty/git-provider` 中的 Provider** (新版 API)：
```typescript
// 实现 GitProvider 接口
const provider = new GitHubProvider({ token });
provider.getFile({ owner, repo, path });
provider.getRepository({ owner, repo });
provider.getUserInfo();
provider.getBranches({ owner, repo });
```

#### 2. 依赖差异

- **旧版**：使用 `redaxios` 和 `octokit` (GitHub)
- **新版**：使用原生 `fetch` API

#### 3. 功能差异

- **旧版**：包含文件系统封装（`createGiteeFS`, `createGithubFS`）
- **旧版**：包含 OAuth 相关辅助函数（`getGithubLoginUrl`, `getGithubAccessToken` 等）
- **新版**：专注于统一的 GitProvider 接口

### 使用位置

通过代码搜索，发现以下位置在使用旧版客户端：

1. **`apps/web/src/plugins/space/platforms/index.ts`**
   - 使用 `createGiteeClient`, `createGithubClient`, `createGitcodeClient`
   - 用于注册平台提供者

2. **`apps/web/src/features/git-commit-panel/components/git-commit-panel.tsx`**
   - 使用 `createGithubClient`, `createGiteeClient`, `createGitcodeClient`
   - 用于 Git 提交操作

3. **`apps/web/src/plugins/services/auth/providers/gitcode/`**
   - 可能使用 GitCode 相关功能

## 🚀 迁移方案

### 方案选择：兼容层 + 渐进式迁移

考虑到：
1. 现有代码大量使用旧版 API
2. 需要保持向后兼容
3. 新版 Provider 接口已经存在

**推荐方案**：在 `@dty/git-provider` 包中同时提供：
1. **旧版客户端** (兼容层)：迁移 `apps/web/libs/` 中的实现
2. **新版 Provider** (统一接口)：保持现有实现
3. 逐步迁移到新版 API

### 迁移步骤

#### Phase 1: 迁移旧版客户端到兼容层

##### Step 1.1: 创建目录结构
```bash
cd packages/git-provider
mkdir -p src/clients
```

##### Step 1.2: 迁移 GitHub 客户端

**文件**: `packages/git-provider/src/clients/github-client.ts`
- 复制 `apps/web/libs/github-api/github-client.ts`
- 调整导入路径：
  - `libs/git-client.types` → `../types/compat`
  - `libs/repo` → `../types/compat`
  - `libs/github-api/github-fs` → `./github-fs`
- 保持原有 API 不变

**文件**: `packages/git-provider/src/clients/github-fs.ts`
- 复制 `apps/web/libs/github-api/github-fs.ts`
- 调整导入路径

##### Step 1.3: 迁移 Gitee 客户端

**文件**: `packages/git-provider/src/clients/gitee-client.ts`
- 复制 `apps/web/libs/gitee-api/gitee-client.ts`
- 调整导入路径

**文件**: `packages/git-provider/src/clients/gitee-fs.ts`
- 复制 `apps/web/libs/gitee-api/gitee-fs.ts`
- 调整导入路径

##### Step 1.4: 迁移 GitCode 客户端（新增支持）

**文件**: `packages/git-provider/src/clients/gitcode-client.ts`
- 复制 `apps/web/libs/gitcode-api/gitcode-client.ts`
- 调整导入路径
- 添加 `gitcode-fs.ts` 支持（参考 gitee-fs.ts 实现）

##### Step 1.5: 迁移类型定义

**文件**: `packages/git-provider/src/types/compat/git-client.types.ts`
- 复制 `apps/web/libs/git-client.types.ts`

**文件**: `packages/git-provider/src/types/compat/repo.ts`
- 复制 `apps/web/libs/repo.ts`

**文件**: `packages/git-provider/src/types/compat/index.ts`
- 导出所有兼容类型

##### Step 1.6: 创建统一导出

**文件**: `packages/git-provider/src/clients/index.ts`
```typescript
export * from './github-client';
export * from './github-fs';
export * from './gitee-client';
export * from './gitee-fs';
export * from './gitcode-client';
export * from '../types/compat';
```

##### Step 1.7: 更新主导出文件

**文件**: `packages/git-provider/src/index.ts`
```typescript
// 新版统一接口
export * from './providers';
export * from './types';

// 旧版兼容客户端（向后兼容）
export * from './clients';
```

#### Phase 2: 更新依赖和构建

##### Step 2.1: 更新 package.json

**文件**: `packages/git-provider/package.json`
```json
{
  "dependencies": {
    "axios": "^1.9.0",
    "js-base64": "^3.7.5",
    "octokit": "^4.0.2",
    "redaxios": "^0.5.1"
  }
}
```

##### Step 2.2: 更新 TypeScript 配置

确保类型定义正确导出，检查 `tsconfig.json`

#### Phase 3: 更新 apps/web 中的导入

##### Step 3.1: 批量替换导入路径

**全局替换规则**：
```typescript
// 替换前
import { createGithubClient } from "libs/github-api";
import { createGiteeClient } from "libs/gitee-api";
import { createGitcodeClient } from "libs/gitcode-api/gitcode-client";
import { RepoResponse } from "libs/repo";
import { GiteeClient } from "libs/git-client.types";

// 替换后
import { 
  createGithubClient, 
  createGiteeClient, 
  createGitcodeClient,
  RepoResponse,
  GiteeClient
} from "@dty/git-provider/clients";
```

**或者更简洁的导入**：
```typescript
import { 
  createGithubClient, 
  createGiteeClient, 
  createGitcodeClient,
  RepoResponse,
  GiteeClient
} from "@dty/git-provider";
```

##### Step 3.2: 更新具体文件

1. **`apps/web/src/plugins/space/platforms/index.ts`**
   ```typescript
   // 替换
   import { createGiteeClient } from "libs/gitee-api";
   import { createGithubClient } from "libs/github-api";
   import { createGitcodeClient } from "libs/gitcode-api/gitcode-client";
   
   // 为
   import { 
     createGiteeClient, 
     createGithubClient, 
     createGitcodeClient 
   } from "@dty/git-provider";
   ```

2. **`apps/web/src/features/git-commit-panel/components/git-commit-panel.tsx`**
   ```typescript
   // 同样替换导入
   ```

#### Phase 4: 删除旧代码并验证

##### Step 4.1: 删除旧文件
```bash
rm -rf apps/web/libs/github-api
rm -rf apps/web/libs/gitee-api
rm -rf apps/web/libs/gitcode-api
rm apps/web/libs/repo.ts
rm apps/web/libs/git-client.types.ts
```

##### Step 4.2: 更新 apps/web/package.json

移除不再需要的依赖（如果它们只被旧代码使用）：
```json
{
  "dependencies": {
    // 如果 redaxios、octokit、js-base64 只被 git 客户端使用，
    // 可以从这里移除（它们现在在 @dty/git-provider 包中）
  }
}
```

##### Step 4.3: 测试验证

1. **功能测试**：
   - [ ] GitHub 仓库操作
   - [ ] Gitee 仓库操作
   - [ ] GitCode 仓库操作
   - [ ] 文件系统操作
   - [ ] OAuth 认证流程

2. **构建测试**：
   ```bash
   cd packages/git-provider
   pnpm build
   
   cd apps/web
   pnpm build
   ```

3. **类型检查**：
   ```bash
   cd apps/web
   pnpm typecheck
   ```

#### Phase 5: 文档和清理

##### Step 5.1: 更新 README

在 `packages/git-provider/README.md` 中添加：
- 旧版兼容客户端的使用说明
- 迁移指南
- API 对比表

##### Step 5.2: 添加迁移说明

说明：
- 旧版客户端将在未来版本中废弃
- 推荐逐步迁移到新版 Provider API
- 提供迁移示例

## 📝 详细迁移清单

### 文件迁移清单

| 源文件 | 目标文件 | 状态 | 备注 |
|--------|----------|------|------|
| `apps/web/libs/github-api/github-client.ts` | `packages/git-provider/src/clients/github-client.ts` | ⏳ | 需要调整导入 |
| `apps/web/libs/github-api/github-fs.ts` | `packages/git-provider/src/clients/github-fs.ts` | ⏳ | 需要调整导入 |
| `apps/web/libs/gitee-api/gitee-client.ts` | `packages/git-provider/src/clients/gitee-client.ts` | ⏳ | 需要调整导入 |
| `apps/web/libs/gitee-api/gitee-fs.ts` | `packages/git-provider/src/clients/gitee-fs.ts` | ⏳ | 需要调整导入 |
| `apps/web/libs/gitcode-api/gitcode-client.ts` | `packages/git-provider/src/clients/gitcode-client.ts` | ⏳ | 需要调整导入 |
| `apps/web/libs/gitcode-api/gitcode-fs.ts` | `packages/git-provider/src/clients/gitcode-fs.ts` | ⏳ | **需要创建**（参考 gitee-fs） |
| `apps/web/libs/repo.ts` | `packages/git-provider/src/types/compat/repo.ts` | ⏳ | 类型定义 |
| `apps/web/libs/git-client.types.ts` | `packages/git-provider/src/types/compat/git-client.types.ts` | ⏳ | 类型定义 |

### 依赖迁移清单

| 依赖包 | 来源 | 目标 | 状态 |
|--------|------|------|------|
| `redaxios` | `apps/web/package.json` | `packages/git-provider/package.json` | ⏳ |
| `octokit` | `apps/web/package.json` | `packages/git-provider/package.json` | ⏳ |
| `js-base64` | `apps/web/package.json` | `packages/git-provider/package.json` | ⏳ |

### 导入替换清单

| 文件 | 旧导入 | 新导入 | 状态 |
|------|--------|--------|------|
| `apps/web/src/plugins/space/platforms/index.ts` | `libs/gitee-api` | `@dty/git-provider` | ⏳ |
| `apps/web/src/plugins/space/platforms/index.ts` | `libs/github-api` | `@dty/git-provider` | ⏳ |
| `apps/web/src/plugins/space/platforms/index.ts` | `libs/gitcode-api/gitcode-client` | `@dty/git-provider` | ⏳ |
| `apps/web/src/features/git-commit-panel/...` | `libs/github-api` | `@dty/git-provider` | ⏳ |
| `apps/web/src/features/git-commit-panel/...` | `libs/gitee-api` | `@dty/git-provider` | ⏳ |
| `apps/web/src/features/git-commit-panel/...` | `libs/gitcode-api/gitcode-client` | `@dty/git-provider` | ⏳ |

## ⚠️ 注意事项

### 1. 导入路径调整

迁移时需要特别注意：
- **相对路径导入**：需要根据新位置调整
- **类型导入**：确保类型正确导出
- **循环依赖**：避免产生循环依赖

### 2. 依赖管理

- `redaxios`, `octokit`, `js-base64` 需要在 `@dty/git-provider` 包的 `package.json` 中添加
- 检查这些依赖是否在其他地方使用，决定是否从 `apps/web` 中移除

### 3. 类型兼容性

- 确保迁移后的类型定义与原有代码兼容
- 可能需要创建类型别名来保持向后兼容

### 4. 测试覆盖

迁移后需要确保：
- 所有 Git 操作功能正常
- OAuth 认证流程正常
- 文件系统操作正常
- 错误处理正常

### 5. 构建配置

- 确保 TypeScript 配置正确
- 确保构建输出包含所有必要的文件
- 检查类型声明文件（.d.ts）是否正确生成

## 🔄 后续计划

### 短期（迁移后 1-2 周）

1. ✅ 完成代码迁移
2. ✅ 验证所有功能正常
3. ✅ 更新文档

### 中期（迁移后 1-2 个月）

1. 逐步迁移到新版 Provider API
2. 废弃旧版客户端 API
3. 统一使用 `GitProvider` 接口

### 长期（迁移后 3-6 个月）

1. 移除旧版兼容客户端
2. 完全统一到新版 API
3. 优化代码结构和性能

## 📚 参考资料

- [现有 git-provider 包结构](./packages/git-provider/README.md)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [Gitee API 文档](https://gitee.com/api/v5/swagger)
- [GitCode API 文档](https://gitcode.com/api-docs)

## ✅ 检查清单

迁移前：
- [ ] 备份现有代码
- [ ] 确认所有使用位置
- [ ] 准备测试用例

迁移中：
- [ ] 创建新目录结构
- [ ] 迁移代码文件
- [ ] 调整导入路径
- [ ] 更新类型定义
- [ ] 更新 package.json
- [ ] 更新导入语句

迁移后：
- [ ] 运行类型检查
- [ ] 运行构建测试
- [ ] 运行功能测试
- [ ] 删除旧文件
- [ ] 更新文档
- [ ] 提交代码

---

**创建日期**: 2025-01-27  
**最后更新**: 2025-01-27  
**负责人**: [待填写]  
**状态**: 📝 待执行
