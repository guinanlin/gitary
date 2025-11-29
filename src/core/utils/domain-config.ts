export function getCurrentDomain(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  return window.location.hostname;
}

export function isProductionDomain(): boolean {
  const domain = getCurrentDomain();
  return domain !== 'localhost' && 
         domain !== '127.0.0.1' && 
         !domain.startsWith('192.168.') &&
         !domain.startsWith('10.') &&
         !domain.startsWith('172.');
}

export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  return `${protocol}//${hostname}${port}`;
}
