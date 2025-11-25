const env = (import.meta as any).env || {};

const appInfo = {
  clientId: env.VITE_GITHUB_CLIENT_ID || "",
  clientSecret: env.VITE_GITHUB_CLIENT_SECRET || "",
  redirectUri: env.VITE_GITHUB_REDIRECT_URI || "",
};

if (!appInfo.clientId) {
  console.warn('VITE_GITHUB_CLIENT_ID is not configured');
}

if (!appInfo.redirectUri) {
  console.warn('VITE_GITHUB_REDIRECT_URI is not configured');
}

if (!appInfo.clientSecret) {
  console.warn('VITE_GITHUB_CLIENT_SECRET is not configured');
}

export { appInfo };
