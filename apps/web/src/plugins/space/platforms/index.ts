import { GitRepoFileSystemProvider } from "@/services/gite-repo-file-system.provider";
import { IndexedDBFileSystemProvider } from "@/services/indexed-db-file-system.provider";
import { WeiyunFileSystemProvider } from "@/services/weiyun-file-system.provider";
import { WeiyunClient } from "@/services/weiyun-client";
import { spacePlatformRegistry } from "@/services/space-platform.registry";
import { createGiteeClient, createGithubClient, createGitcodeClient } from "@dty/git-provider";
import { createPlugin } from "xbook/common/createPlugin";

export const platformsPlugin = createPlugin({
  initilize() {
    // 注册 Gitee
    spacePlatformRegistry.register({
      id: "gitee",
      name: "Gitee",
      hostname: "gitee.com",
      getProvider: ({ accessToken, owner, repo }) =>
        new GitRepoFileSystemProvider(
          createGiteeClient({ getAccessToken: () => accessToken }),
          owner,
          repo
        ),
    });

    // 注册 GitHub
    spacePlatformRegistry.register({
      id: "github",
      name: "GitHub",
      hostname: "github.com",
      getProvider: ({ accessToken, owner, repo }) =>
        new GitRepoFileSystemProvider(
          createGithubClient({ getAccessToken: () => accessToken }),
          owner,
          repo
        ),
    });

    // 注册 GitCode（gitcode.com）
    spacePlatformRegistry.register({
      id: "gitcode",
      name: "GitCode",
      hostname: "gitcode.com",
      getProvider: ({ accessToken, owner, repo }) =>
        new GitRepoFileSystemProvider(
          createGitcodeClient({ getAccessToken: () => accessToken }),
          owner,
          repo
        ),
    });

    // 注册 IndexedDB
    spacePlatformRegistry.register({
      id: "idb",
      name: "IndexDB",
      getProvider: () => new IndexedDBFileSystemProvider(),
    });

    // 注册 腾讯微云
    spacePlatformRegistry.register({
      id: "weiyun",
      name: "腾讯微云",
      hostname: "weiyun.com",
      getProvider: async ({ accessToken, owner, repo }) => {
        // accessToken 实际是 Cookie 字符串
        // owner 是 UIN
        // repo 是文件夹路径(如 "/我的笔记" 或 "/")

        if (!accessToken) {
          throw new Error("微云授权失败: 缺少 Cookie 信息");
        }

        // 创建微云客户端
        const client = new WeiyunClient({
          cookies: accessToken,
        });

        // 获取用户信息
        const userInfo = await client.diskUserInfoGet();

        // 确定根目录 DirKey
        let rootDirKey: string;
        if (repo === "/" || repo === "" || !repo) {
          // 使用主目录
          rootDirKey = userInfo.MainDirKey;
        } else if (/^[a-f0-9]{32}$/i.test(repo)) {
          // 如果 repo 是 32 位十六进制字符串（DirKey 格式），直接使用
          rootDirKey = repo;
        } else {
          // 通过路径查找目录(需要实现路径解析)
          // 临时实现:使用主目录
          rootDirKey = userInfo.MainDirKey;
        }

        // 创建 FileSystemProvider
        const provider = new WeiyunFileSystemProvider(
          client,
          rootDirKey,
          repo || "/"
        );

        return provider;
      },
    });
  }
});
