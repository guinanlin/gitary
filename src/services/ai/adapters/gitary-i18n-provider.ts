import i18n from "@/i18n/config";
import type { II18nProvider } from "@dty/ai-assistant-core";

export class GitaryI18nProvider implements II18nProvider {
  t(key: string, params?: Record<string, any>): string {
    return i18n.t(key, params);
  }
}

