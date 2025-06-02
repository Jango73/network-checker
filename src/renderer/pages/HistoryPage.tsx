import { useState } from 'react';
import { useI18n } from '@renderer/hooks/useI18n';
import { useHistory } from '@renderer/hooks/useHistory';
import ConnectionDetails from '@renderer/components/ConnectionDetails';
import styles from './HistoryPage.module.css';

export default function HistoryPage() {
  const { t } = useI18n();
  const { history, clearHistory, exportHistory } = useHistory();
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  /**
   * Toggle expansion of a history entry.
   * @param uniqueKey Unique key of the entry to toggle (timestamp + ip).
   */
  const handleToggleExpand = (uniqueKey: string) => {
    setExpandedEntry(expandedEntry === uniqueKey ? null : uniqueKey);
  };

  /**
   * Handle clear history with confirmation.
   */
  const handleClearHistory = async () => {
    if (window.confirm(t('confirmClearHistory'))) {
      await clearHistory();
    }
  };

  return (
    <div className={styles.container}>
      <h1>{t('history')}</h1>
      <div className={styles.controls}>
        <button onClick={() => exportHistory('json')}>{t('exportJSON')}</button>
        <button onClick={() => exportHistory('csv')}>{t('exportCSV')}</button>
        <button
          className={`${styles.clearButton} danger`}
          onClick={handleClearHistory}
        >
          {t('clearHistory')}
        </button>
      </div>
      {history.length === 0 ? (
        <p className={styles.empty}>{t('noHistory')}</p>
      ) : (
        <ul className={styles.list}>
          {history.map(entry => {
            const uniqueKey = `${entry.timestamp}-${entry.ip}`;
            return (
              <li key={uniqueKey} className={styles.entry}>
                <div
                  className={styles.summary}
                  onClick={() => handleToggleExpand(uniqueKey)}
                >
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  <span>{entry.ip}</span>
                  <span>
                    {entry.isRisky
                      ? `${t('risky')} (${entry.suspicionReason})`
                      : t('safe')}
                  </span>
                </div>
                {expandedEntry === uniqueKey && (
                  <div className={styles.details}>
                    <ConnectionDetails
                      ip={entry.ip}
                      country={entry.country}
                      city={entry.city}
                      provider={entry.provider}
                      organization={entry.organization}
                      lat={entry.lat}
                      lon={entry.lon}
                      pid={entry.pid}
                      process={entry.process}
                      processPath={entry.processPath}
                      isRisky={entry.isRisky}
                      suspicionReason={entry.suspicionReason}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}