export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class DefaultStorage implements IStorage {
  constructor(private storage: Storage = typeof window !== "undefined" ? localStorage : ({} as Storage)) {}

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch {
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {
    }
  }
}

