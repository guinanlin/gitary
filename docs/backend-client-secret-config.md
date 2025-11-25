# 后端 ClientSecret 配置说明

## 重要概念

**`clientSecret` 必须配置在一个独立的后端服务器上**，这个服务器是**单独部署的**，不是前端项目的一部分。

## 架构说明

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   前端应用   │ ──────> │   后端 API   │ ──────> │  GitHub API │
│ (gitary.app)│         │(api.gitary.app)│        │             │
└─────────────┘         └──────────────┘         └─────────────┘
  暴露 clientId          存储 clientSecret          OAuth 服务
```

## 配置位置

### 方式 1: 环境变量（推荐）

在后端服务器的环境变量中配置：

#### Node.js/Express 后端

**1. 创建后端项目目录**（与前端项目分开）

```bash
mkdir gitary-backend
cd gitary-backend
npm init -y
npm install express axios dotenv cors
```

**2. 创建 `.env` 文件**（在后端项目根目录）

```bash
# 后端项目的 .env 文件
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
PORT=3001
```

**3. 创建 `server.js` 文件**

```javascript
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['https://gitary.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// 从环境变量读取 clientSecret
const GITHUB_CLIENT_SECRETS = {
  'Ov23li7gtCm6evUeqZ4d': process.env.GITHUB_CLIENT_SECRET_GITARY_APP,
  'Ov23li1cdcxP0rM2KVLq': process.env.GITHUB_CLIENT_SECRET_LOCALHOST,
};

app.post('/api/auth/github/token', async (req, res) => {
  try {
    const { code, clientId, redirectUri } = req.body;
    
    if (!code || !clientId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 从环境变量中获取 clientSecret
    const clientSecret = GITHUB_CLIENT_SECRETS[clientId];
    if (!clientSecret) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,  // 使用环境变量中的值
        code: code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});
```

**4. 创建 `.gitignore` 文件**（重要！）

```bash
# 后端项目的 .gitignore
node_modules/
.env
.env.local
*.log
```

### 方式 2: 服务器环境变量（生产环境）

在部署平台（如 Vercel、Railway、Heroku、AWS 等）设置环境变量：

#### Vercel 部署

1. 在 Vercel 项目设置中添加环境变量：
   ```
   GITHUB_CLIENT_SECRET_GITARY_APP = c1b0b88727cb4f4c279d9bc6b82552f8ba760155
   GITHUB_CLIENT_SECRET_LOCALHOST = 34f80b513b96b5371682c6131e160eb41fc3e70f
   PORT = 3001
   ```

2. 重新部署项目

#### Railway 部署

1. 在 Railway 项目设置中添加环境变量
2. 或者使用 Railway CLI：
   ```bash
   railway variables set GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
   ```

#### Docker 部署

在 `docker-compose.yml` 中配置：

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
      - GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
      - PORT=3001
```

或者在启动命令中：

```bash
docker run -e GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155 \
  -e PORT=3001 \
  -p 3001:3001 \
  gitary-backend
```

## 完整项目结构

```
gitary/                    # 前端项目（当前项目）
├── src/
├── package.json
└── ...

gitary-backend/            # 后端项目（需要新建）
├── .env                   # ⚠️ 包含 clientSecret，不要提交到 Git
├── .gitignore
├── server.js              # 后端 API 代码
├── package.json
└── README.md
```

## 配置步骤总结

### 第一步：创建后端服务器

1. 创建新的后端项目目录（与前端分开）
2. 初始化 Node.js 项目
3. 安装依赖：`express`, `axios`, `dotenv`, `cors`

### 第二步：配置 clientSecret

**在后端项目的 `.env` 文件中**：

```bash
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
```

### 第三步：在代码中读取

```javascript
// 从环境变量读取
const clientSecret = process.env.GITHUB_CLIENT_SECRET_GITARY_APP;
```

### 第四步：部署后端服务器

部署到：
- Vercel（Serverless Functions）
- Railway
- Heroku
- AWS Lambda
- 自己的服务器

### 第五步：配置前端

在前端项目的 `.env` 中配置后端地址：

```bash
VITE_BACKEND_API_URL=https://api.gitary.app
```

## 安全要点

### ✅ 正确做法

1. **clientSecret 只存在于后端服务器**
2. **使用环境变量存储**，不要硬编码
3. **`.env` 文件加入 `.gitignore`**，不要提交到 Git
4. **生产环境使用部署平台的环境变量**

### ❌ 错误做法

1. ❌ 在前端代码中写 `clientSecret`
2. ❌ 将 `.env` 文件提交到 Git
3. ❌ 在代码中硬编码 `clientSecret`
4. ❌ 在前端项目中配置 `clientSecret`

## 快速开始示例

### 1. 创建后端项目

```bash
# 创建后端目录
mkdir gitary-backend
cd gitary-backend

# 初始化项目
npm init -y

# 安装依赖
npm install express axios dotenv cors

# 创建 .env 文件
cat > .env << EOF
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
PORT=3001
EOF

# 创建 .gitignore
echo "node_modules/
.env
*.log" > .gitignore
```

### 2. 创建 server.js

（使用上面提供的代码）

### 3. 启动后端服务器

```bash
node server.js
# 或使用 nodemon
npx nodemon server.js
```

### 4. 测试后端 API

```bash
curl -X POST http://localhost:3001/api/auth/github/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "clientId": "Ov23li7gtCm6evUeqZ4d",
    "redirectUri": "https://gitary.app/?platform=github"
  }'
```

## 总结

**`clientSecret` 配置位置**：

1. **开发环境**：后端项目的 `.env` 文件中
2. **生产环境**：部署平台的环境变量设置中
3. **永远不要**：在前端项目中配置或暴露

**关键点**：
- 后端服务器是**独立的项目**，与前端分开
- `clientSecret` 只存在于后端服务器的环境变量中
- 前端通过 `VITE_BACKEND_API_URL` 调用后端 API

