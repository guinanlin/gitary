# 本地开发配置指南

## 本地开发配置方式

对于本地开发，有两种配置方式：

### 方式 1: 直接方式（最简单，推荐用于快速开发）

不需要启动后端服务器，直接使用 `clientSecret`：

```bash
# .env 或 .env.local
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_GITHUB_CLIENT_SECRET=b190e9567acba61a8f3bd2d1b8a1a40734e5855f
# 不配置 VITE_BACKEND_API_URL，会使用直接方式
```

**注意**：确保在 GitHub OAuth App 设置中配置了正确的 Redirect URI：
- `http://localhost:5173/?platform=github` （如果使用 Vite 默认端口）
- 或者你实际使用的端口

### 方式 2: 使用后端 API（更安全，推荐用于测试生产流程）

需要先启动后端服务器：

```bash
# .env 或 .env.local
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_BACKEND_API_URL=http://localhost:3001
# 不配置 VITE_GITHUB_CLIENT_SECRET
```

然后启动后端服务器（参考 `docs/backend-api-example.md`）

## 当前配置问题

你的 `.env` 文件中：
```bash
VITE_BACKEND_API_URL=http://localhost:5173  # ❌ 这是前端地址，不是后端
```

应该改为：
```bash
VITE_BACKEND_API_URL=http://localhost:3001  # ✅ 后端 API 地址
```

或者如果使用直接方式，删除这一行。

## 推荐配置（本地开发）

### 最简单的方式（直接方式）

```bash
# .env.local（不会被提交到 Git）
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_GITHUB_CLIENT_SECRET=b190e9567acba61a8f3bd2d1b8a1a40734e5855f
# 不配置 VITE_BACKEND_API_URL
```

### 使用后端的方式

```bash
# .env.local
VITE_GITHUB_CLIENT_ID=Ov23liZBfFxwLPHPjGZx
VITE_BACKEND_API_URL=http://localhost:3001
```

## GitHub OAuth App 配置

在 GitHub 上配置 OAuth App 时，确保 Redirect URI 设置为：

```
http://localhost:5173/?platform=github
```

或者你实际使用的端口。

## 快速检查清单

- [ ] `VITE_GITHUB_CLIENT_ID` 已配置
- [ ] 如果使用直接方式：配置了 `VITE_GITHUB_CLIENT_SECRET`
- [ ] 如果使用后端方式：配置了 `VITE_BACKEND_API_URL`（且不是前端地址）
- [ ] GitHub OAuth App 中的 Redirect URI 与当前域名匹配
- [ ] 重启开发服务器（修改 `.env` 后需要重启）

