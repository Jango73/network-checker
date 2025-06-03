import { contextBridge, ipcRenderer } from 'electron';

// Liste des canaux IPC autorisés
const validChannels = [
    'run-netstat',
    'get-process-name',
    'get-process-path',
    'get-process-signature',
    'load-config',
    'save-config',
    'reset-config',
    'load-history',
    'save-history',
    'clear-history',
    'export-history',
    'show-save-dialog',
    'get-ruleset',
] as const;

type ValidChannel = (typeof validChannels)[number];

// Interface pour l'API exposée au renderer
interface ElectronAPI {
    invoke: (channel: ValidChannel, ...args: any[]) => Promise<any>;
}

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel: string, ...args: any[]): Promise<any> => {
            if (validChannels.includes(channel as ValidChannel)) {
                return ipcRenderer.invoke(channel, ...args);
            }
            throw new Error(`Canal IPC non autorisé : ${channel}`);
        },
    } as ElectronAPI,
});
