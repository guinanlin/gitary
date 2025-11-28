# 腾讯微云 API 接口规范文档

## 1. API 接口清单

基于 AList 的微云驱动实现，需要封装以下接口：

### 1.1 用户信息接口

```
POST /web/capi/userinfo
```

**用途**: 获取用户信息，验证 Cookie 有效性

**请求头**:
```
Cookie: p_skey=xxx; p_uin=xxx; ...
User-Agent: Mozilla/5.0...
Referer: https://www.weiyun.com
```

**请求参数**:
```typescript
// 通常不需要额外参数，Cookie 在请求头中
```

**响应**:
```typescript
interface WeiyunUserInfo {
  MainDirKey: string;  // 用户主目录 DirKey
  UIN: string;         // 用户 UIN
  LoginType: number;   // 1=QQ登录, 2=微信登录
  // ... 其他用户信息
}
```

**错误码**:
- `-110`: Cookie 过期
- 其他错误码根据实际情况补充

### 1.2 目录列表接口

```
POST /web/capi/filelist
```

**用途**: 获取指定目录下的文件和文件夹列表

**请求参数**:
```typescript
interface FileListParams {
  dirKey: string;      // 目录 DirKey
  offset?: number;     // 分页偏移（默认 0）
  count?: number;      // 每页数量（默认 100）
  sortBy?: string;     // 排序字段（name/size/updated_at）
  order?: "asc" | "desc"; // 排序方向
}
```

**响应**:
```typescript
interface WeiyunFileList {
  DirList: WeiyunDir[];      // 目录列表
  FileList: WeiyunFile[];    // 文件列表
  TotalDirCount: number;     // 总目录数
  TotalFileCount: number;    // 总文件数
  FinishFlag: boolean;       // 是否加载完成
}
```

**实现要点**:
- 支持分页，需要循环获取所有数据
- 支持排序（名称、大小、修改时间）
- 需要处理 FinishFlag 判断是否还有更多数据

### 1.3 文件下载接口

```
POST /web/capi/download
```

**用途**: 获取文件下载链接

**请求参数**:
```typescript
interface DownloadParams {
  pdirKey: string;     // 父目录 DirKey
  fileID: string;      // 文件 ID
}
```

**响应**:
```typescript
interface DownloadInfo {
  DownloadUrl: string;  // 下载链接（可能是限时的）
  CookieName: string;   // 需要的 Cookie 名称
  CookieValue: string;  // 需要的 Cookie 值
  ExpiresIn?: number;   // 链接过期时间（秒）
}
```

**实现要点**:
- 下载链接可能有时效性，需要处理过期情况
- 下载时需要携带返回的 Cookie 信息
- 大文件下载可能需要分片或流式处理

### 1.4 文件上传接口

```
POST /web/capi/upload
```

**用途**: 上传文件到指定目录

**请求**: 多部分表单数据（Multipart Form Data）

**参数**:
```typescript
interface UploadParams {
  file: File | Blob;    // 文件内容
  pdirKey: string;      // 父目录 DirKey
  fileName: string;     // 文件名
  // 可能需要的其他参数（根据实际 API 确定）
}
```

**响应**:
```typescript
interface WeiyunFile {
  FileID: string;
  FileName: string;
  FileSize: number;
  FileCtime: number;
  FileMtime: number;
}
```

**实现要点**:
- 大文件可能需要分片上传
- 需要处理上传进度
- 需要错误重试机制
- 可能需要计算文件 hash 值

### 1.5 目录创建接口

```
POST /web/capi/createfolder
```

**用途**: 在指定目录下创建新文件夹

**请求参数**:
```typescript
interface CreateFolderParams {
  ppdirKey: string;    // 父目录的父目录 DirKey
  pdirKey: string;     // 父目录 DirKey
  dirName: string;     // 新目录名称
}
```

**响应**:
```typescript
interface WeiyunDir {
  DirKey: string;
  PdirKey: string;
  DirName: string;
  DirCtime: number;
  DirMtime: number;
}
```

### 1.6 文件/目录删除接口

```
POST /web/capi/delete
```

**用途**: 删除文件或目录

**请求参数**:
```typescript
interface DeleteParams {
  type: "file" | "dir";  // 类型
  pdirKey: string;       // 父目录 DirKey
  id: string;            // 文件 ID 或目录 DirKey
}
```

**响应**:
```typescript
{
  success: boolean;
  message?: string;
}
```

### 1.7 文件/目录移动接口

```
POST /web/capi/move
```

**用途**: 移动文件或目录到新位置

**请求参数**:
```typescript
interface MoveParams {
  type: "file" | "dir";
  srcPPdirKey: string;   // 源父目录的父目录 DirKey
  srcPdirKey: string;    // 源父目录 DirKey
  srcID: string;         // 源文件 ID 或目录 DirKey
  dstPPdirKey: string;   // 目标父目录的父目录 DirKey
  dstPdirKey: string;    // 目标父目录 DirKey
  dstDirKey: string;     // 目标目录 DirKey
}
```

**响应**:
```typescript
{
  success: boolean;
  // 返回移动后的文件/目录信息
}
```

### 1.8 文件重命名接口

```
POST /web/capi/rename
```

**用途**: 重命名文件

**请求参数**:
```typescript
interface RenameFileParams {
  ppdirKey: string;
  pdirKey: string;
  fileID: string;
  newFileName: string;
}
```

**响应**:
```typescript
interface WeiyunFile {
  FileID: string;
  FileName: string;
  // ... 其他文件信息
}
```

### 1.9 目录重命名接口

```
POST /web/capi/modifydir
```

**用途**: 重命名目录

**请求参数**:
```typescript
interface RenameDirParams {
  ppdirKey: string;
  pdirKey: string;
  dirKey: string;
  newDirName: string;
}
```

**响应**:
```typescript
interface WeiyunDir {
  DirKey: string;
  DirName: string;
  // ... 其他目录信息
}
```

### 1.10 获取目录路径接口

```
POST /web/capi/getdirpath
```

**用途**: 根据 DirKey 获取目录的完整路径

**请求参数**:
```typescript
interface GetDirPathParams {
  dirKey: string;  // 目录 DirKey
}
```

**响应**:
```typescript
interface DirPath {
  folders: WeiyunDir[];  // 从根目录到目标目录的所有目录列表
}
```

**实现要点**:
- 用于初始化时找到根目录的完整路径信息
- 可以用于路径验证

### 1.11 保活接口

```
POST /web/capi/keepalive
```

**用途**: 保持 Cookie 活跃（仅 QQ 登录类型需要）

**请求参数**:
```typescript
// 通常不需要额外参数，Cookie 在请求头中
```

**响应**:
```typescript
{
  success: boolean;
}
```

**实现要点**:
- 仅对 QQ 登录类型（LoginType === 1）生效
- 每 5 分钟调用一次
- 如果失败，可能需要重新授权

### 1.12 刷新 Token 接口

```
POST /web/capi/refresh
```

**用途**: 刷新 ctoken，更新 Cookie

**请求参数**:
```typescript
// 通常不需要额外参数，Cookie 在请求头中
```

**响应**:
```typescript
// 返回更新后的 Cookie 信息（可能在 Set-Cookie 头中）
```

**实现要点**:
- 需要从响应头中提取新的 Cookie
- 更新客户端 Cookie
- 触发 Cookie 更新回调

## 2. 错误码定义

```typescript
const ERROR_CODES = {
  COOKIE_EXPIRED: -110,      // Cookie 过期，需要重新授权
  FILE_NOT_FOUND: -404,      // 文件不存在
  PERMISSION_DENIED: -403,   // 权限不足
  RATE_LIMIT: -429,          // 请求频率过高
  INVALID_PARAM: -400,       // 参数错误
  NETWORK_ERROR: -1000,      // 网络错误（自定义）
};
```

## 3. HTTP 请求规范

### 3.1 请求头

所有请求必须包含以下请求头：

```
Cookie: p_skey=xxx; p_uin=xxx; pt4_token=xxx; ...
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...
Referer: https://www.weiyun.com
Content-Type: application/json  // 或 multipart/form-data（上传时）
```

### 3.2 请求格式

- 大多数接口使用 `POST` 方法
- 请求体通常为 JSON 格式
- 文件上传使用 `multipart/form-data`

### 3.3 响应格式

- 成功响应：JSON 对象
- 错误响应：包含 `code` 和 `message` 字段

```typescript
interface ApiResponse<T> {
  code?: number;
  message?: string;
  data?: T;
}
```

## 4. 注意事项

### 4.1 Cookie 管理

- Cookie 需要在所有请求中携带
- Cookie 可能自动更新，需要监听并保存
- Cookie 过期时需要重新授权

### 4.2 频率限制

- 可能存在请求频率限制
- 需要实现请求队列或延迟重试
- 错误码 `-429` 表示频率过高

### 4.3 分页处理

- 目录列表支持分页
- 需要循环获取直到 `FinishFlag` 为 `true`
- 注意分页参数（offset, count）

### 4.4 大文件处理

- 上传可能需要分片
- 下载可能需要流式处理
- 注意内存占用和超时设置

## 5. API 实现参考

参考 AList 的微云驱动实现：
- [AList 微云驱动源码](https://github.com/alist-org/alist/blob/main/drivers/weiyun/driver.go)
- [微云 SDK (Go)](https://github.com/foxxorcat/weiyun-sdk-go)

**注意**: 实际的 API 接口可能需要根据逆向工程结果进行调整。本文档基于 AList 的实现经验，实际实现时需要验证和调整。
