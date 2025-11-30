export interface II18nProvider {
  t(key: string, params?: Record<string, any>): string;
}

