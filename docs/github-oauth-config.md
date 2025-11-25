# GitHub OAuth 配置说明

## 配置位置

生产环境的 GitHub OAuth 配置应该通过**环境变量**进行管理，而不是硬编码在代码中。

## 配置项说明

### 1. 前端配置（环境变量）

在 `.env` 或 `.env.production` 文件中配置：

```bash
# GitHub OAuth Client ID（公开的，可以暴露在前端）
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d

# 后端 API 地址（用于 token 交换，保护 clientSecret）
VITE_BACKEND_API_URL=https://api.gitary.app
```

### 2. 后端配置（环境变量或配置文件）

在后端服务器上配置（**不要提交到代码仓库**）：

```bash
# GitHub OAuth Client Secret（敏感信息，仅在后端使用）
GITHUB_CLIENT_SECRET=c1b0b88727cb4f4c279d9bc6b82552f8ba760155

# 或者按 clientId 映射
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
```

## 配置层级

### 优先级（从高到低）

1. **环境变量** (`VITE_GITHUB_CLIENT_ID`, `VITE_BACKEND_API_URL`)
2. **代码中的默认值** (硬编码的 fallback 值)

### 当前实现

```typescript
// src/plugins/services/auth/providers/github/appInfo.ts
GitaryApp: {
  // 优先使用环境变量，如果没有则使用默认值
  clientId: (import.meta as any).env?.VITE_GITHUB_CLIENT_ID || "Ov23li7gtCm6evUeqZ4d",
  redirectUri: "https://gitary.app/?platform=github",
  backendApiUrl: (import.meta as any).env?.VITE_BACKEND_API_URL || "https://api.gitary.app",
},
```

## 部署配置

### 开发环境

创建 `.env.local` 文件（不会被提交到 Git）：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li1cdcxP0rM2KVLq
VITE_BACKEND_API_URL=http://localhost:3001
```

### 生产环境

#### 方式 1: 环境变量（推荐）

在部署平台（Vercel、Netlify、Docker 等）设置环境变量：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

#### 方式 2: `.env.production` 文件

创建 `.env.production` 文件（**注意：不要提交包含真实 secret 的文件**）：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

## 后端配置

### Node.js/Express 示例

```javascript
// 从环境变量读取
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// 或者按 clientId 映射
const GITHUB_CLIENT_SECRETS = {
  'Ov23li7gtCm6evUeqZ4d': process.env.GITHUB_CLIENT_SECRET_GITARY_APP,
  'Ov23li1cdcxP0rM2KVLq': process.env.GITHUB_CLIENT_SECRET_LOCALHOST,
};
```

### 部署后端时的环境变量

```bash
# .env (后端服务器)
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
```

## 安全建议

### ✅ 应该做的

1. **使用环境变量**：所有敏感配置都通过环境变量管理
2. **分离前后端配置**：`clientSecret` 只存在于后端
3. **使用 `.env.example`**：提供配置模板，但不包含真实值
4. **Git 忽略敏感文件**：确保 `.env.local`、`.env.production` 在 `.gitignore` 中

### ❌ 不应该做的

1. **不要硬编码 secret**：不要在代码中直接写 `clientSecret`
2. **不要提交 `.env`**：包含真实配置的 `.env` 文件不要提交到 Git
3. **不要在前端使用 clientSecret**：生产环境前端代码中不应该有 `clientSecret`

## 配置检查清单

- [ ] 前端 `.env.example` 包含配置模板
- [ ] 生产环境通过环境变量配置 `VITE_GITHUB_CLIENT_ID`
- [ ] 生产环境通过环境变量配置 `VITE_BACKEND_API_URL`
- [ ] 后端服务器配置了 `GITHUB_CLIENT_SECRET`
- [ ] `.gitignore` 包含 `.env.local` 和 `.env.production`
- [ ] 代码中移除了硬编码的 `clientSecret`（生产环境）

## 多环境配置示例

### 开发环境
```bash
# .env.local
VITE_GITHUB_CLIENT_ID=Ov23li1cdcxP0rM2KVLq
VITE_BACKEND_API_URL=http://localhost:3001
```

### 测试环境
```bash
# .env.test
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api-test.gitary.app
```

### 生产环境
```bash
# 通过部署平台的环境变量配置
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

