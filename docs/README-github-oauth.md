# GitHub OAuth 配置 - 快速指南

## 一句话说明

**前端配置 `clientId` 和 `backendApiUrl`，后端服务器配置 `clientSecret`。**

## 配置位置

### 前端配置（当前项目）

在 `.env` 文件中：

```bash
VITE_GITHUB_CLIENT_ID=你的clientId
VITE_BACKEND_API_URL=你的后端地址
```

### 后端配置（另一个独立项目）

在后端服务器的 `.env` 文件中：

```bash
GITHUB_CLIENT_SECRET=你的clientSecret
```

**重要**：后端是另一个独立的项目，需要单独部署！

## 开发环境

### 前端
```bash
# .env.local
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_BACKEND_API_URL=http://localhost:3001
```

### 后端
```bash
# 后端项目的 .env
GITHUB_CLIENT_SECRET=b190e9567acba61a8f3bd2d1b8a1a40734e5855f
```

## 生产环境

### 前端（部署平台环境变量）
```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

### 后端（后端部署平台环境变量）
```bash
GITHUB_CLIENT_SECRET=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
```

## 如何创建后端服务器？

参考 `docs/backend-api-example.md`，里面有完整的代码示例。

简单来说：
1. 创建一个新的 Node.js 项目
2. 安装 express、axios
3. 创建 server.js（代码在文档里）
4. 配置 `.env` 文件（包含 `GITHUB_CLIENT_SECRET`）
5. 部署到服务器

## 常见问题

**Q: clientSecret 配置在哪里？**  
A: 配置在后端服务器的环境变量中，不是前端项目。

**Q: 开发和生产配置方式一样吗？**  
A: 完全一样！都是配置环境变量，只是值不同。

**Q: 后端服务器是什么？**  
A: 一个独立的 Node.js 服务器，专门用来处理 token 交换，保护 clientSecret。

