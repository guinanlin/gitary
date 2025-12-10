import { contextBridge, ipcRenderer } from 'electron';

const platform = process.platform as NodeJS.Platform;

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: platform,
  fs: {
    readDirectory: (path: string) =>
      ipcRenderer.invoke('electron:fs:readDirectory', path),
    readFile: (path: string) => ipcRenderer.invoke('electron:fs:readFile', path),
    writeFile: (path: string, content: Uint8Array) =>
      ipcRenderer.invoke('electron:fs:writeFile', path, content),
    stat: (path: string) => ipcRenderer.invoke('electron:fs:stat', path),
    delete: (path: string) => ipcRenderer.invoke('electron:fs:delete', path),
    rename: (oldPath: string, newPath: string) =>
      ipcRenderer.invoke('electron:fs:rename', oldPath, newPath),
    createDirectory: (path: string) =>
      ipcRenderer.invoke('electron:fs:createDirectory', path),
    selectDirectory: () => ipcRenderer.invoke('electron:fs:selectDirectory'),
  },
});

