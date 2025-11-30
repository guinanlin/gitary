import type { IStorage } from "@dty/ai-assistant-core";

export class GitaryStorageAdapter implements IStorage {
  constructor(private storage: Storage = localStorage) {}

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`[GitaryStorageAdapter] Failed to getItem ${key}:`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn(`[GitaryStorageAdapter] Failed to setItem ${key}:`, error);
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn(`[GitaryStorageAdapter] Failed to removeItem ${key}:`, error);
    }
  }
}

