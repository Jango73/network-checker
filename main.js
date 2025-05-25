const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
  console.log('App is ready, creating window...');
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
        if (lines.length === 0) {
          console.warn('Tasklist returned empty output');
          resolve(processes);
        }
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
    maxHistorySize: 10,
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

ipcMain.handle('load-history', async () => {
  try {
    const data = await fs.readFile('history.json', 'utf8');
    if (!data.trim()) {
      console.log('Empty history file');
      return [];
    }
    const parsed = JSON.parse(data);
    console.log('Loaded history:', parsed.length, 'scans');
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('History file does not exist, creating empty');
      await fs.writeFile('history.json', JSON.stringify([]));
      return [];
    }
    console.error('Error loading history:', error);
    return [];
  }
});

ipcMain.handle('save-history', async (event, scanData, maxHistorySize) => {
  try {
    let history = [];
    try {
      const data = await fs.readFile('history.json', 'utf8');
      if (data.trim()) {
        history = JSON.parse(data);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    history.unshift(scanData);

    let fileSize = Buffer.byteLength(JSON.stringify(history, null, 2), 'utf8') / (1024 * 1024);
    while (fileSize > maxHistorySize && history.length > 1) {
      history.pop();
      fileSize = Buffer.byteLength(JSON.stringify(history, null, 2), 'utf8') / (1024 * 1024);
    }

    await fs.writeFile('history.json', JSON.stringify(history, null, 2));
    console.log('Saved history:', history.length, 'scans, size:', fileSize.toFixed(2), 'MB');
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    return false;
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    await fs.writeFile('history.json', JSON.stringify([]));
    console.log('Cleared history');
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
});

ipcMain.handle('export-history', async (event, format = 'json') => {
  console.log('Registering export-history handler with format:', format);
  try {
    const historyData = await fs.readFile('history.json', 'utf8');
    let history = [];
    if (historyData.trim()) {
      history = JSON.parse(historyData);
    }

    const fileName = `network-history-${new Date().toISOString().split('T')[0]}`;
    const saveOptions = {
      title: 'Export History',
      defaultPath: path.join(app.getPath('downloads'), fileName),
      filters: [
        { name: format === 'csv' ? 'CSV Files' : 'JSON Files', extensions: [format] }
      ]
    };

    const { canceled, filePath } = await dialog.showSaveDialog(saveOptions);
    if (canceled || !filePath) {
      console.log('Export canceled by user');
      return { success: false, message: 'Export canceled' };
    }

    if (format === 'json') {
      await fs.writeFile(filePath, JSON.stringify(history, null, 2));
    } else if (format === 'csv') {
      const headers = ['scanDate,totalConnections,riskyConnections,ip,country,isp,org,pid,processName,isRisky'];
      const csvRows = history.flatMap(scan =>
        scan.connections.map(conn =>
          `${scan.timestamp},${scan.totalConnections},${scan.riskyConnections},${conn.ip},${conn.country},${conn.isp},${conn.org},${conn.pid},${conn.processName},${conn.isRisky}`
        )
      );
      const csvContent = [headers, ...csvRows].join('\n');
      await fs.writeFile(filePath, csvContent);
    } else {
      throw new Error('Unsupported format');
    }

    console.log(`History exported to ${filePath} as ${format}`);
    return { success: true, message: `History exported to ${filePath}` };
  } catch (error) {
    console.error('Error exporting history:', error);
    return { success: false, message: error.message };
  }
});