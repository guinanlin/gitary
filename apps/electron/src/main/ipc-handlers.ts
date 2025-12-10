import { ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

function validatePath(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return !normalized.includes('..') && path.isAbsolute(normalized);
}

export function setupIpcHandlers() {
  ipcMain.handle('electron:fs:readDirectory', async (_, dirPath: string) => {
    if (!validatePath(dirPath)) {
      throw new Error('Invalid path');
    }
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      }));
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  });

  ipcMain.handle('electron:fs:readFile', async (_, filePath: string) => {
    if (!validatePath(filePath)) {
      throw new Error('Invalid path');
    }
    try {
      const buffer = await fs.readFile(filePath);
      return Array.from(new Uint8Array(buffer));
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  });

  ipcMain.handle(
    'electron:fs:writeFile',
    async (_, filePath: string, content: Uint8Array) => {
      if (!validatePath(filePath)) {
        throw new Error('Invalid path');
      }
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, Buffer.from(content));
      } catch (error) {
        throw new Error(`Failed to write file: ${error}`);
      }
    }
  );

  ipcMain.handle('electron:fs:stat', async (_, filePath: string) => {
    if (!validatePath(filePath)) {
      throw new Error('Invalid path');
    }
    try {
      const stat = await fs.stat(filePath);
      return {
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        ctime: stat.ctime.getTime(),
        mtime: stat.mtime.getTime(),
      };
    } catch (error) {
      throw new Error(`Failed to stat file: ${error}`);
    }
  });

  ipcMain.handle('electron:fs:delete', async (_, filePath: string) => {
    if (!validatePath(filePath)) {
      throw new Error('Invalid path');
    }
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete: ${error}`);
    }
  });

  ipcMain.handle(
    'electron:fs:rename',
    async (_, oldPath: string, newPath: string) => {
      if (!validatePath(oldPath) || !validatePath(newPath)) {
        throw new Error('Invalid path');
      }
      try {
        await fs.rename(oldPath, newPath);
      } catch (error) {
        throw new Error(`Failed to rename: ${error}`);
      }
    }
  );

  ipcMain.handle('electron:fs:createDirectory', async (_, dirPath: string) => {
    if (!validatePath(dirPath)) {
      throw new Error('Invalid path');
    }
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`);
    }
  });

  ipcMain.handle('electron:fs:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths[0];
  });
}


