/**
 * 腾讯微云文件系统提供者
 * 实现 FileSystemProvider 接口
 */

import { Event } from "@/toolkit/vscode/event";
import { EventEmitter } from "@/toolkit/vscode/event-emitter";
import {
    FileChangeEvent,
    FileChangeType,
    FileStat,
    FileSystemProvider,
    FileType,
} from "@/toolkit/vscode/file-system";
import { Uri } from "@/toolkit/vscode/uri";
import { WeiyunClient } from "./weiyun-client";
import { WeiyunDir, WeiyunFile, WeiyunError } from "./weiyun-types";

export class WeiyunFileSystemProvider implements FileSystemProvider {
    private onDidChangeFileEmitter: EventEmitter<FileChangeEvent[]> =
        new EventEmitter<FileChangeEvent[]>();
    readonly onDidChangeFile: Event<FileChangeEvent[]> =
        this.onDidChangeFileEmitter.event;

    /** 路径 -> DirKey 映射缓存 */
    private dirCache: Map<string, string> = new Map();

    /** 文件信息缓存 */
    private fileCache: Map<string, { file: WeiyunFile; timestamp: number }> = new Map();

    /** 缓存过期时间 (5分钟) */
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor(
        private client: WeiyunClient,
        private rootDirKey: string,
        private rootPath: string
    ) {
        // 缓存根目录
        this.dirCache.set("/", rootDirKey);
        this.dirCache.set("", rootDirKey);
    }

    // ==================== FileSystemProvider 接口实现 ====================

    /**
     * 获取文件或目录信息
     */
    async stat(uri: Uri): Promise<FileStat> {
        try {
            const path = this.normalizePath(uri.path);

            // 根目录
            if (path === "/" || path === "") {
                return {
                    type: FileType.Directory,
                    ctime: Date.now(),
                    mtime: Date.now(),
                    size: 0,
                };
            }

            // 分离目录和文件名
            const { dirPath, name } = this.splitPath(path);
            const dirKey = await this.resolvePathToDirKey(dirPath);

            // 获取父目录列表
            const dirList = await this.client.diskDirFileList(dirKey);

            // 查找目录
            const dir = dirList.DirList.find((d) => d.DirName === name);
            if (dir) {
                return {
                    type: FileType.Directory,
                    ctime: dir.DirCtime,
                    mtime: dir.DirMtime,
                    size: 0,
                };
            }

            // 查找文件
            const file = dirList.FileList.find((f) => f.FileName === name);
            if (file) {
                return {
                    type: FileType.File,
                    ctime: file.FileCtime,
                    mtime: file.FileMtime,
                    size: file.FileSize,
                };
            }

            throw new WeiyunError(404, `文件或目录不存在: ${path}`);
        } catch (error) {
            console.error("[WeiyunFS] stat error:", error);
            throw error;
        }
    }

    /**
     * 读取目录内容
     */
    async readDirectory(uri: Uri): Promise<[string, FileType][]> {
        try {
            const path = this.normalizePath(uri.path);
            const dirKey = await this.resolvePathToDirKey(path);

            const dirList = await this.client.diskDirFileList(dirKey);

            const result: [string, FileType][] = [];

            // 添加目录
            dirList.DirList.forEach((dir) => {
                result.push([dir.DirName, FileType.Directory]);
            });

            // 添加文件
            dirList.FileList.forEach((file) => {
                result.push([file.FileName, FileType.File]);
            });

            return result;
        } catch (error) {
            console.error("[WeiyunFS] readDirectory error:", error);
            if ((error as any)?.isNotFound) {
                return [];
            }
            throw error;
        }
    }

    /**
     * 读取文件内容
     */
    async readFile(uri: Uri): Promise<Uint8Array> {
        try {
            const path = this.normalizePath(uri.path);
            const { dirPath, name } = this.splitPath(path);

            // 查找文件
            const file = await this.findFileInDir(dirPath, name);
            if (!file) {
                throw new WeiyunError(404, `文件不存在: ${path}`);
            }

            // 获取下载信息
            const dirKey = await this.resolvePathToDirKey(dirPath);
            const parentDirKey = await this.getParentDirKey(dirKey);

            const downloadInfo = await this.client.diskFileDownload({
                PPdirKey: parentDirKey,
                PdirKey: dirKey,
                FileID: file.FileID,
                FileName: file.FileName,
            });

            // 下载文件内容
            const content = await this.client.downloadFileContent(downloadInfo);

            return content;
        } catch (error) {
            console.error("[WeiyunFS] readFile error:", error);
            throw error;
        }
    }

    /**
     * 写入文件
     */
    async writeFile(uri: Uri, content: Uint8Array): Promise<void> {
        try {
            const path = this.normalizePath(uri.path);
            const { dirPath, name } = this.splitPath(path);
            const dirKey = await this.resolvePathToDirKey(dirPath);

            // 检查文件是否存在
            const existingFile = await this.findFileInDir(dirPath, name);

            if (existingFile) {
                // 更新文件: 先删除后上传
                const parentDirKey = await this.getParentDirKey(dirKey);

                await this.client.diskFileDelete({
                    PPdirKey: parentDirKey,
                    PdirKey: dirKey,
                    FileID: existingFile.FileID,
                    FileName: existingFile.FileName,
                });
            }

            // 上传文件
            const parentDirKey = await this.getParentDirKey(dirKey);
            const blob = new Blob([content as BlobPart]);
            await this.client.diskFileUpload({
                pdirKey: dirKey,
                fileName: name,
                file: blob,
                fileSize: content.length,
            });

            // 清除缓存
            this.fileCache.delete(path);

            this.onDidChangeFileEmitter.fire([
                {
                    type: existingFile ? FileChangeType.Changed : FileChangeType.Created,
                    uri
                },
            ]);
        } catch (error) {
            console.error("[WeiyunFS] writeFile error:", error);
            throw error;
        }
    }

    /**
     * 创建目录
     */
    async createDirectory(uri: Uri): Promise<void> {
        try {
            const path = this.normalizePath(uri.path);
            const { dirPath, name } = this.splitPath(path);
            const parentDirKey = await this.resolvePathToDirKey(dirPath);
            const grandParentDirKey = await this.getParentDirKey(parentDirKey);

            await this.client.diskDirCreate({
                PPdirKey: grandParentDirKey,
                PdirKey: parentDirKey,
                DirName: name,
            });

            // 清除缓存,以便下次查询时更新
            this.dirCache.delete(path);

            this.onDidChangeFileEmitter.fire([
                { type: FileChangeType.Created, uri },
            ]);
        } catch (error) {
            console.error("[WeiyunFS] createDirectory error:", error);
            throw error;
        }
    }

    /**
     * 删除文件或目录
     */
    async delete(uri: Uri, options: { recursive: boolean }): Promise<void> {
        try {
            const path = this.normalizePath(uri.path);
            const { dirPath, name } = this.splitPath(path);
            const dirKey = await this.resolvePathToDirKey(dirPath);
            const parentDirKey = await this.getParentDirKey(dirKey);

            // 获取目录列表
            const dirList = await this.client.diskDirFileList(dirKey);

            // 查找目录
            const dir = dirList.DirList.find((d) => d.DirName === name);
            if (dir) {
                await this.client.diskDirDelete({
                    PPdirKey: parentDirKey,
                    PdirKey: dirKey,
                    DirKey: dir.DirKey,
                    DirName: dir.DirName,
                });

                // 清除缓存
                this.dirCache.delete(path);

                this.onDidChangeFileEmitter.fire([
                    { type: FileChangeType.Deleted, uri },
                ]);
                return;
            }

            // 查找文件
            const file = dirList.FileList.find((f) => f.FileName === name);
            if (file) {
                await this.client.diskFileDelete({
                    PPdirKey: parentDirKey,
                    PdirKey: dirKey,
                    FileID: file.FileID,
                    FileName: file.FileName,
                });

                // 清除缓存
                this.fileCache.delete(path);

                this.onDidChangeFileEmitter.fire([
                    { type: FileChangeType.Deleted, uri },
                ]);
                return;
            }

            throw new WeiyunError(404, `文件或目录不存在: ${path}`);
        } catch (error) {
            console.error("[WeiyunFS] delete error:", error);
            throw error;
        }
    }

    /**
     * 重命名文件或目录
     */
    async rename(
        oldUri: Uri,
        newUri: Uri,
        options: { overwrite: boolean }
    ): Promise<void> {
        try {
            const oldPath = this.normalizePath(oldUri.path);
            const newPath = this.normalizePath(newUri.path);

            const { dirPath: oldDirPath, name: oldName } = this.splitPath(oldPath);
            const { dirPath: newDirPath, name: newName } = this.splitPath(newPath);

            // 必须在同一目录下
            if (oldDirPath !== newDirPath) {
                throw new Error("暂不支持跨目录移动文件");
            }

            const dirKey = await this.resolvePathToDirKey(oldDirPath);
            const parentDirKey = await this.getParentDirKey(dirKey);

            // 获取目录列表
            const dirList = await this.client.diskDirFileList(dirKey);

            // 查找目录
            const dir = dirList.DirList.find((d) => d.DirName === oldName);
            if (dir) {
                await this.client.diskDirAttrModify(
                    {
                        PPdirKey: parentDirKey,
                        PdirKey: dirKey,
                        DirKey: dir.DirKey,
                        DirName: oldName,
                    },
                    newName
                );

                // 清除缓存
                this.dirCache.delete(oldPath);
                this.dirCache.delete(newPath);

                this.onDidChangeFileEmitter.fire([
                    { type: FileChangeType.Deleted, uri: oldUri },
                    { type: FileChangeType.Created, uri: newUri },
                ]);
                return;
            }

            // 查找文件
            const file = dirList.FileList.find((f) => f.FileName === oldName);
            if (file) {
                await this.client.diskFileRename(
                    {
                        PPdirKey: parentDirKey,
                        PdirKey: dirKey,
                        FileID: file.FileID,
                        FileName: oldName,
                    },
                    newName
                );

                // 清除缓存
                this.fileCache.delete(oldPath);
                this.fileCache.delete(newPath);

                this.onDidChangeFileEmitter.fire([
                    { type: FileChangeType.Deleted, uri: oldUri },
                    { type: FileChangeType.Created, uri: newUri },
                ]);
                return;
            }

            throw new WeiyunError(404, `文件或目录不存在: ${oldPath}`);
        } catch (error) {
            console.error("[WeiyunFS] rename error:", error);
            throw error;
        }
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 规范化路径
     */
    private normalizePath(path: string): string {
        if (!path || path === "/") {
            return "/";
        }

        // 移除开头的斜杠
        if (path.startsWith("/")) {
            path = path.substring(1);
        }

        // 移除结尾的斜杠
        if (path.endsWith("/")) {
            path = path.substring(0, path.length - 1);
        }

        return path;
    }

    /**
     * 分离路径为目录和名称
     */
    private splitPath(path: string): { dirPath: string; name: string } {
        if (path === "/" || path === "") {
            return { dirPath: "/", name: "" };
        }

        const lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) {
            return { dirPath: "/", name: path };
        }

        const dirPath = path.substring(0, lastSlash) || "/";
        const name = path.substring(lastSlash + 1);

        return { dirPath, name };
    }

    /**
     * 解析路径到 DirKey
     */
    private async resolvePathToDirKey(path: string): Promise<string> {
        path = this.normalizePath(path);

        // 检查缓存
        if (this.dirCache.has(path)) {
            return this.dirCache.get(path)!;
        }

        // 根目录
        if (path === "/" || path === "") {
            return this.rootDirKey;
        }

        // 分割路径
        const parts = path.split("/").filter((p) => p);
        let currentDirKey = this.rootDirKey;
        let currentPath = "";

        // 逐级查找
        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            // 检查缓存
            if (this.dirCache.has(currentPath)) {
                currentDirKey = this.dirCache.get(currentPath)!;
                continue;
            }

            // 查找子目录
            const dirs = await this.client.diskDirFileList(currentDirKey);
            const dir = dirs.DirList.find((d) => d.DirName === part);

            if (!dir) {
                throw new WeiyunError(404, `目录不存在: ${currentPath}`);
            }

            currentDirKey = dir.DirKey;

            // 更新缓存
            this.dirCache.set(currentPath, currentDirKey);
        }

        return currentDirKey;
    }

    /**
     * 在目录中查找文件
     */
    private async findFileInDir(
        dirPath: string,
        fileName: string
    ): Promise<WeiyunFile | null> {
        try {
            const fullPath = dirPath === "/" ? fileName : `${dirPath}/${fileName}`;

            // 检查缓存
            const cached = this.fileCache.get(fullPath);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.file;
            }

            const dirKey = await this.resolvePathToDirKey(dirPath);
            const dirList = await this.client.diskDirFileList(dirKey);

            const file = dirList.FileList.find((f) => f.FileName === fileName);

            if (file) {
                // 更新缓存
                this.fileCache.set(fullPath, { file, timestamp: Date.now() });
            }

            return file || null;
        } catch (error) {
            console.error("[WeiyunFS] findFileInDir error:", error);
            return null;
        }
    }

    /**
     * 获取父目录 DirKey
     */
    private async getParentDirKey(dirKey: string): Promise<string> {
        if (dirKey === this.rootDirKey) {
            // 如果是根目录,返回根目录的父目录
            // 这里需要通过 API 获取
            const pathInfo = await this.client.libDirPathGet(dirKey);
            if (pathInfo.length >= 2) {
                return pathInfo[pathInfo.length - 2].DirKey;
            }
            return dirKey; // 如果没有父目录,返回自己
        }

        // 通过 API 获取目录路径
        const pathInfo = await this.client.libDirPathGet(dirKey);
        if (pathInfo.length >= 2) {
            return pathInfo[pathInfo.length - 2].DirKey;
        }

        return this.rootDirKey;
    }
}
