import { useCallback, useEffect } from 'react';
import { useConfig } from '@renderer/hooks/useConfig';

export const useTheme = () => {
  const { config, saveConfig } = useConfig();

  /**
   * Toggle between dark and light mode.
   */
  const toggleTheme = useCallback(async () => {
    try {
      const newDarkMode = !config.darkMode;
      await saveConfig({ ...config, darkMode: newDarkMode });
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  }, [config, saveConfig]);

  /**
   * Apply theme to the document.
   */
  const applyTheme = useCallback(() => {
    document.documentElement.classList.toggle('dark', config.darkMode);
  }, [config.darkMode]);

  // Apply theme on config change
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return {
    isDarkMode: config.darkMode,
    toggleTheme,
  };
};