interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

interface Window {
  electron: {
    ipcRenderer: ElectronAPI;
  };
}