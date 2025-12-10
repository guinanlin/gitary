import { app, BrowserWindow } from 'electron';
import { createWindow } from './window.js';
import { createMenu } from './menu.js';
import { setupIpcHandlers } from './ipc-handlers.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && process.env.ELECTRON_FORCE_PRODUCTION !== 'true');

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  setupIpcHandlers();
  createMenu();
  mainWindow = createWindow(isDev);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(isDev);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


