export {
  getGithubLoginUrl,
  getGithubAccessToken,
  getGithubRepositoryId,
  refreshGithubAccessToken,
  getUrlParam,
  createGithubClient,
} from "./github-client";

export {
  createGithubFS,
  validateGithubFS,
} from "./github-fs";
export type { GithubAuthInfo, GithubFS } from "./github-fs";

export type {
  IGiteeUser,
  GiteeClient,
} from "./gitee-client";
export {
  getGiteeLoginUrl,
  getGiteeAccessToken,
  refreshGiteeAccessToken,
  getGiteeUrlParam,
  createGiteeClient,
} from "./gitee-client";

export {
  createGiteeFS,
  validateFS as validateGiteeFS,
} from "./gitee-fs";
export type { GiteeFS } from "./gitee-fs";

export type {
  IGitcodeUser,
} from "./gitcode-client";
export {
  getGitcodeLoginUrl,
  getGitcodeAccessToken,
  refreshGitcodeAccessToken,
  createGitcodeClient,
} from "./gitcode-client";

export {
  createGitcodeFS,
  validateFS as validateGitcodeFS,
} from "./gitcode-fs";
export type { GitcodeFS } from "./gitcode-fs";

export * from "../types/compat";
