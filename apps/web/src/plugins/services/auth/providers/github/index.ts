import { authService } from "@/services/auth.service";
import { appInfo } from "@/plugins/services/auth/providers/github/appInfo";
import {
  createGitRepoAuthProvider,
  createOAuthCallbackTask,
} from "@/plugins/services/auth/providers/utils/create-git-repo-auth-provider";
import {
  createGithubClient,
  getGithubAccessToken,
  getGithubLoginUrl,
  refreshGithubAccessToken,
} from "libs/github-api";
import { createPlugin } from "xbook/common/createPlugin";

export default createPlugin({
  initilize(xbook) {
    const callbackTask = createOAuthCallbackTask({
      platform: "github",
      clientId: appInfo.clientId,
      clientSecret: appInfo.clientSecret || "",
      redirectUri: appInfo.redirectUri,
      createToken: async (params) => {
        return getGithubAccessToken({
          code: params.code,
          clientId: params.clientId,
          clientSecret: params.clientSecret || appInfo.clientSecret,
          redirectUri: params.redirectUri,
        });
      },
      fetchUserInfo: async ({ accessToken }) => {
        const client = createGithubClient({
          getAccessToken: () => accessToken,
        });
        const user = await client.User.getInfo();
        return {
          username: user.data?.name,
          response: user,
        };
      },
    });
    const authProvider = createGitRepoAuthProvider({
      id: "github",
      platform: "github",
      callbackTaskName: callbackTask.name,
      refreshAccessToken: async (params) => {
        return refreshGithubAccessToken({
          refreshToken: params.refreshToken,
        });
      },
      getLoginUrl: () => {
        return getGithubLoginUrl({
          clientId: appInfo.clientId,
          redirectUri: appInfo.redirectUri,
        });
      },
    });
    xbook.taskService.registerTaskType(callbackTask);
    authService.registerAuthProvider(authProvider);
  },
});
