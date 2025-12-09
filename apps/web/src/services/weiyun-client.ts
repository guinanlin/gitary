/**
 * 腾讯微云 API 客户端
 * 封装微云 Web API 接口
 */

import {
    WeiyunUserInfo,
    WeiyunFileList,
    WeiyunDir,
    WeiyunFile,
    FolderParam,
    FileParam,
    ListOptions,
    FileUploadParam,
    DownloadInfo,
    WeiyunError,
    WEIYUN_ERROR_CODES,
} from "./weiyun-types";

export interface WeiyunClientConfig {
    /** Cookie 字符串 */
    cookies: string;
    /** Cookie 过期回调 */
    onCookieExpired?: (error: Error) => void;
    /** Cookie 更新回调 */
    onCookieUpdate?: (cookies: string) => void;
}

export class WeiyunClient {
    private cookies: string;
    private onCookieExpired?: (error: Error) => void;
    private onCookieUpdate?: (cookies: string) => void;
    private keepAliveTimer?: number;
    private loginType: number = 0;
    private baseURL = "https://www.weiyun.com";

    constructor(config: WeiyunClientConfig) {
        this.cookies = config.cookies;
        this.onCookieExpired = config.onCookieExpired;
        this.onCookieUpdate = config.onCookieUpdate;
    }

    // ==================== Cookie 管理 ====================

    setCookies(cookies: string): void {
        this.cookies = cookies;
    }

    getCookies(): string {
        return this.cookies;
    }

    setOnCookieUpdate(callback: (cookies: string) => void): void {
        this.onCookieUpdate = callback;
    }

    setOnCookieExpired(callback: (error: Error) => void): void {
        this.onCookieExpired = callback;
    }

    getLoginType(): number {
        return this.loginType;
    }
    /**
     * 保活请求 (仅 QQ 登录需要)
     */
    async keepAlive(): Promise<void> {
        if (this.loginType !== 1) {
            return;
        }

        try {
            await this.request("/web/capi/keepalive", {});
        } catch (error) {
            console.error("[WeiyunClient] KeepAlive failed:", error);
            if (this.onCookieExpired) {
                this.onCookieExpired(error as Error);
            }
            throw error;
        }
    }

    /**
     * 启动保活定时器 (仅 QQ 登录)
     */
    startKeepAlive(): void {
        if (this.loginType === 1) {
            this.keepAliveTimer = window.setInterval(() => {
                this.keepAlive().catch((error) => {
                    console.error("[WeiyunClient] KeepAlive error:", error);
                });
            }, 5 * 60 * 1000); // 5 分钟
        }
    }

    /**
     * 停止保活定时器
     */
    stopKeepAlive(): void {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = undefined;
        }
    }

    // ==================== 用户信息 ====================

    /**
     * 获取用户信息
     */
    async diskUserInfoGet(): Promise<WeiyunUserInfo> {
        const data = await this.request<WeiyunUserInfo>("/web/capi/userinfo", {});

        // 保存登录类型
        if (data.LoginType) {
            this.loginType = data.LoginType;
        }

        return data;
    }

    // ==================== 目录操作 ====================

    /**
     * 获取目录路径
     */
    async libDirPathGet(dirKey: string): Promise<WeiyunDir[]> {
        const data = await this.request<{ folders: WeiyunDir[] }>(
            "/web/capi/getdirpath",
            { dirKey }
        );
        return data.folders || [];
    }

    /**
     * 获取目录文件列表
     */
    async diskDirFileList(
        dirKey: string,
        options?: ListOptions
    ): Promise<WeiyunFileList> {
        const params = {
            dirKey,
            offset: options?.offset || 0,
            count: options?.count || 100,
            sortBy: options?.sortBy || "name",
            order: options?.order || "asc",
        };

        const data = await this.request<WeiyunFileList>(
            "/web/capi/filelist",
            params
        );

        // 如果还有更多数据,递归获取
        if (!data.FinishFlag && data.FileList.length > 0) {
            const nextData = await this.diskDirFileList(dirKey, {
                ...options,
                offset: (options?.offset || 0) + (options?.count || 100),
            });

            data.DirList = [...data.DirList, ...nextData.DirList];
            data.FileList = [...data.FileList, ...nextData.FileList];
            data.FinishFlag = nextData.FinishFlag;
        }

        return data;
    }

    /**
     * 创建目录
     */
    async diskDirCreate(param: FolderParam): Promise<WeiyunDir> {
        const data = await this.request<WeiyunDir>("/web/capi/createfolder", {
            ppdirKey: param.PPdirKey,
            pdirKey: param.PdirKey,
            dirName: param.DirName,
        });
        return data;
    }

    /**
     * 移动目录
     */
    async diskDirMove(src: FolderParam, dest: FolderParam): Promise<void> {
        await this.request("/web/capi/move", {
            type: "dir",
            srcPPdirKey: src.PPdirKey,
            srcPdirKey: src.PdirKey,
            srcID: src.DirKey,
            dstPPdirKey: dest.PPdirKey,
            dstPdirKey: dest.PdirKey,
            dstDirKey: dest.DirKey,
        });
    }

    /**
     * 重命名目录
     */
    async diskDirAttrModify(param: FolderParam, newName: string): Promise<void> {
        await this.request("/web/capi/modifydir", {
            ppdirKey: param.PPdirKey,
            pdirKey: param.PdirKey,
            dirKey: param.DirKey,
            newDirName: newName,
        });
    }

    /**
     * 删除目录
     */
    async diskDirDelete(param: FolderParam): Promise<void> {
        await this.request("/web/capi/delete", {
            type: "dir",
            pdirKey: param.PdirKey,
            id: param.DirKey,
        });
    }

    // ==================== 文件操作 ====================

    /**
     * 获取文件下载信息
     */
    async diskFileDownload(param: FileParam): Promise<DownloadInfo> {
        const data = await this.request<DownloadInfo>("/web/capi/download", {
            pdirKey: param.PdirKey,
            fileID: param.FileID,
        });
        return data;
    }

    /**
     * 下载文件内容
     */
    async downloadFileContent(downloadInfo: DownloadInfo): Promise<Uint8Array> {
        try {
            const response = await fetch(downloadInfo.DownloadUrl, {
                headers: {
                    Cookie: `${downloadInfo.CookieName}=${downloadInfo.CookieValue}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            console.error("[WeiyunClient] Download file content failed:", error);
            throw error;
        }
    }

    /**
     * 上传文件
     */
    async diskFileUpload(param: FileUploadParam): Promise<WeiyunFile> {
        const formData = new FormData();
        formData.append("file", param.file);
        formData.append("pdirKey", param.pdirKey);
        formData.append("fileName", param.fileName);

        if (param.fileSize) {
            formData.append("fileSize", param.fileSize.toString());
        }

        const data = await this.requestFormData<WeiyunFile>(
            "/web/capi/upload",
            formData
        );
        return data;
    }

    /**
     * 移动文件
     */
    async diskFileMove(src: FileParam, dest: FolderParam): Promise<void> {
        await this.request("/web/capi/move", {
            type: "file",
            srcPPdirKey: src.PPdirKey,
            srcPdirKey: src.PdirKey,
            srcID: src.FileID,
            dstPPdirKey: dest.PPdirKey,
            dstPdirKey: dest.PdirKey,
            dstDirKey: dest.DirKey,
        });
    }

    /**
     * 重命名文件
     */
    async diskFileRename(param: FileParam, newName: string): Promise<void> {
        await this.request("/web/capi/rename", {
            ppdirKey: param.PPdirKey,
            pdirKey: param.PdirKey,
            fileID: param.FileID,
            newFileName: newName,
        });
    }

    /**
     * 删除文件
     */
    async diskFileDelete(param: FileParam): Promise<void> {
        await this.request("/web/capi/delete", {
            type: "file",
            pdirKey: param.PdirKey,
            id: param.FileID,
        });
    }

    // ==================== 内部方法 ====================

    /**
     * 设置 Cookie 到浏览器（尝试设置，但不保证成功）
     */
    private setBrowserCookies(): void {
        try {
            const cookies = this.cookies.split(";");
            cookies.forEach((cookie) => {
                const trimmed = cookie.trim();
                if (trimmed) {
                    const [key, ...valueParts] = trimmed.split("=");
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join("=");
                        try {
                            document.cookie = `${key}=${value}; path=/; domain=.weiyun.com; SameSite=None; Secure`;
                        } catch (e) {
                            console.warn(`[WeiyunClient] Failed to set cookie ${key}:`, e);
                        }
                    }
                }
            });
        } catch (error) {
            console.warn("[WeiyunClient] Failed to set browser cookies:", error);
        }
    }

    /**
     * 使用 XMLHttpRequest 发送请求（支持自定义 Cookie 头部）
     */
    private async requestWithXHR<T>(endpoint: string, params: any): Promise<T> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `${this.baseURL}${endpoint}`;

            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Cookie", this.cookies);
            xhr.setRequestHeader(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            );
            xhr.setRequestHeader("Referer", this.baseURL);

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data.code && data.code !== 0) {
                                const error = WeiyunError.fromResponse(data);
                                if (error.isCookieExpired && this.onCookieExpired) {
                                    this.onCookieExpired(error);
                                }
                                reject(error);
                            } else {
                                resolve(data.data || data);
                            }
                        } catch (error) {
                            reject(
                                new WeiyunError(
                                    WEIYUN_ERROR_CODES.NETWORK_ERROR,
                                    `Failed to parse response: ${error}`,
                                    error
                                )
                            );
                        }
                    } else {
                        reject(
                            new WeiyunError(
                                WEIYUN_ERROR_CODES.NETWORK_ERROR,
                                `HTTP ${xhr.status}: ${xhr.statusText}`,
                                null
                            )
                        );
                    }
                }
            };

            xhr.onerror = () => {
                reject(
                    new WeiyunError(
                        WEIYUN_ERROR_CODES.NETWORK_ERROR,
                        "Network request failed",
                        null
                    )
                );
            };

            xhr.send(JSON.stringify(params));
        });
    }

    /**
     * 发送请求
     */
    private async request<T>(endpoint: string, params: any): Promise<T> {
        try {
            this.setBrowserCookies();

            try {
                const response = await fetch(`${this.baseURL}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        Referer: this.baseURL,
                    },
                    credentials: "include",
                    body: JSON.stringify(params),
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // 检查并更新 Cookie
                const setCookie = response.headers.get("set-cookie");
                if (setCookie) {
                    this.updateCookies(setCookie);
                }

                    const data = await response.json();

                // 检查错误
                if (data.code && data.code !== 0) {
                    const error = WeiyunError.fromResponse(data);

                    // Cookie 过期
                    if (error.isCookieExpired && this.onCookieExpired) {
                        this.onCookieExpired(error);
                    }

                    throw error;
                }

                return data.data || data;
            } catch (fetchError) {
                // 如果 fetch 失败（可能是 CORS 问题），尝试使用 XMLHttpRequest
                console.warn("[WeiyunClient] Fetch failed, trying XMLHttpRequest:", fetchError);
                try {
                    return await this.requestWithXHR<T>(endpoint, params);
                } catch (xhrError) {
                    // 如果 XMLHttpRequest 也失败，抛出原始错误
                    if (fetchError instanceof WeiyunError) {
                        throw fetchError;
                    }
                    if (xhrError instanceof WeiyunError) {
                        throw xhrError;
                    }
                    
                    const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
                    console.error("[WeiyunClient] Request failed:", {
                        endpoint,
                        fetchError: errorMessage,
                        xhrError: xhrError instanceof Error ? xhrError.message : String(xhrError),
                        cookiesLength: this.cookies.length,
                    });
                    
                    throw new WeiyunError(
                        WEIYUN_ERROR_CODES.NETWORK_ERROR,
                        `Network error: ${errorMessage}`,
                        fetchError
                    );
                }
            }
        } catch (error) {
            if (error instanceof WeiyunError) {
                throw error;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[WeiyunClient] Request failed:", {
                endpoint,
                error: errorMessage,
                cookiesLength: this.cookies.length,
            });
            
            throw new WeiyunError(
                WEIYUN_ERROR_CODES.NETWORK_ERROR,
                `Network error: ${errorMessage}`,
                error
            );
        }
    }

    /**
     * 发送 FormData 请求
     */
    private async requestFormData<T>(
        endpoint: string,
        formData: FormData
    ): Promise<T> {
        try {
            this.setBrowserCookies();

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: "POST",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Referer: this.baseURL,
                },
                credentials: "include",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 检查并更新 Cookie
            const setCookie = response.headers.get("set-cookie");
            if (setCookie) {
                this.updateCookies(setCookie);
            }

            const data = await response.json();

            // 检查错误
            if (data.code && data.code !== 0) {
                const error = WeiyunError.fromResponse(data);

                if (error.isCookieExpired && this.onCookieExpired) {
                    this.onCookieExpired(error);
                }

                throw error;
            }

            return data.data || data;
        } catch (error) {
            if (error instanceof WeiyunError) {
                throw error;
            }
            throw new WeiyunError(
                WEIYUN_ERROR_CODES.NETWORK_ERROR,
                `Network error: ${error}`,
                error
            );
        }
    }

    /**
     * 更新 Cookie
     */
    private updateCookies(setCookie: string): void {
        // 合并新的 Cookie
        const newCookies = this.mergeCookies(this.cookies, setCookie);
        if (newCookies !== this.cookies) {
            this.cookies = newCookies;
            if (this.onCookieUpdate) {
                this.onCookieUpdate(newCookies);
            }
        }
    }

    /**
     * 合并 Cookie
     */
    private mergeCookies(oldCookies: string, newCookies: string): string {
        const oldMap = new Map<string, string>();
        oldCookies.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            if (key && value) {
                oldMap.set(key, value);
            }
        });

        newCookies.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            if (key && value) {
                oldMap.set(key, value);
            }
        });

        return Array.from(oldMap.entries())
            .map(([key, value]) => `${key}=${value}`)
            .join("; ");
    }
}

/**
 * 从 Cookie 字符串中提取 UIN
 */
export function extractUINFromCookies(cookies: string): string | null {
    const match = cookies.match(/uin=([^;]+)/);
    return match ? match[1] : null;
}

/**
 * 验证 Cookie 是否有效
 */
export async function validateCookies(
    cookies: string
): Promise<{ valid: boolean; uin?: string; error?: string }> {
    try {
        const client = new WeiyunClient({ cookies });
        const userInfo = await client.diskUserInfoGet();
        const uin = userInfo.UIN || extractUINFromCookies(cookies);

        return { valid: true, uin: uin || undefined };
    } catch (error: any) {
        return {
            valid: false,
            error: error?.message || "验证失败",
        };
    }
}
