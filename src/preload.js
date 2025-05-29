const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      const validChannels = [
        'run-netstat',
        'get-process-name',
        'get-process-path',
        'get-process-signature',
        'load-config',
        'save-config',
        'load-history',
        'save-history',
        'clear-history',
        'export-history'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Unknown IPC channel: ${channel}`);
    },
  },
});