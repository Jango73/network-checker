import { useEffect, useState } from 'react';
import { useI18n } from '@renderer/hooks/useI18n';
import { useStore } from '@renderer/store';
import { useConfig } from '@renderer/hooks/useConfig';
import { ScanResult } from '../../types/network';
import ConnectionDetails from './ConnectionDetails';
import styles from './ConnectionTable.module.css';

export default function ConnectionTable() {
    const { t } = useI18n();
    const { scanResults, addMessage, isScanning } = useStore();
    const { config, saveConfig } = useConfig();
    const [results, setResults] = useState<ScanResult[]>([]);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Update results when scanResults or config change
    useEffect(() => {
        setResults(scanResults);
    }, [scanResults, config]);

    // Toggle expansion of a row
    const handleToggleExpand = (uniqueKey: string) => {
        setExpandedRow(expandedRow === uniqueKey ? null : uniqueKey);
    };

    const handleMarkIPAsSafe = (ip: string) => {
        if (!config.trustedIPs.includes(ip)) {
            const newTrustedIPs = [...config.trustedIPs, ip];
            saveConfig({ ...config, trustedIPs: newTrustedIPs });
            addMessage('success', t('ipMarkedSafe', { ip }));
        }
    };

    const handleMarkProcessAsSafe = (
        processPath: string,
        processName: string
    ) => {
        if (processName && !config.trustedProcesses.includes(processPath)) {
            const newTrustedProcesses = [
                ...config.trustedProcesses,
                processName,
            ];
            saveConfig({ ...config, trustedProcesses: newTrustedProcesses });
            addMessage('success', t('processMarkedSafe', { processName }));
        } else if (!processName) {
            addMessage('error', t('cannotMarkEmptyProcess'));
        }
    };

    const handleMarkCountryAsSafe = (country: string) => {
        if (country && config.riskyCountries.includes(country)) {
            const newRiskyCountries = config.riskyCountries.filter(
                c => c !== country
            );
            saveConfig({ ...config, riskyCountries: newRiskyCountries });
            addMessage('success', t('countryMarkedSafe', { country }));
        }
    };

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>{t('ip')}</th>
                        <th>{t('country')}</th>
                        <th>{t('city')}</th>
                        <th>{t('provider')}</th>
                        <th>{t('pid')}</th>
                        <th>{t('process')}</th>
                        <th>{t('status')}</th>
                        <th>{t('whois')}</th>
                        <th>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length === 0 && !isScanning ? (
                        <tr>
                            <td colSpan={10} className={styles.empty}>
                                {t('noConnections')}
                            </td>
                        </tr>
                    ) : (
                        results.map((result, index) => {
                            const uniqueKey = `${result.ip}-${result.pid}-${index}`;
                            return (
                                <>
                                    <tr
                                        key={uniqueKey}
                                        className={styles.summary}
                                        onClick={() =>
                                            handleToggleExpand(uniqueKey)
                                        }
                                    >
                                        <td>{result.ip}</td>
                                        <td>{result.country || '-'}</td>
                                        <td>{result.city || '-'}</td>
                                        <td>{result.provider || '-'}</td>
                                        <td>{result.pid}</td>
                                        <td>{result.process || '-'}</td>
                                        <td>
                                            {result.isRisky ? (
                                                <span className={styles.risky}>
                                                    {t('risky')}
                                                </span>
                                            ) : (
                                                <span className={styles.safe}>
                                                    {t('safe')}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <a
                                                href={`https://whois.domaintools.com/${result.ip}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                WHOIS
                                            </a>
                                        </td>
                                        <td>
                                            {result.isRisky ? (
                                                <>
                                                    {!config.trustedIPs.includes(
                                                        result.ip
                                                    ) && (
                                                        <button
                                                            onClick={() =>
                                                                handleMarkIPAsSafe(
                                                                    result.ip
                                                                )
                                                            }
                                                        >
                                                            {t('markIPAsSafe')}
                                                        </button>
                                                    )}
                                                    {!config.trustedProcesses.includes(
                                                        result.processPath
                                                    ) && (
                                                        <button
                                                            onClick={() =>
                                                                handleMarkProcessAsSafe(
                                                                    result.processPath,
                                                                    result.process
                                                                )
                                                            }
                                                        >
                                                            {t(
                                                                'markProcessAsSafe'
                                                            )}
                                                        </button>
                                                    )}
                                                    {result.country &&
                                                        config.riskyCountries.includes(
                                                            result.country
                                                        ) && (
                                                            <button
                                                                onClick={() =>
                                                                    handleMarkCountryAsSafe(
                                                                        result.country
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'markCountryAsSafe'
                                                                )}
                                                            </button>
                                                        )}
                                                </>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRow === uniqueKey && (
                                        <tr className={styles.details}>
                                            <td colSpan={10}>
                                                <ConnectionDetails
                                                    ip={result.ip}
                                                    country={result.country}
                                                    city={result.city}
                                                    provider={result.provider}
                                                    organization={
                                                        result.organization
                                                    }
                                                    lat={result.lat}
                                                    lon={result.lon}
                                                    pid={result.pid}
                                                    process={result.process}
                                                    processPath={
                                                        result.processPath
                                                    }
                                                    isSigned={result.isSigned}
                                                    isRisky={result.isRisky}
                                                    suspicionReason={
                                                        result.suspicionReason
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })
                    )}
                </tbody>
            </table>
            {isScanning && <p className={styles.empty}>{t('scanning')}</p>}
        </div>
    );
}
