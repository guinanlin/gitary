# GitHub OAuth 配置 - 清晰说明

## 核心要点

**前端项目**：不要配置 `clientSecret`  
**后端服务器**：必须配置 `clientSecret`

## 配置位置

### 1. 前端项目（当前项目 - gitary）

在 `.env` 或部署平台环境变量中配置：

```bash
# ✅ 前端需要配置这两个
VITE_GITHUB_CLIENT_ID=你的clientId
VITE_BACKEND_API_URL=你的后端地址

# ❌ 前端不要配置这个！
# VITE_GITHUB_CLIENT_SECRET=xxx  # 不要在前端配置！
```

### 2. 后端服务器（另一个独立项目）

在后端项目的 `.env` 文件或后端部署平台环境变量中配置：

```bash
# ✅ 后端必须配置这个！
GITHUB_CLIENT_SECRET=你的clientSecret
```

## 完整配置示例

### 开发环境

**前端项目**（`.env.local`）：
```bash
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_BACKEND_API_URL=http://localhost:3001
# 不配置 VITE_GITHUB_CLIENT_SECRET
```

**后端服务器**（后端项目的 `.env`）：
```bash
GITHUB_CLIENT_SECRET=b190e9567acba61a8f3bd2d1b8a1a40734e5855f
```

### 生产环境

**前端项目**（部署平台环境变量，如 Vercel）：
```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
# 不配置 VITE_GITHUB_CLIENT_SECRET
```

**后端服务器**（后端部署平台环境变量）：
```bash
GITHUB_CLIENT_SECRET=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
```

## 配置总结表

| 位置 | clientId | backendApiUrl | clientSecret |
|------|----------|---------------|--------------|
| **前端项目** | ✅ 需要 | ✅ 需要 | ❌ **不要配置** |
| **后端服务器** | ❌ 不需要 | ❌ 不需要 | ✅ **必须配置** |

## 重要说明

- **"不要配置"** = 不要在前端项目配置
- **"必须配置"** = 必须在后端服务器配置
- 后端服务器是另一个独立的项目，需要单独创建和部署

## 如何创建后端服务器？

1. 创建新目录：`mkdir gitary-backend`
2. 初始化项目：`npm init -y`
3. 安装依赖：`npm install express axios dotenv cors`
4. 创建 `server.js`（代码见 `docs/backend-api-example.md`）
5. 创建 `.env` 文件，写入：
   ```bash
   GITHUB_CLIENT_SECRET=你的clientSecret
   ```
6. 启动服务器：`node server.js`
7. 部署到服务器（如 `https://api.gitary.app`）

## 一句话总结

**前端不配置 clientSecret，后端必须配置 clientSecret。**

