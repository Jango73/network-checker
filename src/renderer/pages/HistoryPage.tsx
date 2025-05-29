import { useState } from 'react';
import { useI18n } from '@renderer/hooks/useI18n';
import { useHistory } from '@renderer/hooks/useHistory';
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
   * Export history to JSON or CSV.
   * @param format Export format ('json' or 'csv').
   */
  const handleExport = async (format: 'json' | 'csv') => {
    const date = new Date().toISOString().split('T')[0];
    const outputPath = `network-history-${date}.${format}`; // Should use file dialog in production
    await exportHistory(format, outputPath);
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
        <button onClick={() => handleExport('json')}>{t('exportJSON')}</button>
        <button onClick={() => handleExport('csv')}>{t('exportCSV')}</button>
        <button className={styles.clearButton} onClick={handleClearHistory}>
          {t('clearHistory')}
        </button>
      </div>
      {history.length === 0 ? (
        <p className={styles.empty}>{t('noHistory')}</p>
      ) : (
        <ul className={styles.list}>
          {history.map((entry) => {
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
                      ? t('risky')
                      : entry.isSuspicious
                      ? `${t('suspicious')} (${entry.suspicionReason})`
                      : t('safe')}
                  </span>
                </div>
                {expandedEntry === uniqueKey && (
                  <div className={styles.details}>
                    <p>
                      <strong>{t('ip')}:</strong> {entry.ip}
                    </p>
                    <p>
                      <strong>{t('country')}:</strong> {entry.country || '-'}
                    </p>
                    <p>
                      <strong>{t('city')}:</strong> {entry.city || '-'}
                    </p>
                    <p>
                      <strong>{t('provider')}:</strong> {entry.provider || '-'}
                    </p>
                    <p>
                      <strong>{t('organization')}:</strong> {entry.organization || '-'}
                    </p>
                    <p>
                      <strong>{t('coordinates')}:</strong> Lat: {entry.lat || '-'}, Lon:{' '}
                      {entry.lon || '-'}
                    </p>
                    <p>
                      <strong>{t('pid')}:</strong> {entry.pid}
                    </p>
                    <p>
                      <strong>{t('process')}:</strong> {entry.process || '-'}
                    </p>
                    <p>
                      <strong>{t('processPath')}:</strong> {entry.processPath || '-'}
                    </p>
                    {(entry.isRisky || entry.isSuspicious) && (
                      <p>
                        <strong>{t('reason')}:</strong> {entry.suspicionReason || '-'}
                      </p>
                    )}
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