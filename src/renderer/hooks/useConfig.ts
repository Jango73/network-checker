import { useCallback, useEffect } from 'react';
import { useStore } from '@renderer/store';
import { Config } from '../../types/config';

export const useConfig = () => {
  const { config, setConfig } = useStore();

  /**
   * Load configuration from the main process.
   */
  const loadConfig = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('load-config');
      if (response.success) {
        setConfig(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      throw new Error(`Failed to load config: ${(error as Error).message}`);
    }
  };

  /**
   * Save configuration to the main process.
   * @param newConfig The new configuration to save.
   */
  const saveConfig = useCallback(
    async (newConfig: Config) => {
      try {
        const response = await window.electron.ipcRenderer.invoke(
          'save-config',
          newConfig
        );
        if (response.success) {
          setConfig(newConfig);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        throw new Error(
          `Failed to save configuration: ${(error as Error).message}`
        );
      }
    },
    [setConfig]
  );

  /**
   * Reset configuration to default.
   */
  const resetConfig = useCallback(async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('reset-config');
      if (response.success) {
        setConfig(response.data);
      } else {
        throw new Error(response.error || 'Reset failed');
      }
    } catch (error) {
      throw new Error(
        `Failed to reset configuration: ${(error as Error).message}`
      );
    }
  }, [setConfig]);

  // Load configuration when the hook is first used
  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    saveConfig,
    resetConfig,
    loadConfig,
  };
};