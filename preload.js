const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      const validChannels = [
        'run-netstat',
        'get-process-name',
        'load-config',
        'save-config',
        'load-history',
        'save-history',
        'clear-history',
        'export-history'
      ];
      console.log(`Renderer attempting to invoke channel: ${channel}`);
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Unknown IPC channel: ${channel}`);
    },
  },
});