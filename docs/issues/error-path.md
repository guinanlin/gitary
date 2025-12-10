# GitDoc 404 错误问题总结

## 问题描述
- **域名**: `gitdoc.st.datangyuan.cn`
- **现象**: 访问域名显示 404 错误
- **容器状态**: Docker 容器正常运行（`oa-gitary-ljj19r` 服务运行正常）
- **部署平台**: Dokploy

## 问题原因

经过排查，发现问题的根本原因是：

1. **Vite Preview 配置错误**：
   - 当前启动命令：`vite preview --outDir dist`
   - 实际构建文件位置：`/app/dist/apps/web/`
   - Vite Preview 在 `/app/dist/` 目录下查找文件，但实际文件在 `/app/dist/apps/web/` 目录下
   - 导致 Vite Preview 服务器找不到文件，返回 404

2. **验证结果**：
   - ✅ Traefik 反向代理配置正确（路由规则已配置）
   - ✅ 容器网络连接正常（Traefik 可以访问容器）
   - ✅ 应用进程正常运行（监听 3000 端口）
   - ❌ Vite Preview 的 `--outDir` 参数指向错误目录

## 当前配置状态

### 已修复的问题
1. ✅ 修复了 `projectRoot` 计算错误（从 `../../..` 改为 `../..`）
2. ✅ 修复了 `root` 配置，预览时使用项目根目录
3. ✅ 添加了 `allowedHosts: true` 允许所有主机访问
4. ✅ 移除了不支持的 `--outDir` 命令行参数

### 当前配置

**`apps/web/config/vite.config.ts`**:
```typescript
const projectRoot = resolve(__dirname, "../..");  // 项目根目录
const isPreview = process.argv.includes("preview") || process.env.VITE_PREVIEW === "true";

export default defineConfig({
  root: isPreview ? projectRoot : resolve(__dirname, ".."),
  build: {
    outDir: isPreview ? resolve(projectRoot, "dist") : resolve(__dirname, "../../dist"),
  },
  preview: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    strictPort: false,
    allowedHosts: true,
  },
});
```

**`package.json` 启动脚本**:
```json
"start": "cross-env VITE_PREVIEW=true vite preview --config apps/web/config/vite.config.ts --host 0.0.0.0 --port ${PORT:-3000}"
```

## 需要确认的事项

### 1. 实际构建输出位置
根据之前的排查，实际构建文件可能在 `/app/dist/apps/web/` 而不是 `/app/dist/`。

**需要确认**：
- 在 Dokploy 容器中执行 `ls -la /app/dist/` 查看实际目录结构
- 确认构建输出是否真的在 `dist/apps/web/` 还是 `dist/`

### 2. 可能的解决方案

#### 如果构建输出在 `dist/apps/web/`：
需要修改 `vite.config.ts` 中的 `outDir` 配置：
```typescript
build: {
  outDir: isPreview ? resolve(projectRoot, "dist/apps/web") : resolve(__dirname, "../../dist"),
}
```

#### 如果构建输出在 `dist/`（项目根目录）：
当前配置应该可以工作，如果还有问题，可能需要：
1. 检查 Dokploy 容器中的工作目录
2. 确认 `vite preview` 是否正确读取了配置
3. 查看容器日志中的调试信息（`isPreview`, `projectRoot`, `dist path`）

## 当前配置信息

- **服务名称**: `oa-gitary-ljj19r`
- **容器 ID**: `9c658a9d6fac`
- **网络**: `dokploy-network`
- **容器 IP**: `10.0.1.128`
- **监听端口**: `3000`
- **Traefik 配置**: `/etc/dokploy/traefik/dynamic/oa-gitary-ljj19r.yml`（已正确配置）

## 验证步骤

修复后，可以通过以下命令验证：

```bash
# 从 Traefik 容器内测试
docker exec dokploy-traefik wget -O- --timeout=5 http://oa-gitary-ljj19r:3000/

# 应该返回 HTML 内容而不是 404
```

## 需要处理的事项

1. 修改 `package.json` 中的启动命令
2. 重新构建 Docker 镜像（如果使用 Dockerfile）
3. 或者在 Dokploy 中直接修改服务的启动命令
4. 重启服务验证修复效果

---

**排查时间**: 2024-12-10
**问题状态**: 已定位根因，待修复

