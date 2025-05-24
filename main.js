const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('run-netstat', async () => {
  console.log('Running netstat...');
  return new Promise((resolve, reject) => {
    exec('netstat -ano', (error, stdout) => {
      if (error) {
        console.error('Netstat error:', error);
        reject(error);
      } else {
        console.log('Netstat output:', stdout);
        resolve(stdout);
      }
    });
  });
});

ipcMain.handle('get-process-name', async () => {
  console.log('Running tasklist...');
  return new Promise((resolve, reject) => {
    exec('tasklist /FO CSV', (error, stdout) => {
      if (error) {
        console.error('Tasklist error:', error);
        reject(error);
      } else {
        const processes = {};
        const lines = stdout.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const [name, pid] = line.split('","').map(s => s.replace(/^"|"$/g, ''));
          if (pid && !isNaN(pid)) processes[pid] = name;
        }
        resolve(processes);
      }
    });
  });
});

ipcMain.handle('load-config', async () => {
  try {
    const data = await fs.readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    await fs.writeFile('config.json', JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
});