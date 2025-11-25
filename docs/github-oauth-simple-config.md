# GitHub OAuth 配置说明（简化版）

## 统一配置方式

**开发和生产环境使用完全相同的配置方式**，只需要在 `.env` 文件中配置环境变量即可。

## 配置项

只需要配置 3 个环境变量：

```bash
# 必需：GitHub OAuth Client ID
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d

# 推荐：后端 API 地址（用于安全的 token 交换）
VITE_BACKEND_API_URL=https://api.gitary.app

# 可选：Redirect URI（不配置会自动从当前域名生成）
# VITE_GITHUB_REDIRECT_URI=https://gitary.app/?platform=github
```

## 配置方式

### 开发环境

创建 `.env.local` 文件：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li1cdcxP0rM2KVLq
VITE_BACKEND_API_URL=http://localhost:3001
```

### 生产环境

在部署平台（Vercel、Netlify 等）设置环境变量：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

**就这么简单！开发和生产使用完全相同的配置方式。**

## 工作原理

### 如果配置了 `VITE_BACKEND_API_URL`（推荐）

```
前端 → 后端 API → GitHub API
```

- ✅ 安全：`clientSecret` 只存在于后端
- ✅ 推荐用于生产环境

### 如果没有配置 `VITE_BACKEND_API_URL`（仅开发）

```
前端 → 直接调用 GitHub API（需要 VITE_GITHUB_CLIENT_SECRET）
```

- ⚠️ 需要配置 `VITE_GITHUB_CLIENT_SECRET`
- ⚠️ 仅用于开发环境测试

## 配置示例

### 示例 1: 使用后端 API（推荐）

```bash
# .env
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

### 示例 2: 直接方式（仅开发）

```bash
# .env.local (仅开发环境)
VITE_GITHUB_CLIENT_ID=Ov23li1cdcxP0rM2KVLq
VITE_GITHUB_CLIENT_SECRET=34f80b513b96b5371682c6131e160eb41fc3e70f
# 不配置 VITE_BACKEND_API_URL
```

## 后端配置

后端服务器需要单独部署，配置 `clientSecret` 在环境变量中：

```bash
# 后端项目的 .env
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
```

详细后端配置请参考：`docs/backend-client-secret-config.md`

## 总结

- ✅ **统一配置**：开发和生产使用相同的环境变量
- ✅ **简单明了**：只需要配置 2-3 个环境变量
- ✅ **自动适配**：Redirect URI 自动从当前域名生成
- ✅ **安全优先**：推荐使用后端 API，保护 `clientSecret`

