const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('require', (module) => {
  if (module === 'electron') {
    return {
      shell: require('electron').shell,
      ipcRenderer: {
        invoke: ipcRenderer.invoke.bind(ipcRenderer),
      },
    };
  }
  return require(module);
});