import React from 'react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n } from '@renderer/i18n';
import { useConfig } from '@renderer/hooks/useConfig';
import App from '@renderer/pages/App';
import './styles/global.css';

// Apply theme based on config
const applyTheme = (darkMode: boolean) => {
  document.documentElement.classList.toggle('dark', darkMode);
};

// Initialize i18next and apply initial theme
initI18n().then(() => {
  const root = createRoot(document.getElementById('root')!);

  // Temporary component to load config and apply theme
  const InitApp = () => {
    const { config } = useConfig();

    useEffect(() => {
      applyTheme(config.darkMode);
    }, [config.darkMode]);

    return <App />;
  };

  root.render(<InitApp />);
});