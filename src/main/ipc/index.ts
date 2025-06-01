import { ipcMain, dialog } from 'electron';
import { NetstatService } from '../services/NetstatService';
import { ProcessService } from '../services/ProcessService';
import { ConfigService } from '../services/ConfigService';
import { HistoryService } from '../services/HistoryService';

interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function registerIpcHandlers(): void {
  const netstatService = new NetstatService();
  const processService = new ProcessService();
  const configService = new ConfigService();
  const historyService = new HistoryService();

  // Run netstat scan
  ipcMain.handle('run-netstat', async () => {
    try {
      const connections = await netstatService.getConnections();
      return { success: true, data: connections } as IpcResponse<any>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<any>;
    }
  });

  // Get process name
  ipcMain.handle('get-process-name', async (_event, pid: number) => {
    try {
      const name = await processService.getProcessName(pid);
      return { success: true, data: name } as IpcResponse<string>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<string>;
    }
  });

  // Get process path
  ipcMain.handle('get-process-path', async (_event, pid: number) => {
    try {
      const path = await processService.getProcessPath(pid);
      return { success: true, data: path } as IpcResponse<string>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<string>;
    }
  });

  // Get process signature
  ipcMain.handle('get-process-signature', async (_event, pid: number) => {
    try {
      const isSigned = await processService.isProcessSigned(pid);
      return { success: true, data: isSigned } as IpcResponse<boolean>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<boolean>;
    }
  });

  // Load configuration
  ipcMain.handle('load-config', async () => {
    try {
      const config = await configService.loadConfig();
      return { success: true, data: config } as IpcResponse<any>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<any>;
    }
  });

  // Save configuration
  ipcMain.handle('save-config', async (_event, config: any) => {
    try {
      await configService.saveConfig(config);
      return { success: true } as IpcResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<void>;
    }
  });

  // Reset configuration
  ipcMain.handle('reset-config', async () => {
    try {
      const config = await configService.resetConfig();
      return { success: true, data: config } as IpcResponse<any>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<any>;
    }
  });

  // Load history
  ipcMain.handle('load-history', async () => {
    try {
      const history = await historyService.loadHistory();
      return { success: true, data: history } as IpcResponse<any>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<any>;
    }
  });

  // Save history
  ipcMain.handle(
    'save-history',
    async (_event, entries: any[], maxSize: number) => {
      try {
        await historyService.saveHistory(entries, maxSize);
        return { success: true } as IpcResponse<void>;
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        } as IpcResponse<void>;
      }
    }
  );

  // Clear history
  ipcMain.handle('clear-history', async () => {
    try {
      await historyService.clearHistory();
      return { success: true } as IpcResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      } as IpcResponse<void>;
    }
  });

  // Export history
  ipcMain.handle(
    'export-history',
    async (_event, format: 'json' | 'csv', outputPath: string) => {
      try {
        await historyService.exportHistory(format, outputPath);
        return { success: true } as IpcResponse<void>;
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        } as IpcResponse<void>;
      }
    }
  );

  // Show save dialog
  ipcMain.handle(
    'show-save-dialog',
    async (_event, options: { defaultPath: string; filters: { name: string; extensions: string[] }[] }) => {
      try {
        const result = await dialog.showSaveDialog({
          defaultPath: options.defaultPath,
          filters: options.filters,
        });
        if (result.canceled || !result.filePath) {
          return { success: false, error: 'Exportation annulée' } as IpcResponse<string>;
        }
        return { success: true, data: result.filePath } as IpcResponse<string>;
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        } as IpcResponse<string>;
      }
    }
  );
}