import { getBaseUrl, isProductionDomain } from '@/core/utils/domain-config';

const env = (import.meta as any).env || {};

const getRedirectUri = (): string => {
  const envRedirectUri = env.VITE_GITCODE_REDIRECT_URI;
  if (envRedirectUri) {
    let redirectUri = envRedirectUri.trim();
    if (isProductionDomain() && redirectUri.startsWith('http://')) {
      redirectUri = redirectUri.replace('http://', 'https://');
      console.warn('VITE_GITCODE_REDIRECT_URI uses http://, auto-converted to https:// for production');
    }
    return redirectUri;
  }
  const baseUrl = getBaseUrl();
  return `${baseUrl}/?platform=gitcode`;
};

const appInfo = {
  clientId: env.VITE_GITCODE_CLIENT_ID || "",
  clientSecret: env.VITE_GITCODE_CLIENT_SECRET || "",
  redirectUri: getRedirectUri(),
};

if (!appInfo.clientId) {
  console.warn('VITE_GITCODE_CLIENT_ID is not configured');
}

if (!appInfo.redirectUri) {
  console.warn('VITE_GITCODE_REDIRECT_URI is not configured');
}

if (!appInfo.clientSecret) {
  console.warn('VITE_GITCODE_CLIENT_SECRET is not configured');
}

if (import.meta.env?.MODE === 'development') {
  console.log('GitCode OAuth Config:', {
    clientId: appInfo.clientId ? `${appInfo.clientId.substring(0, 8)}...` : 'not set',
    redirectUri: appInfo.redirectUri,
    hasClientSecret: !!appInfo.clientSecret,
  });
}

export { appInfo };

