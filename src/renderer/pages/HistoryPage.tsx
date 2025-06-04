import { useState, useEffect } from 'react';
import { useI18n } from '@renderer/hooks/useI18n';
import { useHistory } from '@renderer/hooks/useHistory';
import { useStore } from '@renderer/store';
import ConnectionDetails from '@renderer/components/ConnectionDetails';
import styles from './HistoryPage.module.css';

type RiskFilter = 'all' | 'safe' | 'risky';

export default function HistoryPage() {
    const { t } = useI18n();
    const { history, clearHistory, exportHistory } = useHistory();
    const riskFilter = useStore(state => state.historyFilter);
    const setRiskFilter = useStore(state => state.setHistoryFilter);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const filteredHistory = history.filter(entry => {
        if (riskFilter === 'all') return true;
        return riskFilter === 'risky' ? entry.isRisky : !entry.isRisky;
    });
    const pageCount = Math.ceil(filteredHistory.length / pageSize);
    const visibleHistory = filteredHistory.slice(page * pageSize, (page + 1) * pageSize);

    useEffect(() => {
        setPage(0);
    }, [riskFilter]);

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
                <button onClick={() => exportHistory('json')}>
                    {t('exportJSON')}
                </button>
                <button onClick={() => exportHistory('csv')}>
                    {t('exportCSV')}
                </button>
                <button
                    className={`${styles.clearButton} danger`}
                    onClick={handleClearHistory}
                >
                    {t('clearHistory')}
                </button>
                <select
                    className={styles.filterSelect}
                    value={riskFilter}
                    onChange={e => setRiskFilter(e.target.value as RiskFilter)}
                >
                    <option value="all">{t('filterAll')}</option>
                    <option value="safe">{t('filterSafe')}</option>
                    <option value="risky">{t('filterRisky')}</option>
                </select>
            </div>
            {pageCount > 1 && (
                <div className={styles.pagination}>
                    <button onClick={() => setPage(0)} disabled={page === 0}>
                        {'|<'}
                    </button>
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                        {'<'}
                    </button>
                    <span>
                        {t('page')} {page + 1} / {pageCount}
                    </span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= pageCount - 1}>
                        {'>'}
                    </button>
                    <button onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1}>
                        {'>|'}
                    </button>
                </div>
            )}
            {filteredHistory.length === 0 ? (
                <p className={styles.empty}>{t('noHistory')}</p>
            ) : (
                <ul className={styles.list}>
                    {visibleHistory.map(entry => {
                        const uniqueKey = `${entry.timestamp}-${entry.ip}`;
                        return (
                            <li key={uniqueKey} className={styles.entry}>
                                <div
                                    className={styles.summary}
                                    onClick={() =>
                                        handleToggleExpand(uniqueKey)
                                    }
                                >
                                    <span>
                                        {new Date(
                                            entry.timestamp
                                        ).toLocaleString()}
                                    </span>
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
                                            isSigned={entry.isSigned}
                                            isRisky={entry.isRisky}
                                            suspicionReason={
                                                entry.suspicionReason
                                            }
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
