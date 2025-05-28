const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('src/index.html');
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
  return new Promise((resolve, reject) => {
    exec('netstat -ano', (error, stdout) => {
      if (error) {
        console.error('Netstat error:', error);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
});

ipcMain.handle('get-process-name', async () => {
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

ipcMain.handle('get-process-path', async (event, pid) => {
  return new Promise((resolve, reject) => {
    exec(`wmic process where ProcessId=${pid} get ExecutablePath`, (error, stdout) => {
      if (error) {
        console.error(`WMIC error for PID ${pid}:`, error);
      }
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      if (lines.length >= 2 && lines[1].trim()) {
        const executablePath = lines[1].trim();
        resolve(executablePath);
        return;
      }
      console.warn(`WMIC returned no path for PID ${pid}, trying PowerShell...`);
      
      exec(`powershell -Command "Get-Process -Id ${pid} | Select-Object -ExpandProperty Path"`, (psError, psStdout) => {
        if (psError) {
          console.error(`PowerShell error for PID ${pid}:`, psError);
          reject(psError);
          return;
        }
        const psPath = psStdout.trim();
        if (psPath) {
          resolve(psPath);
        } else {
          console.warn(`No path found for PID ${pid}`);
          resolve(null);
        }
      });
    });
  });
});

ipcMain.handle('get-process-signature', async (event, pid) => {
  return new Promise((resolve, reject) => {
    exec(`powershell -Command "Get-Process -Id ${pid} | Get-AuthenticodeSignature | Select-Object -ExpandProperty Status"`, (error, stdout) => {
      if (error) {
        console.error(`Signature check error for PID ${pid}:`, error);
        resolve('Unknown');
      } else {
        resolve(stdout.trim());
      }
    });
  });
});

ipcMain.handle('load-config', async () => {
  const defaultConfig = {
    friendlyCountries: ['France', 'United States'],
    riskyCountries: ['Iran', 'Bangladesh', 'Venezuela', 'Honduras', 'Algeria', 'Nigeria', 'India', 'Panama', 'Thailand', 'Belarus', 'Ukraine', 'Kenya', 'South Africa', 'Ghana'],
    bannedIPs: [],
    trustedIPs: [],
    riskyProviders: ['Choopa', 'LeaseWeb', 'QuadraNet', 'Ecatel', 'Sharktech', 'HostSailor', 'M247', 'WorldStream'],
    trustedProcesses: [],
    intervalMin: 30,
    maxHistorySize: 10,
    isDarkMode: false,
    language: 'en',
    periodicScan: true
  };
  try {
    const data = await fs.readFile('config.json', 'utf8');
    if (!data.trim()) {
      await fs.writeFile('config.json', JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    const parsed = JSON.parse(data);
    return { ...defaultConfig, ...parsed };
  } catch (error) {
    console.error('Error loading config:', error);
    await fs.writeFile('config.json', JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
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
      return [];
    }
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
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
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    return false;
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    await fs.writeFile('history.json', JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
});

ipcMain.handle('export-history', async (event, format = 'json') => {
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

    return { success: true, message: `History exported to ${filePath}` };
  } catch (error) {
    console.error('Error exporting history:', error);
    return { success: false, message: error.message };
  }
});