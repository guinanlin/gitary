# 后端 API 实现示例

本文档提供了 GitHub OAuth token 交换的后端 API 实现示例，用于保护 `clientSecret` 不被暴露在前端。

## API 端点

### 1. 交换授权码获取 Access Token

**端点**: `POST /api/auth/github/token`

**请求体**:
```json
{
  "code": "authorization_code_from_github",
  "clientId": "your_github_client_id",
  "redirectUri": "https://your-app.com/?platform=github"
}
```

**响应**:
```json
{
  "access_token": "gho_xxxxxxxxxxxx",
  "token_type": "bearer",
  "scope": "user repo",
  "expires_in": 28800,
  "refresh_token": "ghr_xxxxxxxxxxxx",
  "refresh_token_expires_in": 15811200,
  "created_at": 1234567890
}
```

### 2. 刷新 Access Token

**端点**: `POST /api/auth/github/refresh`

**请求体**:
```json
{
  "refreshToken": "ghr_xxxxxxxxxxxx"
}
```

**响应**: 同 token 交换接口

## Node.js/Express 实现示例

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const GITHUB_CLIENT_SECRETS = {
  'Ov23li7gtCm6evUeqZ4d': 'c1b0b88727cb4f4c279d9bc6b82552f8ba760155',
  'Ov23li1cdcxP0rM2KVLq': '34f80b513b96b5371682c6131e160eb41fc3e70f',
  // 添加其他环境的 clientSecret
};

app.post('/api/auth/github/token', async (req, res) => {
  try {
    const { code, clientId, redirectUri } = req.body;
    
    if (!code || !clientId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const clientSecret = GITHUB_CLIENT_SECRETS[clientId];
    if (!clientSecret) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
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
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

app.post('/api/auth/github/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
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
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});
```

## Python/Flask 实现示例

```python
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

GITHUB_CLIENT_SECRETS = {
    'Ov23li7gtCm6evUeqZ4d': 'c1b0b88727cb4f4c279d9bc6b82552f8ba760155',
    'Ov23li1cdcxP0rM2KVLq': '34f80b513b96b5371682c6131e160eb41fc3e70f',
}

@app.route('/api/auth/github/token', methods=['POST'])
def exchange_token():
    data = request.json
    code = data.get('code')
    client_id = data.get('clientId')
    redirect_uri = data.get('redirectUri')
    
    if not code or not client_id:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    client_secret = GITHUB_CLIENT_SECRETS.get(client_id)
    if not client_secret:
        return jsonify({'error': 'Invalid client ID'}), 400
    
    response = requests.post(
        'https://github.com/login/oauth/access_token',
        json={
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
        },
        headers={
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    )
    
    return jsonify(response.json())

@app.route('/api/auth/github/refresh', methods=['POST'])
def refresh_token():
    data = request.json
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({'error': 'Missing refresh token'}), 400
    
    response = requests.post(
        'https://github.com/login/oauth/access_token',
        json={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
        },
        headers={
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    )
    
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(port=3001)
```

## 环境变量配置

### ⚠️ 重要：这是后端项目的配置

**`clientSecret` 必须配置在后端服务器的环境变量中**，不是前端项目！

### 后端项目的 .env 文件

在后端项目根目录创建 `.env` 文件：

```bash
# 后端项目的 .env 文件（不要提交到 Git！）
GITHUB_CLIENT_SECRET_GITARY_APP=c1b0b88727cb4f4c279d9bc6b82552f8ba760155
GITHUB_CLIENT_SECRET_LOCALHOST=34f80b513b96b5371682c6131e160eb41fc3e70f
PORT=3001
```

### 更新代码使用环境变量

```javascript
// 使用 dotenv 加载环境变量
require('dotenv').config();

// 从环境变量读取
const GITHUB_CLIENT_SECRETS = {
  'Ov23li7gtCm6evUeqZ4d': process.env.GITHUB_CLIENT_SECRET_GITARY_APP,
  'Ov23li1cdcxP0rM2KVLq': process.env.GITHUB_CLIENT_SECRET_LOCALHOST,
};
```

### 生产环境部署

在部署平台（Vercel、Railway、Heroku 等）设置环境变量，不要硬编码在代码中。

**详细说明请参考：`docs/backend-client-secret-config.md`**

## 安全建议

1. **使用 HTTPS**: 确保所有 API 通信都通过 HTTPS
2. **CORS 配置**: 只允许信任的域名访问 API
3. **速率限制**: 实施速率限制防止滥用
4. **日志记录**: 记录所有 token 交换请求，但不记录敏感信息
5. **错误处理**: 不要向客户端暴露详细的错误信息

## 部署

将后端 API 部署到你的服务器，然后在前端配置中设置 `backendApiUrl`：

```typescript
// src/plugins/services/auth/providers/github/appInfo.ts
GitaryApp: {
  clientId: "Ov23li7gtCm6evUeqZ4d",
  redirectUri: "https://gitary.app/?platform=github",
  backendApiUrl: "https://api.gitary.app", // 你的后端 API 地址
},
```

## 测试

使用 curl 测试 API：

```bash
curl -X POST http://localhost:3001/api/auth/github/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "clientId": "Ov23li7gtCm6evUeqZ4d",
    "redirectUri": "https://gitary.app/?platform=github"
  }'
```

