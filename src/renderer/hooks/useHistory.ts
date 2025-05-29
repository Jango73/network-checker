import { useCallback, useEffect } from 'react';
import { useStore } from '@renderer/store';
import { HistoryEntry } from '../../types/history';

export const useHistory = () => {
  const { history, setHistory, addMessage, config, scanResults } = useStore();

  /**
   * Load scan history from the main process.
   */
  const loadHistory = useCallback(async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('load-history');
      if (response.success) {
        setHistory(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      addMessage('error', `Failed to load history: ${(error as Error).message}`);
    }
  }, [setHistory, addMessage]);

  /**
   * Save scan history to the main process.
   * @param results Array of scan results to save.
   */
  const saveHistory = useCallback(
    async (results: any[]) => {
      try {
        const entries: HistoryEntry[] = results.map((result) => ({
          timestamp: new Date().toISOString(),
          ip: result.ip,
          country: result.country || '',
          provider: result.provider || '',
          organization: result.organization || '',
          city: result.city || '',
          lat: result.lat || 0,
          lon: result.lon || 0,
          pid: result.pid || 0,
          process: result.process || '',
          processPath: result.processPath || '',
          isRisky: !!result.isRisky,
          isSuspicious: !!result.isSuspicious,
          suspicionReason: result.suspicionReason || '',
        }));

        const updatedHistory = [...history, ...entries];
        const response = await window.electron.ipcRenderer.invoke(
          'save-history',
          updatedHistory,
          config.maxHistorySize,
        );
        if (response.success) {
          setHistory(updatedHistory);
          addMessage('success', 'History saved successfully');
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        addMessage('error', `Failed to save history: ${(error as Error).message}`);
      }
    },
    [history, setHistory, addMessage, config.maxHistorySize],
  );

  /**
   * Clear scan history.
   */
  const clearHistory = useCallback(async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('clear-history');
      if (response.success) {
        setHistory([]);
        addMessage('success', 'History cleared successfully');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      addMessage('error', `Failed to clear history: ${(error as Error).message}`);
    }
  }, [setHistory, addMessage]);

  /**
   * Export scan history to JSON or CSV.
   * @param format Export format ('json' or 'csv').
   * @param outputPath Path to save the exported file.
   */
  const exportHistory = useCallback(
    async (format: 'json' | 'csv', outputPath: string) => {
      try {
        const response = await window.electron.ipcRenderer.invoke('export-history', format, outputPath);
        if (response.success) {
          addMessage('success', `History exported successfully to ${outputPath}`);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        addMessage('error', `Failed to export history: ${(error as Error).message}`);
      }
    },
    [addMessage],
  );

  // Load history when the hook is first used
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loadHistory,
    saveHistory,
    clearHistory,
    exportHistory,
  };
};