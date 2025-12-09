# 生产环境配置指南

## 生产环境配置方式

生产环境**必须使用后端 API**，不能在前端暴露 `clientSecret`。

## 必需配置

在生产环境部署平台（Vercel、Netlify、Railway 等）设置以下环境变量：

```bash
# 必需：GitHub OAuth Client ID
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d

# 必需：后端 API 地址（用于安全的 token 交换）
VITE_BACKEND_API_URL=https://api.gitary.app

# 可选：Redirect URI（不配置会自动从当前域名生成）
# VITE_GITHUB_REDIRECT_URI=https://gitary.app/?platform=github
```

## ⚠️ 重要：前端不要配置 clientSecret

```bash
# ❌ 前端项目不要配置 clientSecret
# VITE_GITHUB_CLIENT_SECRET=xxx  # 前端不要配置！

# ✅ 但是后端服务器必须配置 clientSecret！
# 后端服务器的 .env 文件：
# GITHUB_CLIENT_SECRET=你的clientSecret
```

**说明**：
- **前端项目**：不要配置 `clientSecret`（安全考虑）
- **后端服务器**：必须配置 `clientSecret`（在另一个独立项目中）

## 不同部署平台的配置方式

### Vercel

1. 进入项目设置 → Environment Variables
2. 添加以下变量：
   - `VITE_GITHUB_CLIENT_ID` = `Ov23li7gtCm6evUeqZ4d`
   - `VITE_BACKEND_API_URL` = `https://api.gitary.app`
3. 选择环境：Production, Preview, Development
4. 保存并重新部署

### Netlify

1. 进入 Site settings → Environment variables
2. 添加变量（同上）
3. 重新部署

### Railway

1. 进入项目 → Variables
2. 添加变量（同上）
3. 自动重新部署

### Docker

在 `docker-compose.yml` 中：

```yaml
services:
  frontend:
    build: .
    environment:
      - VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
      - VITE_BACKEND_API_URL=https://api.gitary.app
```

### 自建服务器

在服务器上创建 `.env.production` 文件：

```bash
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

## GitHub OAuth App 配置

在 GitHub 上配置 OAuth App 时，确保：

1. **Application name**: Gitary
2. **Homepage URL**: `https://gitary.app`
3. **Authorization callback URL**: `https://gitary.app/?platform=github`
4. **Client ID**: 复制到 `VITE_GITHUB_CLIENT_ID`
5. **Client Secret**: 只配置在后端服务器，不要在前端使用

## 后端服务器配置（必须配置！）

**重要**：`clientSecret` 必须配置在后端服务器上！

后端服务器需要单独部署，在后端项目的环境变量中配置：

```bash
# 后端服务器的 .env 文件或环境变量
GITHUB_CLIENT_SECRET=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
```

**配置位置**：
- 开发环境：后端项目的 `.env` 文件
- 生产环境：后端部署平台的环境变量设置

详细后端配置请参考：`docs/backend-client-secret-config.md`

## 配置检查清单

部署前检查：

- [ ] `VITE_GITHUB_CLIENT_ID` 已配置
- [ ] `VITE_BACKEND_API_URL` 已配置（且指向正确的后端地址）
- [ ] **没有配置** `VITE_GITHUB_CLIENT_SECRET`（生产环境）
- [ ] GitHub OAuth App 中的 Redirect URI 与生产域名匹配
- [ ] 后端服务器已部署并配置了 `clientSecret`
- [ ] 后端 API 支持 CORS，允许前端域名访问
- [ ] 所有配置都使用 HTTPS

## 测试生产配置

部署后测试：

1. 访问生产环境
2. 点击 GitHub 授权
3. 检查是否能正常跳转到 GitHub
4. 授权后检查是否能正常回调
5. 检查浏览器控制台是否有错误

## 常见问题

### Q: 为什么生产环境不能配置 clientSecret？

A: `clientSecret` 是敏感信息，如果配置在前端，任何人都可以在浏览器中看到，存在安全风险。必须使用后端 API 来保护它。

### Q: 后端 API 地址应该是什么？

A: 应该是你部署的后端服务器的地址，例如：
- `https://api.gitary.app`
- `https://gitary-api.vercel.app`
- `https://api.yourdomain.com`

### Q: Redirect URI 需要配置吗？

A: 通常不需要，系统会自动从当前域名生成。但如果需要自定义，可以配置 `VITE_GITHUB_REDIRECT_URI`。

## 配置示例

### 完整生产环境配置

```bash
# 前端环境变量（部署平台）
VITE_GITHUB_CLIENT_ID=Ov23li7gtCm6evUeqZ4d
VITE_BACKEND_API_URL=https://api.gitary.app
```

```bash
# 后端环境变量（后端服务器）
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
PORT=3001
```

## 总结

生产环境配置原则：
- ✅ 使用环境变量
- ✅ 配置后端 API
- ✅ 不配置 clientSecret
- ✅ 使用 HTTPS
- ✅ 确保 GitHub OAuth App 配置正确

