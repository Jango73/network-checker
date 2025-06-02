import { useI18n } from '@renderer/hooks/useI18n';
import { useStore } from '@renderer/store';
import { useConfig } from '@renderer/hooks/useConfig';
import { useState, useEffect } from 'react';
import { usePeriodicScan } from '@renderer/hooks/usePeriodicScan';
import MainPage from '@renderer/pages/MainPage';
import MapPage from '@renderer/pages/MapPage';
import HistoryPage from '@renderer/pages/HistoryPage';
import SettingsPage from '@renderer/pages/SettingsPage';
import AboutPage from '@renderer/pages/AboutPage';
import styles from './App.module.css';

export default function App() {
  const { t } = useI18n();
  const { messages, removeMessage } = useStore();
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState('main');
  const { timeUntilNextScan } = usePeriodicScan();

  // Format time to mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      {/* Messages and timer bar */}
      <div className={styles.header}>
        <div className={styles.messages}>
          {messages.length > 0 ? (
            <div
              className={`${styles.message} ${styles[messages[0].type]}`}
              style={{
                backgroundColor:
                  messages[0].type === 'error'
                    ? 'var(--error)'
                    : messages[0].type === 'success'
                      ? 'var(--success)'
                      : messages[0].type === 'warning'
                        ? 'var(--warning)'
                        : 'var(--primary)',
                color: '#fff',
                padding: '8px',
                margin: '8px 0',
                borderRadius: '4px',
              }}
              onClick={() => removeMessage(messages[0].id)}
            >
              {messages[0].text}
            </div>
          ) : (
            <div
              className={`${styles.message}`}
              style={{
                padding: '8px',
                margin: '8px 0',
                borderRadius: '4px',
              }}
              onClick={() => removeMessage(messages[0].id)}
            >
              &nbsp;
            </div>
          )}
        </div>
        {config.periodicScan && (
          <div className={styles.timer}>
            <span>{t('nextScan')}</span>
            <span>{formatTime(timeUntilNextScan / 1000)}</span>
          </div>
        )}
      </div>
      <div className={styles.tabContainer}>
        <nav className={styles.nav}>
          <div
            className={`${styles.navLink} ${activeTab === 'main' ? styles.active : ''}`}
            onClick={() => setActiveTab('main')}
          >
            {t('main')}
          </div>
          <div
            className={`${styles.navLink} ${activeTab === 'map' ? styles.active : ''}`}
            onClick={() => setActiveTab('map')}
          >
            {t('map')}
          </div>
          <div
            className={`${styles.navLink} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t('history')}
          </div>
          <div
            className={`${styles.navLink} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t('settings')}
          </div>
        </nav>
        <main className={styles.main}>
          {activeTab === 'main' && <MainPage />}
          {activeTab === 'map' && <MapPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'about' && <AboutPage />}
        </main>
      </div>
    </div>
  );
}