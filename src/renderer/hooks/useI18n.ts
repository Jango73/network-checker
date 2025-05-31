import { useCallback } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@renderer/hooks/useConfig';

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  const { config, saveConfig } = useConfig();

  /**
   * Change the application language.
   * @param language Language code (e.g., 'en', 'fr').
   */
  const changeLanguage = useCallback(
    async (language: string) => {
      try {
        await i18n.changeLanguage(language);
        await saveConfig({ ...config, language });
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    },
    [i18n, config, saveConfig]
  );

  // Apply language from config on mount
  useEffect(() => {
    if (config.language && i18n.language !== config.language) {
      i18n.changeLanguage(config.language).catch(error => {
        console.error('Failed to apply config language:', error);
      });
    }
  }, [config.language, i18n]);

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage,
  };
};
