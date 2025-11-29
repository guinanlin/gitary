/**
 * 腾讯微云 API 类型定义
 * 基于 AList 微云驱动实现
 */

// ==================== 用户信息 ====================

export interface WeiyunUserInfo {
    /** 用户主目录 DirKey */
    MainDirKey: string;
    /** 用户 UIN */
    UIN: string;
    /** 登录类型: 1=QQ登录, 2=微信登录 */
    LoginType: number;
    /** 用户昵称 */
    NickName?: string;
    /** 总容量 */
    TotalSize?: number;
    /** 已用容量 */
    UsedSize?: number;
}

// ==================== 目录和文件 ====================

export interface WeiyunDir {
    /** 目录唯一标识符 */
    DirKey: string;
    /** 父目录 DirKey */
    PdirKey: string;
    /** 父目录的父目录 DirKey */
    PPdirKey: string;
    /** 目录名称 */
    DirName: string;
    /** 创建时间 */
    DirCtime: number;
    /** 修改时间 */
    DirMtime: number;
}

export interface WeiyunFile {
    /** 文件唯一标识符 */
    FileID: string;
    /** 文件名称 */
    FileName: string;
    /** 文件大小 */
    FileSize: number;
    /** 创建时间 */
    FileCtime: number;
    /** 修改时间 */
    FileMtime: number;
    /** 文件 MD5 */
    FileMD5?: string;
    /** 文件 SHA */
    FileSHA?: string;
}

export interface WeiyunFileList {
    /** 目录列表 */
    DirList: WeiyunDir[];
    /** 文件列表 */
    FileList: WeiyunFile[];
    /** 总目录数 */
    TotalDirCount: number;
    /** 总文件数 */
    TotalFileCount: number;
    /** 是否加载完成 */
    FinishFlag: boolean;
}

// ==================== 请求参数 ====================

export interface FolderParam {
    /** 父目录的父目录 DirKey */
    PPdirKey: string;
    /** 父目录 DirKey */
    PdirKey: string;
    /** 目录 DirKey (创建时可选) */
    DirKey?: string;
    /** 目录名称 */
    DirName: string;
}

export interface FileParam {
    /** 父目录的父目录 DirKey */
    PPdirKey: string;
    /** 父目录 DirKey */
    PdirKey: string;
    /** 文件 ID */
    FileID: string;
    /** 文件名称 */
    FileName: string;
}

export interface ListOptions {
    /** 分页偏移 */
    offset?: number;
    /** 每页数量 */
    count?: number;
    /** 排序字段 */
    sortBy?: string;
    /** 排序方向 */
    order?: "asc" | "desc";
}

export interface FileUploadParam {
    /** 父目录 DirKey */
    pdirKey: string;
    /** 文件名 */
    fileName: string;
    /** 文件内容 */
    file: File | Blob;
    /** 文件大小 */
    fileSize?: number;
    /** 文件 MD5 */
    fileMD5?: string;
}

// ==================== 下载信息 ====================

export interface DownloadInfo {
    /** 下载链接 */
    DownloadUrl: string;
    /** Cookie 名称 */
    CookieName: string;
    /** Cookie 值 */
    CookieValue: string;
    /** 链接过期时间(秒) */
    ExpiresIn?: number;
}

// ==================== 错误定义 ====================

export const WEIYUN_ERROR_CODES = {
    /** Cookie 过期 */
    COOKIE_EXPIRED: -110,
    /** 文件不存在 */
    FILE_NOT_FOUND: -404,
    /** 权限不足 */
    PERMISSION_DENIED: -403,
    /** 请求频率过高 */
    RATE_LIMIT: -429,
    /** 参数错误 */
    INVALID_PARAM: -400,
    /** 网络错误(自定义) */
    NETWORK_ERROR: -1000,
} as const;

export class WeiyunError extends Error {
    constructor(
        public code: number,
        message: string,
        public originalError?: any
    ) {
        super(message);
        this.name = "WeiyunError";
    }

    static fromResponse(response: any): WeiyunError {
        if (response?.code === WEIYUN_ERROR_CODES.COOKIE_EXPIRED) {
            return new WeiyunError(
                WEIYUN_ERROR_CODES.COOKIE_EXPIRED,
                "Cookie 已过期,请重新授权",
                response
            );
        }

        if (response?.code === WEIYUN_ERROR_CODES.FILE_NOT_FOUND) {
            return new WeiyunError(
                WEIYUN_ERROR_CODES.FILE_NOT_FOUND,
                "文件不存在",
                response
            );
        }

        return new WeiyunError(
            response?.code || -1,
            response?.message || "未知错误",
            response
        );
    }

    get isCookieExpired(): boolean {
        return this.code === WEIYUN_ERROR_CODES.COOKIE_EXPIRED;
    }

    get isNotFound(): boolean {
        return this.code === WEIYUN_ERROR_CODES.FILE_NOT_FOUND;
    }
}

// ==================== API 响应 ====================

export interface ApiResponse<T> {
    code?: number;
    message?: string;
    data?: T;
}
