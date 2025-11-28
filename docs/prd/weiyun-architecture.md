# 腾讯微云 Workspace 集成 - 架构设计文档

## 1. 核心组件设计

### 1.1 WeiyunClient（微云 API 客户端）

#### 类结构

```typescript
class WeiyunClient {
  private cookies: string;
  private httpClient: HttpClient;
  private onCookieExpired?: (error: Error) => void;
  private onCookieUpdate?: (cookies: string) => void;
  private keepAliveTimer?: number;
  private loginType: number;  // 1=QQ登录, 2=微信登录

  constructor(cookies: string);
  
  // Cookie 管理
  setCookies(cookies: string): void;
  refreshCtoken(): Promise<void>;
  keepAlive(): Promise<void>;
  getLoginType(): number;
  
  // 用户信息
  diskUserInfoGet(): Promise<WeiyunUserInfo>;
  
  // 目录操作
  libDirPathGet(dirKey: string): Promise<WeiyunDir[]>;
  diskDirFileList(dirKey: string, options?: ListOptions): Promise<WeiyunFileList>;
  diskDirCreate(params: FolderParam): Promise<WeiyunDir>;
  diskDirMove(params: FolderParam, dest: FolderParam): Promise<void>;
  diskDirAttrModify(params: FolderParam, newName: string): Promise<void>;
  
  // 文件操作
  diskFileDownload(params: FileParam): Promise<DownloadInfo>;
  diskFileUpload(params: FileUploadParam): Promise<WeiyunFile>;
  diskFileMove(params: FileParam, dest: FolderParam): Promise<void>;
  diskFileRename(params: FileParam, newName: string): Promise<void>;
  diskFileDelete(params: FileParam): Promise<void>;
}
```

#### 初始化实现

```typescript
constructor(cookies: string) {
  this.cookies = cookies;
  this.httpClient = new HttpClient({
    baseURL: "https://www.weiyun.com",
    headers: {
      "Cookie": cookies,
      "User-Agent": "Mozilla/5.0...",  // 模拟浏览器
      "Referer": "https://www.weiyun.com"
    }
  });
}

async refreshCtoken(): Promise<void> {
  // 刷新 ctoken，更新 Cookie
  const response = await this.httpClient.post("/web/capi/refresh");
  // 处理 Cookie 更新回调
  if (this.onCookieUpdate) {
    this.onCookieUpdate(extractCookies(response));
  }
}
```

#### 保活机制

```typescript
async keepAlive(): Promise<void> {
  if (this.loginType === 1) {  // QQ 登录
    await this.httpClient.post("/web/capi/keepalive");
  }
}

startKeepAlive(): void {
  if (this.loginType === 1) {
    this.keepAliveTimer = window.setInterval(() => {
      this.keepAlive().catch((error) => {
        console.error("KeepAlive failed:", error);
        if (this.onCookieExpired) {
          this.onCookieExpired(error);
        }
      });
    }, 5 * 60 * 1000);  // 5 分钟
  }
}
```

### 1.2 WeiyunFileSystemProvider

#### 类结构

```typescript
class WeiyunFileSystemProvider implements FileSystemProvider {
  private client: WeiyunClient;
  private rootDirKey: string;              // Workspace 根目录 DirKey
  private rootPath: string;                // Workspace 根路径（如 "/我的笔记"）
  private dirCache: Map<string, string>;   // 路径 -> DirKey 映射缓存
  private onDidChangeFileEmitter: EventEmitter<FileChangeEvent[]>;
  
  readonly onDidChangeFile: Event<FileChangeEvent[]>;
  
  constructor(client: WeiyunClient, rootDirKey: string, rootPath: string);
  
  // FileSystemProvider 接口实现
  async stat(uri: Uri): Promise<FileStat>;
  async readDirectory(uri: Uri): Promise<[string, FileType][]>;
  async readFile(uri: Uri): Promise<Uint8Array>;
  async writeFile(uri: Uri, content: Uint8Array, options: WriteOptions): Promise<void>;
  async createDirectory(uri: Uri): Promise<void>;
  async delete(uri: Uri, options: DeleteOptions): Promise<void>;
  async rename(oldUri: Uri, newUri: Uri, options: RenameOptions): Promise<void>;
  
  // 内部辅助方法
  private resolvePathToDirKey(path: string): Promise<string>;
  private findFileInDir(dirKey: string, fileName: string): Promise<WeiyunFile | null>;
  private normalizePath(path: string): string;
}
```

#### 路径解析逻辑

```typescript
private async resolvePathToDirKey(path: string): Promise<string> {
  // 1. 检查缓存
  if (this.dirCache.has(path)) {
    return this.dirCache.get(path)!;
  }
  
  // 2. 从根目录开始逐级查找
  if (path === "/" || path === "") {
    return this.rootDirKey;
  }
  
  // 3. 分割路径
  const parts = path.split("/").filter(p => p);
  let currentDirKey = this.rootDirKey;
  
  // 4. 逐级查找
  for (const part of parts) {
    const dirs = await this.client.diskDirFileList(currentDirKey);
    const dir = dirs.DirList.find(d => d.DirName === part);
    
    if (!dir) {
      throw new Error(`Directory not found: ${path}`);
    }
    
    currentDirKey = dir.DirKey;
    // 更新缓存
    const currentPath = "/" + parts.slice(0, parts.indexOf(part) + 1).join("/");
    this.dirCache.set(currentPath, currentDirKey);
  }
  
  return currentDirKey;
}
```

### 1.3 接口映射表

| FileSystemProvider 方法 | WeiyunClient 方法 | 实现要点 |
|------------------------|-------------------|---------|
| `stat(uri)` | `diskDirFileList()` + 文件查找 | 路径 → DirKey → 查找文件/目录信息 |
| `readDirectory(uri)` | `diskDirFileList(DirKey)` | 使用 DirKey 获取文件和目录列表 |
| `readFile(uri)` | `diskFileDownload()` | 获取下载链接，下载文件内容 |
| `writeFile(uri, content)` | `diskFileUpload()` | 上传文件到指定目录，可能需要分片 |
| `createDirectory(uri)` | `diskDirCreate()` | 需要 PdirKey 和 DirKey |
| `delete(uri)` | `diskFileDelete()` / 目录删除 | 区分文件和目录 |
| `rename(oldUri, newUri)` | `diskFileRename()` / `diskDirAttrModify()` | 使用 FileParam / FolderParam |

## 2. 平台注册与初始化

### 2.1 平台注册配置

```typescript
// src/plugins/space/platforms/index.ts

import { WeiyunFileSystemProvider } from "@/services/weiyun-file-system.provider";
import { createWeiyunClient } from "@/services/weiyun-client";

export const platformsPlugin = createPlugin({
  initilize() {
    // 注册腾讯微云
    spacePlatformRegistry.register({
      id: "weiyun",
      name: "腾讯微云",
      hostname: "weiyun.com",
      getProvider: ({ accessToken, owner, repo }) => {
        // accessToken 实际是 Cookie 字符串
        // owner 是 UIN
        // repo 是文件夹路径（如 "/我的笔记"）
        
        const client = createWeiyunClient(accessToken);
        const rootDirKey = resolveRootDirKey(client, repo);
        
        return new WeiyunFileSystemProvider(
          client,
          rootDirKey,
          repo
        );
      },
    });
  }
});
```

### 2.2 Workspace 初始化流程

```typescript
async function initWeiyunWorkspace(
  platform: "weiyun",
  owner: string,
  repo: string
): Promise<WeiyunFileSystemProvider> {
  // 1. 获取 Cookie
  const authInfo = authService.getAuthInfo("weiyun", owner);
  if (!authInfo || !authInfo.accessToken) {
    throw new Error("未授权，请先授权微云账号");
  }
  
  const cookies = authInfo.accessToken;
  
  // 2. 创建微云客户端
  const client = createWeiyunClient(cookies);
  await client.refreshCtoken();
  
  // 3. 设置 Cookie 回调
  client.setOnCookieUpdate((newCookies) => {
    authService.saveAuthInfo({
      ...authInfo,
      accessToken: newCookies,
    });
  });
  
  client.setOnCookieExpired((error) => {
    // 处理过期
    handleCookieExpired(owner);
  });
  
  // 4. 启动保活（如果是 QQ 登录）
  const loginType = client.getLoginType();
  if (loginType === 1) {
    client.startKeepAlive();
  }
  
  // 5. 解析根目录
  let rootDirKey: string;
  if (repo === "/" || repo === "") {
    // 使用主目录
    const userInfo = await client.diskUserInfoGet();
    rootDirKey = userInfo.MainDirKey;
  } else {
    // 通过路径查找目录
    rootDirKey = await resolvePathToDirKey(client, repo);
  }
  
  // 6. 创建 FileSystemProvider
  const provider = new WeiyunFileSystemProvider(
    client,
    rootDirKey,
    repo
  );
  
  return provider;
}
```

## 3. Cookie 管理机制

### 3.1 Cookie 存储方案

使用现有 authService 的 localStorage 存储：

```typescript
// 存储到 AuthInfo
const authInfo: AuthInfo = {
  platform: "weiyun",
  username: extractedUIN,        // 从 Cookie 中提取的 UIN
  accessToken: cookieString,      // 完整 Cookie 字符串
  createdAt: Date.now(),
};

// 保存
authService.saveAuthInfo(authInfo);
```

**存储位置**: `localStorage.getItem("authInfo-v2")`

**数据结构**:
```json
[
  {
    "id": "weiyun-123456789",
    "platform": "weiyun",
    "username": "123456789",
    "accessToken": "p_skey=xxx; p_uin=xxx; ...",
    "createdAt": 1706284800000
  }
]
```

### 3.2 Cookie 验证流程

```typescript
async validateCookies(cookies: string): Promise<{ valid: boolean; uin?: string; error?: string }> {
  try {
    // 1. 创建临时客户端
    const tempClient = new WeiyunClient(cookies);
    await tempClient.refreshCtoken();
    
    // 2. 调用用户信息接口验证
    const userInfo = await tempClient.diskUserInfoGet();
    
    // 3. 提取 UIN
    const uin = userInfo.UIN || extractUINFromCookies(cookies);
    
    return { valid: true, uin };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### 3.3 Cookie 更新机制

```typescript
client.setOnCookieUpdate((newCookies: string) => {
  // 自动更新存储的 Cookie
  const authInfo = authService.getAuthInfo("weiyun", uin);
  if (authInfo) {
    authService.saveAuthInfo({
      ...authInfo,
      accessToken: newCookies,
    });
  }
});
```

### 3.4 Cookie 过期处理

```typescript
client.setOnCookieExpired((error: Error) => {
  // 1. 更新授权状态
  updateAuthStatus("expired");
  
  // 2. 显示提示
  showNotification("微云授权已过期，请重新授权", {
    type: "warning",
    action: {
      label: "重新授权",
      onClick: () => {
        // 打开重新授权界面
        openReauthDialog();
      }
    }
  });
  
  // 3. 停止相关服务
  stopKeepAlive();
});
```

## 4. 错误处理设计

### 4.1 错误分类

| 错误类型 | 错误码 | 处理方式 |
|---------|--------|---------|
| Cookie 过期 | -110 | 提示重新授权，清除相关状态 |
| 文件不存在 | -404 | 抛出 FileNotFound 错误 |
| 权限不足 | -403 | 显示权限错误提示 |
| 网络错误 | NetworkError | 重试机制，显示网络错误 |
| 频率限制 | -429 | 延迟重试，显示限流提示 |
| 参数错误 | -400 | 验证参数，显示错误信息 |

### 4.2 统一错误处理

```typescript
class WeiyunError extends Error {
  constructor(
    public code: number,
    public message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = "WeiyunError";
  }
  
  static fromResponse(response: any): WeiyunError {
    if (response.code === -110) {
      return new WeiyunError(
        -110,
        "Cookie 已过期，请重新授权",
        response
      );
    }
    
    return new WeiyunError(
      response.code || -1,
      response.message || "未知错误",
      response
    );
  }
}

// 统一错误处理
async handleApiCall<T>(
  apiCall: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const weiyunError = WeiyunError.fromResponse(error);
      
      // Cookie 过期，不重试
      if (weiyunError.code === -110) {
        throw weiyunError;
      }
      
      // 网络错误，重试
      if (weiyunError.code === NetworkError) {
        if (i < retries - 1) {
          await delay(1000 * (i + 1));  // 指数退避
          continue;
        }
      }
      
      throw weiyunError;
    }
  }
  
  throw new Error("请求失败，请重试");
}
```

## 5. 类型定义

```typescript
// 完整的类型定义

interface WeiyunUserInfo {
  MainDirKey: string;
  UIN: string;
  // ... 其他用户信息
}

interface WeiyunDir {
  DirKey: string;
  PdirKey: string;
  DirName: string;
  DirCtime: number;
  DirMtime: number;
}

interface WeiyunFile {
  FileID: string;
  FileName: string;
  FileSize: number;
  FileCtime: number;
  FileMtime: number;
}

interface WeiyunFileList {
  DirList: WeiyunDir[];
  FileList: WeiyunFile[];
  TotalDirCount: number;
  TotalFileCount: number;
  FinishFlag: boolean;
}

interface DownloadInfo {
  DownloadUrl: string;
  CookieName: string;
  CookieValue: string;
}

interface FolderParam {
  PPdirKey: string;
  PdirKey: string;
  DirKey?: string;
  DirName: string;
}

interface FileParam {
  PPdirKey: string;
  PdirKey: string;
  FileID: string;
  FileName: string;
}
```
