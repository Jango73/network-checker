const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
  },
});