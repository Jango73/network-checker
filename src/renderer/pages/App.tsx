import { useState } from 'react';
import MainPage from '@renderer/pages/MainPage';
import MapPage from '@renderer/pages/MapPage';
import HistoryPage from '@renderer/pages/HistoryPage';
import SettingsPage from '@renderer/pages/SettingsPage';
import AboutPage from '@renderer/pages/AboutPage';
import { useI18n } from '@renderer/hooks/useI18n';
import styles from './App.module.css';

export default function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('main');

  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return <MainPage />;
      case 'map':
        return <MapPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <MainPage />;
    }
  };

  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <button
          className={activeTab === 'main' ? 'active' : ''}
          onClick={() => setActiveTab('main')}
        >
          {t('main')}
        </button>
        <button
          className={activeTab === 'map' ? 'active' : ''}
          onClick={() => setActiveTab('map')}
        >
          {t('map')}
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          {t('history')}
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          {t('settings')}
        </button>
        <button
          className={activeTab === 'about' ? 'active' : ''}
          onClick={() => setActiveTab('about')}
        >
          {t('about')}
        </button>
      </nav>
      <main className={styles.content}>{renderContent()}</main>
    </div>
  );
}