# GitHub OAuth 授权优化方案

## 优化目标

解决 `clientSecret` 暴露在前端的安全问题，通过后端代理的方式保护敏感信息。

## 优化内容

### 1. 配置更新

**文件**: `src/plugins/services/auth/providers/github/appInfo.ts`

- ✅ 添加 `backendApiUrl` 配置项，支持通过环境变量配置
- ✅ `clientSecret` 改为可选，生产环境可以不配置
- ✅ 支持通过 `VITE_BACKEND_API_URL` 环境变量动态配置后端地址

### 2. Token 交换优化

**文件**: `libs/github-api/github-client.ts`

- ✅ `getGithubAccessToken` 函数优先使用后端 API
- ✅ 后端 API 失败时自动降级到直接方式（仅开发环境）
- ✅ 支持通过 `backendApiUrl` 参数指定后端地址

### 3. Token 刷新优化

**文件**: `libs/github-api/github-client.ts`

- ✅ `refreshGithubAccessToken` 函数支持后端 API
- ✅ 后端 API 失败时自动降级到直接方式

### 4. 插件更新

**文件**: `src/plugins/services/auth/providers/github/index.ts`

- ✅ 移除未使用的 `OAuthApp` 导入
- ✅ 更新 token 交换逻辑，传递 `backendApiUrl`
- ✅ 更新 token 刷新逻辑，传递 `backendApiUrl`

## 使用方式

### 开发环境（本地开发）

```typescript
// 使用 clientSecret（仅开发环境）
Localhost5173: {
  clientId: "Ov23li1cdcxP0rM2KVLq",
  clientSecret: "34f80b513b96b5371682c6131e160eb41fc3e70f", // 仅开发环境
  redirectUri: "http://localhost:5173/?platform=github",
  backendApiUrl: "http://localhost:3001", // 可选，如果配置了会优先使用
},
```

### 生产环境

```typescript
// 不配置 clientSecret，必须配置 backendApiUrl
GitaryApp: {
  clientId: "Ov23li7gtCm6evUeqZ4d",
  // clientSecret 不配置，保护安全
  redirectUri: "https://gitary.app/?platform=github",
  backendApiUrl: "https://api.gitary.app", // 必须配置
},
```

### 环境变量配置

在 `.env` 文件中配置：

```bash
VITE_BACKEND_API_URL=https://api.gitary.app
```

## 后端 API 实现

参考 `docs/backend-api-example.md` 文件，提供了完整的后端 API 实现示例：

- Node.js/Express 示例
- Python/Flask 示例
- API 端点说明
- 安全建议

## 工作流程

### 优化前（不安全）

```
前端 → 直接调用 GitHub API（暴露 clientSecret）
```

### 优化后（安全）

```
前端 → 后端 API → GitHub API（clientSecret 在后端）
```

## 降级策略

为了向后兼容和开发便利，实现了自动降级：

1. **优先使用后端 API**：如果配置了 `backendApiUrl`，优先使用后端
2. **自动降级**：如果后端 API 失败且存在 `clientSecret`，自动降级到直接方式
3. **错误提示**：如果后端失败且没有 `clientSecret`，抛出明确的错误信息

## 安全建议

1. ✅ **生产环境必须使用后端 API**：不要在生产环境配置 `clientSecret`
2. ✅ **使用 HTTPS**：确保后端 API 使用 HTTPS
3. ✅ **CORS 配置**：后端 API 只允许信任的域名访问
4. ✅ **速率限制**：实施速率限制防止滥用
5. ✅ **日志记录**：记录所有 token 交换请求，但不记录敏感信息

## 迁移步骤

1. **部署后端 API**：参考 `docs/backend-api-example.md` 部署后端服务
2. **更新配置**：在 `appInfo.ts` 中添加 `backendApiUrl`
3. **移除 clientSecret**：从生产环境配置中移除 `clientSecret`
4. **测试验证**：测试 token 交换和刷新功能
5. **监控日志**：监控后端 API 日志，确保正常工作

## 注意事项

- ⚠️ 开发环境可以保留 `clientSecret` 用于本地测试
- ⚠️ 生产环境必须移除 `clientSecret` 并配置 `backendApiUrl`
- ⚠️ 确保后端 API 的可用性和稳定性
- ⚠️ 定期轮换 `clientSecret`（即使在后端）

