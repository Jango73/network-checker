import { useCallback, useEffect } from 'react';
import { useStore } from '@renderer/store';
import { useI18n } from './useI18n';
import { HistoryEntry } from '../../types/history';

export const useHistory = () => {
    const { history, setHistory, addMessage, config } = useStore();
    const { t } = useI18n();

    /**
     * Load scan history from the main process.
     */
    const loadHistory = useCallback(async () => {
        try {
            const response =
                await window.electron.ipcRenderer.invoke('load-history');
            if (response.success) {
                setHistory(response.data);
            } else {
                addMessage(
                    'error',
                    t('historyLoadFailed', { error: response.error })
                );
            }
        } catch (error) {
            addMessage(
                'error',
                t('historyLoadFailed', { error: (error as Error).message })
            );
        }
    }, [setHistory, addMessage, t]);

    /**
     * Save scan history to the main process.
     * @param results Array of scan results to save.
     */
    const saveHistory = useCallback(
        async (results: Omit<HistoryEntry, 'timestamp'>[]) => {
            const entries: HistoryEntry[] = results.map(result => ({
                ...result,
                timestamp: new Date().toISOString(),
            }));
            try {
                const response = await window.electron.ipcRenderer.invoke(
                    'save-history',
                    [...history, ...entries],
                    config.maxHistorySize
                );
                if (response.success) {
                    await loadHistory();
                } else {
                    addMessage(
                        'error',
                        t('historySaveFailed', { error: response.error })
                    );
                }
            } catch (error) {
                addMessage(
                    'error',
                    t('historySaveFailed', { error: (error as Error).message })
                );
            }
        },
        [history, config.maxHistorySize, loadHistory, addMessage, t]
    );

    /**
     * Clear scan history.
     */
    const clearHistory = useCallback(async () => {
        try {
            const response =
                await window.electron.ipcRenderer.invoke('clear-history');
            if (response.success) {
                setHistory([]);
                addMessage('success', t('historyCleared'));
            } else {
                addMessage(
                    'error',
                    t('historyClearFailed', { error: response.error })
                );
            }
        } catch (error) {
            addMessage(
                'error',
                t('historyClearFailed', { error: (error as Error).message })
            );
        }
    }, [setHistory, addMessage, t]);

    /**
     * Export scan history to JSON or CSV.
     * @param format Export format ('json' or 'csv').
     * @param outputPath Path to save the exported file.
     */
    const exportHistory = useCallback(
        async (format: 'json' | 'csv') => {
            const date = new Date().toISOString().split('T')[0];
            const defaultPath = `network-history-${date}.${format}`;
            try {
                const dialogResponse = await window.electron.ipcRenderer.invoke(
                    'show-save-dialog',
                    {
                        defaultPath,
                        filters: [
                            {
                                name: format.toUpperCase(),
                                extensions: [format],
                            },
                        ],
                    }
                );
                if (!dialogResponse.success) {
                    addMessage('warning', t('exportCancelled'));
                    return;
                }
                const outputPath = dialogResponse.data;
                const response = await window.electron.ipcRenderer.invoke(
                    'export-history',
                    format,
                    outputPath
                );
                if (response.success) {
                    addMessage('success', t('historyExported', { format }));
                } else {
                    addMessage(
                        'error',
                        t('historyExportFailed', { error: response.error })
                    );
                }
            } catch (error) {
                addMessage(
                    'error',
                    t('historyExportFailed', {
                        error: (error as Error).message,
                    })
                );
            }
        },
        [addMessage, t]
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
