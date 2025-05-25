const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
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
  const defaultConfig = {
    friendlyCountries: ['France', 'United States'],
    riskyCountries: ['Iran', 'Bangladesh', 'Venezuela', 'Honduras', 'Algeria', 'Nigeria', 'India', 'Panama', 'Thailand', 'Belarus', 'Ukraine', 'Kenya', 'South Africa', 'Ghana'],
    bannedIPs: [],
    riskyProviders: ['Choopa', 'LeaseWeb', 'QuadraNet', 'Ecatel', 'Sharktech', 'HostSailor', 'M247', 'WorldStream'],
    intervalMin: 30,
    isDarkMode: false,
    language: 'en',
    periodicScan: true
  };
  try {
    const data = await fs.readFile('config.json', 'utf8');
    if (!data.trim()) {
      console.log('Empty config file, writing default');
      await fs.writeFile('config.json', JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    const parsed = JSON.parse(data);
    console.log('Loaded config:', parsed);
    return { ...defaultConfig, ...parsed };
  } catch (error) {
    console.error('Error loading config:', error);
    console.log('Writing default config');
    await fs.writeFile('config.json', JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    console.log('Saving config:', config);
    await fs.writeFile('config.json', JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
});