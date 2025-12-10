export interface ElectronAPI {
  isElectron: boolean;
  platform: NodeJS.Platform;
  fs: {
    readDirectory: (path: string) => Promise<
      Array<{
        name: string;
        isDirectory: boolean;
        isFile: boolean;
      }>
    >;
    readFile: (path: string) => Promise<Uint8Array>;
    writeFile: (path: string, content: Uint8Array) => Promise<void>;
    stat: (path: string) => Promise<{
      isFile: boolean;
      isDirectory: boolean;
      size: number;
      ctime: number;
      mtime: number;
    }>;
    delete: (path: string) => Promise<void>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
    createDirectory: (path: string) => Promise<void>;
    selectDirectory: () => Promise<string | null>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}


