# 腾讯微云 Workspace 集成技术规格文档 (PRD)

## 文档信息

- **版本**: 1.0.0
- **创建日期**: 2025-01-27
- **目标读者**: 后端/全栈工程师
- **状态**: 待实施

> **注意**: 本文档包含完整的技术规格，详细实现细节请参考：
> - [架构设计文档](./weiyun-architecture.md)
> - [API 接口文档](./weiyun-api-spec.md)
> - [实施计划文档](./weiyun-implementation-plan.md)

---

## 1. 概述

### 1.1 项目背景

当前系统支持多种 Workspace 类型：
- **Git 平台**: GitHub、Gitee、GitCode（基于 OAuth 授权）
- **本地存储**: IndexedDB（无需授权）

现在需要新增 **腾讯微云** 作为 Workspace 类型，允许用户将微云中的文件夹作为工作空间，在其中创建和编辑笔记文件。

### 1.2 核心目标

1. 支持腾讯微云作为 Workspace 类型
2. 实现基于 Cookie 的授权机制（微云无开放 API 和 OAuth）
3. 实现完整的文件系统操作（读取、写入、创建、删除等）
4. 保持与现有 Workspace 架构的一致性

### 1.3 技术约束

- **无官方 API**: 微云没有开放 API，需要通过逆向 Web 接口
- **Cookie 授权**: 使用浏览器 Cookie 作为授权凭证，而非 OAuth
- **目录体系**: 微云使用 DirKey 体系（目录 ID），而非纯路径
- **保活机制**: QQ 登录类型需要定期保活（5 分钟间隔）

---

## 2. 架构设计概览

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    UI 层                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Add Workspace Menu                              │   │
│  │  - Cookie 输入界面                                │   │
│  │  - 文件夹选择界面                                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 服务层 (Services)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AuthService  │  │ SpaceService │  │WeiyunClient  │  │
│  │ - Cookie存储 │  │ - Workspace  │  │ - API封装    │  │
│  │ - 授权管理   │  │   管理       │  │ - Cookie管理 │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              文件系统层 (FileSystemProvider)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  WeiyunFileSystemProvider                        │   │
│  │  - stat()      - readDirectory()                 │   │
│  │  - readFile()  - writeFile()                     │   │
│  │  - createDirectory() - delete() - rename()       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│               微云 API 层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ DiskUserInfo │  │ DiskDirFile  │  │ DiskFile     │  │
│  │ Get()        │  │ List()       │  │ Download()   │  │
│  │              │  │ Create()     │  │ Upload()     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 关键组件

1. **WeiyunClient**: 微云 API 客户端封装
2. **WeiyunFileSystemProvider**: 文件系统提供者实现
3. **WeiyunAuthProvider**: 授权提供者（Cookie 输入/验证）
4. **WeiyunPlatformConfig**: 平台注册配置

详细设计请参考 [架构设计文档](./weiyun-architecture.md)

---

## 3. 数据模型

### 3.1 Workspace 标识结构

```typescript
interface WeiyunWorkspace {
  platform: "weiyun";           // 平台标识
  owner: string;                 // 用户 UIN（从 Cookie 中提取）
  repo: string;                  // 文件夹路径（如 "/我的笔记" 或 "/"）
  id: string;                    // Workspace ID（自动生成）
}
```

**示例**:
```typescript
{
  platform: "weiyun",
  owner: "123456789",
  repo: "/我的笔记",
  id: "weiyun-123456789-我的笔记"
}
```

### 3.2 授权信息结构

```typescript
interface AuthInfo {
  platform: "weiyun";
  username: string;              // UIN 值
  accessToken: string;           // Cookie 字符串
  expirationTime?: number;       // Cookie 过期时间（如果知道）
  createdAt: number;             // 创建时间戳
}
```

**Cookie 存储格式**:
```
p_skey=xxx; p_uin=xxx; pt4_token=xxx; skey=xxx; uin=xxx; vcookie=xxx
```

**存储方案**: 使用现有 `authService` 的 localStorage 存储，存储在 `AuthInfo.accessToken` 字段中。

### 3.3 微云目录结构

微云使用 DirKey 体系，而非纯路径：

```typescript
interface WeiyunDir {
  DirKey: string;                // 目录唯一标识符
  PdirKey: string;               // 父目录 DirKey
  DirName: string;               // 目录名称
  DirCtime: number;              // 创建时间
  DirMtime: number;              // 修改时间
}

interface WeiyunFile {
  FileID: string;                // 文件唯一标识符
  FileName: string;              // 文件名称
  FileSize: number;              // 文件大小
  FileCtime: number;             // 创建时间
  FileMtime: number;             // 修改时间
}
```

**关键点**: 需要维护路径到 DirKey 的映射关系，对外使用路径，内部使用 DirKey。

---

## 4. 核心功能需求

### 4.1 授权功能

#### 4.1.1 Cookie 获取流程

用户操作步骤：
1. 用户在浏览器中打开 https://www.weiyun.com 并登录
2. 打开浏览器开发者工具（F12）
3. 切换到 Application → Cookies
4. 复制所有 Cookie 值
5. 粘贴到应用的 Cookie 输入框

#### 4.1.2 Cookie 验证

- 创建临时客户端验证 Cookie 有效性
- 调用 `diskUserInfoGet()` 接口验证
- 提取 UIN 作为用户标识

#### 4.1.3 Cookie 保活

- QQ 登录类型：每 5 分钟调用 `keepAlive()` 接口
- 微信登录类型：无需保活
- Cookie 更新时自动保存

### 4.2 文件系统功能

需要实现完整的 `FileSystemProvider` 接口：

| 功能 | 方法 | 说明 |
|------|------|------|
| 文件状态 | `stat(uri)` | 获取文件/目录信息 |
| 列出目录 | `readDirectory(uri)` | 获取目录下的文件和文件夹 |
| 读取文件 | `readFile(uri)` | 下载并读取文件内容 |
| 写入文件 | `writeFile(uri, content)` | 上传文件（可能需要分片） |
| 创建目录 | `createDirectory(uri)` | 创建新文件夹 |
| 删除 | `delete(uri)` | 删除文件或目录 |
| 重命名 | `rename(oldUri, newUri)` | 重命名文件或目录 |

### 4.3 UI 功能

#### 4.3.1 Add Workspace 菜单集成

在 "Add Workspace" 菜单中添加 "腾讯微云" 选项：
- 首次：显示 Cookie 输入界面
- 已授权：显示文件夹选择列表
- 支持选择根目录或子文件夹

#### 4.3.2 Cookie 输入界面

- 说明文字（如何获取 Cookie）
- 多行文本输入框
- 验证和保存按钮

#### 4.3.3 文件夹选择界面

- 文件夹列表展示
- 支持展开/折叠
- "使用根目录" 选项

---

## 5. 技术实现要点

### 5.1 路径解析

**核心问题**: URI 路径（如 `/我的笔记/文档.md`）需要转换为 DirKey 进行 API 调用。

**解决方案**:
- 维护路径到 DirKey 的映射缓存
- 从根目录开始逐级查找
- 对外使用路径，内部使用 DirKey

### 5.2 Cookie 管理

- **存储**: localStorage（通过 authService）
- **更新**: 监听 SDK 的 Cookie 更新回调
- **过期**: 监听过期回调，提示用户重新授权

### 5.3 错误处理

常见错误码：
- `-110`: Cookie 过期，需要重新授权
- `-404`: 文件不存在
- `-403`: 权限不足
- `-429`: 请求频率过高

---

## 6. 安全考虑

### 6.1 Cookie 安全

- Cookie 存储在 localStorage（当前方案）
- 未来可考虑加密存储（AES）
- 不在日志中输出完整 Cookie

### 6.2 传输安全

- 所有 API 请求使用 HTTPS
- Cookie 仅在请求头中传输
- 不在 URL 参数中传递 Cookie

---

## 7. 文件结构

```
src/
├── services/
│   ├── weiyun-client.ts              # 微云 API 客户端
│   ├── weiyun-file-system.provider.ts # 文件系统提供者
│   └── weiyun-types.ts                # 类型定义
├── plugins/
│   ├── services/
│   │   └── auth/
│   │       └── providers/
│   │           └── weiyun/           # 微云授权提供者
│   │               ├── index.ts
│   │               └── auth-dialog.tsx
│   └── space/
│       ├── platforms/
│       │   └── weiyun.ts             # 平台注册
│       └── addSpace/
│           └── components/
│               └── weiyun-menu-item.tsx # UI 组件
└── libs/
    └── weiyun-api/                    # 微云 API SDK（可选）
        ├── index.ts
        └── types.ts
```

---

## 8. 实施计划

### Phase 1: 核心基础设施（MVP）
- [ ] 创建 WeiyunClient 基础类
- [ ] 实现 Cookie 存储和验证
- [ ] 实现用户信息接口
- [ ] 实现目录列表接口
- [ ] 实现文件下载接口
- [ ] 创建 WeiyunFileSystemProvider 基础结构
- [ ] 实现 readDirectory()、readFile()、stat() 方法
- [ ] 平台注册和初始化流程

### Phase 2: 完整文件操作
- [ ] 实现 writeFile() 方法（文件上传）
- [ ] 实现 createDirectory()、delete()、rename() 方法
- [ ] 路径解析和 DirKey 映射
- [ ] 目录缓存机制

### Phase 3: 高级功能
- [ ] Cookie 保活机制（QQ 登录）
- [ ] Cookie 过期检测和提示
- [ ] Cookie 自动更新机制
- [ ] 错误处理和重试机制
- [ ] 大文件上传支持（分片）
- [ ] UI 界面完善

### Phase 4: 优化和测试
- [ ] 性能优化（缓存策略）
- [ ] 并发请求控制
- [ ] 完整测试覆盖
- [ ] 文档完善

详细实施计划请参考 [实施计划文档](./weiyun-implementation-plan.md)

---

## 9. 参考资料

### 9.1 相关文档

- [架构设计文档](./weiyun-architecture.md) - 详细的架构设计
- [API 接口文档](./weiyun-api-spec.md) - 完整的 API 接口定义
- [实施计划文档](./weiyun-implementation-plan.md) - 详细的实施步骤
- [FileSystemProvider 集成指南](../file-system-provider.md)
- [AList 微云驱动实现](https://github.com/alist-org/alist/blob/main/drivers/weiyun/driver.go)

### 9.2 代码参考

- `src/services/gite-repo-file-system.provider.ts` - Git 文件系统实现
- `src/services/indexed-db-file-system.provider.ts` - IndexedDB 实现
- `src/plugins/services/auth/` - 授权服务实现
- `src/plugins/space/platforms/index.ts` - 平台注册实现

---

## 10. 文档更新记录

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|---------|------|
| 1.0.0 | 2025-01-27 | 初始版本 | - |

---

**注意**: 本文档是基于 AList 微云驱动实现和现有架构设计的技术规格文档。实际实现时，需要根据微云 API 的具体情况进行调整和验证。
