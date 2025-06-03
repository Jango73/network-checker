import { useCallback } from 'react';
import axios from 'axios';
import { useStore } from '@renderer/store';
import { useI18n } from '@renderer/hooks/useI18n';
import { useHistory } from '@renderer/hooks/useHistory';
import { Connection, ScanResult } from '../../types/network';
import { HistoryEntry } from '../../types/history';
import alertSound from '@assets/alert.mp3';
import { isValidIP, isLocalIP } from '@main/utils/ip';
import { RuleEngine } from '@shared/RuleEngine';

export const useScan = () => {
    const { t } = useI18n();
    const {
        config,
        setConnections,
        addMessage,
        history,
        setScanResults,
        isScanning,
        setIsScanning,
        incrementPathRecurrence,
        getPathRecurrence,
    } = useStore();
    const { saveHistory } = useHistory();

    const fetchGeoData = async (ip: string) => {
        try {
            const { data } = await axios.get(`http://ip-api.com/json/${ip}`, {
                timeout: 5000,
            });
            if (data.status !== 'success') throw new Error('Invalid response');
            return {
                country: data.country || '',
                provider: data.isp || '',
                organization: data.org || '',
                city: data.city || '',
                lat: data.lat || 0,
                lon: data.lon || 0,
            };
        } catch (error) {
            addMessage(
                'warning',
                t('geoDataFailed', { ip, error: (error as Error).message })
            );
            return null;
        }
    };

    function generateRandomExecutableName(): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const length = Math.floor(Math.random() * 6) + 5;
        let name = '';
        for (let i = 0; i < length; i++) {
            name += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${name}.exe`;
    }

    function stripExecutableFromRegexPath(regexStr: string): string {
        return regexStr.replace(/\\\\[^\\]+\\.exe\$$/i, '\\\\');
    }

    function normalizePathToUnix(path: string): string {
        return path.replace(/[\\/]+/g, '/').replace(/^\s+|\s+$/g, '');
    }

    const generateFakeConnection = async (): Promise<
        Connection & { __fake?: boolean }
    > => {
        const ruleset = await window.electron.ipcRenderer.invoke('get-ruleset');

        const getRandomFromArray = <T>(arr: T[]): T =>
            arr[Math.floor(Math.random() * arr.length)];

        const suspiciousFolders =
            ruleset.datasets.suspiciousFolders?.values || [];
        const legitProcessNames = Object.keys(
            ruleset.datasets.processLocations?.values || {}
        );
        const legitProcessFolders = Object.values(
            ruleset.datasets.processLocations?.values || {}
        );

        const useKnownProcess = Math.random() < 0.5;

        let processName = '';
        let processPath = '';

        if (useKnownProcess) {
            processName = getRandomFromArray(legitProcessNames);
        } else {
            processName = generateRandomExecutableName();
        }

        const useSuspiciousPath = Math.random() < 0.5;
        const useKnownPath = Math.random() < 0.5;

        if (useSuspiciousPath) {
            processPath = `C:/Temp/${processName}`;
        } else {
            if (useKnownPath) {
                processPath = `C:/Program Files/Microsoft/Edge/Application/${processName}`;
            }
        }

        const isSigned = Math.random() < 0.5;

        const fakeIP = `45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

        const conn: Connection & { __fake?: boolean } = {
            protocol: 'TCP',
            localAddress: '192.168.1.100',
            localPort: 5555,
            remoteAddress: fakeIP,
            remotePort: 1337,
            state: 'ESTABLISHED',
            pid: Math.floor(Math.random() * 10000),
            __fake: true,
        };

        (conn as any).__meta = {
            processName,
            processPath: normalizePathToUnix(processPath),
            isSigned,
            geoData: {
                country: 'ShadyLand',
                provider: 'Suspicious ISP',
                organization: 'Evil Corp',
                city: 'Darkville',
                lat: 66.6,
                lon: 13.37,
            },
        };

        return conn;
    };

    const scanNetwork = useCallback(
        async (useFakeConnection: boolean) => {
            setIsScanning(true);
            setScanResults([]);

            if (!window.electron?.ipcRenderer) {
                addMessage('error', t('ipcNotInitialized'));
                setIsScanning(false);
                return [];
            }

            try {
                let rawConnections: Connection[] = [];

                if (useFakeConnection) {
                    for (let i = 1; i <= 10; i++) {
                        const fakeConn = await generateFakeConnection();
                        rawConnections.push(fakeConn);
                    }
                } else {
                    const response =
                        await window.electron.ipcRenderer.invoke('run-netstat');
                    if (!response.success)
                        throw new Error(response.error || t('netstatFailed'));
                    rawConnections = response.data.filter(
                        (conn: Connection) =>
                            conn.state === 'ESTABLISHED' &&
                            isValidIP(conn.remoteAddress) &&
                            !isLocalIP(conn.remoteAddress) &&
                            conn.remoteAddress !== '::'
                    );
                }

                setConnections(rawConnections);

                const ruleset =
                    await window.electron.ipcRenderer.invoke('get-ruleset');
                const engine = new RuleEngine(ruleset, config);
                const results: ScanResult[] = [];
                let requestCount = 0;
                let startTime = Date.now();
                let hasAlerted = false;

                for (const conn of rawConnections) {
                    if (requestCount >= 45) {
                        const elapsed = Date.now() - startTime;
                        if (elapsed < 60000)
                            await new Promise(resolve =>
                                setTimeout(resolve, 60000 - elapsed)
                            );
                        requestCount = 0;
                        startTime = Date.now();
                    }

                    let processName = '';
                    let processPath = '';
                    let isSigned = false;

                    if ((conn as any).__meta) {
                        processName = (conn as any).__meta.processName;
                        processPath = (conn as any).__meta.processPath;
                        isSigned = (conn as any).__meta.isSigned;
                    } else {
                        const [nameResp, pathResp, sigResp] = await Promise.all(
                            [
                                window.electron.ipcRenderer.invoke(
                                    'get-process-name',
                                    conn.pid
                                ),
                                window.electron.ipcRenderer.invoke(
                                    'get-process-path',
                                    conn.pid
                                ),
                                window.electron.ipcRenderer.invoke(
                                    'get-process-signature',
                                    conn.pid
                                ),
                            ]
                        );

                        processName = nameResp.success ? nameResp.data : '';
                        processPath = normalizePathToUnix(
                            pathResp.success ? pathResp.data : ''
                        );
                        isSigned = sigResp.success ? sigResp.data : false;

                        if (!nameResp.success)
                            addMessage(
                                'error',
                                t('processNameFailed', {
                                    pid: conn.pid,
                                    error: nameResp.error,
                                })
                            );
                        if (!pathResp.success)
                            addMessage(
                                'error',
                                t('processPathFailed', {
                                    pid: conn.pid,
                                    error: pathResp.error,
                                })
                            );
                        if (!sigResp.success)
                            addMessage(
                                'error',
                                t('processSignatureFailed', {
                                    processName,
                                    error: sigResp.error,
                                })
                            );
                    }

                    incrementPathRecurrence(processPath);
                    const recurrence = getPathRecurrence(processPath);

                    const geoData = await fetchGeoData(conn.remoteAddress);
                    requestCount++;

                    const context = {
                        process: processName,
                        processPath,
                        isSigned,
                        recurrence,
                        country: geoData?.country || '',
                        provider: geoData?.provider || '',
                        organization: geoData?.organization || '',
                        nonRiskyHistoryCount: history.filter(
                            (h: HistoryEntry) =>
                                h.process.toLowerCase() ===
                                    processName.toLowerCase() && !h.isRisky
                        ).length,
                        config,
                        datasets: ruleset.datasets,
                    };

                    const { score, reasons } = engine.evaluate(context);
                    const isRisky = score < 0;
                    const reason = reasons.join(', ') || t('unknownReason');

                    const result: ScanResult = {
                        ip: conn.remoteAddress,
                        country: geoData?.country || '',
                        provider: geoData?.provider || '',
                        organization: geoData?.organization || '',
                        city: geoData?.city || '',
                        lat: geoData?.lat || 0,
                        lon: geoData?.lon || 0,
                        pid: conn.pid,
                        process: processName,
                        processPath,
                        isSigned,
                        isRisky,
                        suspicionReason: reason,
                    };

                    results.push(result);
                    setScanResults([...results]);

                    if (isRisky && !hasAlerted) {
                        const audio = new Audio(alertSound);
                        audio
                            .play()
                            .catch(err =>
                                console.error('Failed to play alert:', err)
                            );
                        hasAlerted = true;
                    }

                    if (isRisky) {
                        addMessage(
                            'warning',
                            t('riskyConnectionDetected', {
                                ip: conn.remoteAddress,
                                processName,
                                processPath,
                                reason,
                            })
                        );
                    }

                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (results.length > 0) {
                    await saveHistory(results);
                }
                addMessage('success', t('scanCompleted'));

                return results;
            } catch (error) {
                addMessage(
                    'error',
                    t('scanFailed', { error: (error as Error).message })
                );
                return [];
            } finally {
                setIsScanning(false);
            }
        },
        [
            config,
            setConnections,
            addMessage,
            history,
            setScanResults,
            saveHistory,
            t,
            incrementPathRecurrence,
            getPathRecurrence,
        ]
    );

    return { scanNetwork, isScanning };
};
