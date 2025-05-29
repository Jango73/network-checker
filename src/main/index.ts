import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerIpcHandlers } from './ipc';

// Create main application window
function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  
  // Verify if preload file exists
  if (!fs.existsSync(preloadPath)) {
    throw new Error(`Preload script not found at ${preloadPath}`);
  }

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true
  });

  // Ensure IPC handlers are registered before loading the window
  registerIpcHandlers();

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    // Use absolute path for production
    win.loadFile(path.resolve(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});