# GitHub OAuth 配置 - 最简单说明

## 核心概念

**前端配置**：只需要 `clientId` 和 `backendApiUrl`  
**后端配置**：需要 `clientSecret`（这是另一个独立的服务器）

## 配置方式（开发和生产完全相同）

### 前端配置（.env 文件）

```bash
# 必需：GitHub Client ID
VITE_GITHUB_CLIENT_ID=你的clientId

# 必需：后端 API 地址
VITE_BACKEND_API_URL=你的后端地址
```

**就这么简单！开发和生产用完全相同的配置方式，只是值不同。**

### 后端配置（后端服务器的 .env 文件）

这是**另一个独立的项目**，需要单独部署：

```bash
# 后端服务器的 .env 文件
GITHUB_CLIENT_SECRET=你的clientSecret
```

## 完整流程

### 第一步：配置前端

在 `.env` 或部署平台设置：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

### 第二步：部署后端服务器

1. 创建后端项目（参考 `docs/backend-api-example.md`）
2. 在后端项目的 `.env` 中配置：
   ```bash
   GITHUB_CLIENT_SECRET=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
   ```
3. 部署后端服务器到 `https://api.gitary.app`

### 第三步：完成

前端调用后端，后端使用 `clientSecret` 与 GitHub 通信。

## 开发环境配置

```bash
# 前端 .env.local
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_BACKEND_API_URL=http://localhost:3001
```

```bash
# 后端服务器 .env
GITHUB_CLIENT_SECRET=b190e9567acba61a8f3bd2d1b8a1a40734e5855f
```

## 生产环境配置

```bash
# 前端（部署平台环境变量）
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

```bash
# 后端服务器（后端部署平台环境变量）
GITHUB_CLIENT_SECRET=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
```

## 总结

- **前端**：只配置 `clientId` 和 `backendApiUrl`（开发和生产方式相同）
- **后端**：只配置 `clientSecret`（这是另一个服务器，需要单独部署）
- **开发和生产**：配置方式完全相同，只是值不同

**clientSecret 配置在后端服务器的环境变量中，不是前端！**

