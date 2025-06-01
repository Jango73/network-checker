import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '@renderer/store';
import { useI18n } from '@renderer/hooks/useI18n';
import { useHistory } from '@renderer/hooks/useHistory';
import { Connection, ScanResult, ProcessEvaluation } from '../../types/network';
import { Config } from '../../types/config';
import { History } from '../../types/history';
import alertSound from '@assets/alert.mp3';
import { isValidIP, isLocalIP } from '@main/utils/ip';
import {
  PROCESS_LOCATIONS,
  SYSTEM_PROCESSES,
  SUSPICIOUS_FOLDERS,
  LEGITIMATE_FOLDERS,
} from '@shared/processConfig';

// Mock connections for test mode
const TEST_CONNECTIONS: Connection[] = [
  {
    protocol: 'TCP',
    localAddress: '127.0.0.1',
    localPort: 8080,
    remoteAddress: '8.8.8.8',
    remotePort: 80,
    state: 'ESTABLISHED',
    pid: 1234,
  },
  {
    protocol: 'TCP',
    localAddress: '127.0.0.1',
    localPort: 8081,
    remoteAddress: '2001:4860:4860::8888',
    remotePort: 80,
    state: 'ESTABLISHED',
    pid: 1235,
  },
];

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

  /**
   * Evaluates a process's legitimacy using SRS scoring rules.
   * @param processName Name of the process.
   * @param processPath Full path to the process executable.
   * @param isSigned Whether the process is digitally signed.
   * @returns Object indicating if the process is suspicious and the reason.
   */
  const evaluateProcessLocation = (
    processName: string,
    processPath: string,
    isSigned: boolean
  ): ProcessEvaluation => {
    // Trusted processes are automatically safe
    if (
      config.trustedProcesses.includes(processName.toLowerCase()) ||
      config.trustedProcesses.includes(processPath)
    ) {
      return { isSuspicious: false, reason: t('trustedProcess') };
    }

    // System processes without a path are considered safe
    if (!processPath && SYSTEM_PROCESSES.includes(processName.toLowerCase())) {
      return { isSuspicious: false, reason: t('systemProcess') };
    }

    // Missing path is suspicious
    if (!processPath) {
      return { isSuspicious: true, reason: t('noExecutablePath') };
    }

    let score = 0;
    let reason = '';

    // Check if process is in its expected location
    const knownProcessRegex = PROCESS_LOCATIONS[processName.toLowerCase()];
    if (knownProcessRegex?.test(processPath)) {
      score += 100;
    }

    // Penalize specific processes if not in expected locations
    const sensitiveProcesses = ['svchost.exe', 'cmd.exe', 'rundll32.exe'];
    if (
      sensitiveProcesses.includes(processName.toLowerCase()) &&
      (!knownProcessRegex || !knownProcessRegex.test(processPath))
    ) {
      score -= 50;
    }

    // Score based on folder location
    if (LEGITIMATE_FOLDERS.some(regex => regex.test(processPath))) {
      score += 80;
    }
    if (SUSPICIOUS_FOLDERS.some(regex => regex.test(processPath))) {
      score -= 30;
    }

    // Score based on signature
    score += isSigned ? 80 : -20;

    // Score based on path recurrence
    incrementPathRecurrence(processPath);
    const recurrence = getPathRecurrence(processPath);
    if (recurrence > 3) {
      score += 20;
    }

    // Score based on history
    const nonRiskyCount = history.filter(
      (entry: History) =>
        entry.process.toLowerCase() === processName.toLowerCase() &&
        !entry.isRisky &&
        !entry.isSuspicious
    ).length;
    if (nonRiskyCount > 5) {
      score += 50;
    }

    // Determine suspicion
    const isSuspicious = score < 50;
    if (isSuspicious) {
      reason = score < 0 ? t('suspiciousPath') : t('unexpectedPath');
    }

    return { isSuspicious, reason };
  };

  /**
   * Evaluates if a connection is risky based on configuration.
   * @param conn Connection details.
   * @param geoData Geolocation data for the remote IP.
   * @returns True if the connection is risky, false otherwise.
   */
  const evaluateConnectionRisk = (
    conn: Connection,
    geoData: { country: string; provider: string; organization: string }
  ): boolean => {
    if (config.trustedIPs.includes(conn.remoteAddress)) {
      return false;
    }
    if (config.bannedIPs.includes(conn.remoteAddress)) {
      return true;
    }
    if (config.riskyCountries.includes(geoData.country)) {
      return true;
    }
    return config.riskyProviders.some(p =>
      geoData.provider.toLowerCase().includes(p.toLowerCase()) ||
      geoData.organization.toLowerCase().includes(p.toLowerCase())
    );
  };

  /**
   * Fetches geolocation data for an IP address.
   * @param ip IP address to query.
   * @returns Geolocation data or null if the request fails.
   */
  const fetchGeoData = async (ip: string) => {
    try {
      const { data } = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000,
      });
      if (data.status !== 'success') {
        throw new Error('Invalid response');
      }
      return {
        country: data.country || '',
        provider: data.isp || '',
        organization: data.org || '',
        city: data.city || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
      };
    } catch (error) {
      addMessage('warning', t('geoDataFailed', { ip, error: (error as Error).message }));
      return null;
    }
  };

  /**
   * Performs a network scan in live or test mode.
   * @returns Array of scan results.
   */
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanResults([]);

    if (!window.electron?.ipcRenderer) {
      addMessage('error', t('ipcNotInitialized'));
      setIsScanning(false);
      return [];
    }

    try {
      // Fetch connections
      let rawConnections: Connection[] = [];
      if (config.scanMode === 'live') {
        const response = await window.electron.ipcRenderer.invoke('run-netstat');
        if (!response.success) {
          throw new Error(response.error || t('netstatFailed'));
        }
        rawConnections = response.data.filter(
          (conn: Connection) =>
            conn.state === 'ESTABLISHED' &&
            isValidIP(conn.remoteAddress) &&
            !isLocalIP(conn.remoteAddress) &&
            conn.remoteAddress !== '::'
        );
      } else {
        rawConnections = TEST_CONNECTIONS;
        await new Promise(resolve => setTimeout(resolve, rawConnections.length * 50));
      }

      setConnections(rawConnections);

      const results: ScanResult[] = [];
      let requestCount = 0;
      let startTime = Date.now();
      let hasAlerted = false;

      for (const conn of rawConnections) {
        // Rate limiting: 45 requests per minute
        if (requestCount >= 45) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 60000) {
            await new Promise(resolve => setTimeout(resolve, 60000 - elapsed));
          }
          requestCount = 0;
          startTime = Date.now();
        }

        // Fetch process info
        const [nameResp, pathResp, sigResp] = await Promise.all([
          window.electron.ipcRenderer.invoke('get-process-name', conn.pid),
          window.electron.ipcRenderer.invoke('get-process-path', conn.pid),
          window.electron.ipcRenderer.invoke('get-process-signature', conn.pid),
        ]);

        const processName = nameResp.success ? nameResp.data : '';
        const processPath = pathResp.success ? pathResp.data : '';
        const isSigned = sigResp.success ? sigResp.data : false;

        if (!nameResp.success) {
          addMessage('error', t('processNameFailed', { pid: conn.pid, error: nameResp.error }));
        }
        if (!pathResp.success) {
          addMessage('error', t('processPathFailed', { pid: conn.pid, error: pathResp.error }));
        }
        if (!sigResp.success) {
          addMessage('error', t('processSignatureFailed', { processName, error: sigResp.error }));
        }

        // Evaluate process
        const { isSuspicious, reason } = evaluateProcessLocation(
          processName,
          processPath,
          isSigned
        );

        // Fetch geolocation data
        const geoData = await fetchGeoData(conn.remoteAddress);
        requestCount++;

        // Evaluate connection risk
        const isRisky = geoData ? evaluateConnectionRisk(conn, geoData) : true;

        // Build scan result
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
          isRisky,
          isSuspicious: isRisky ? false : isSuspicious,
          suspicionReason: isRisky ? t('riskyConnection') : reason,
        };

        results.push(result);
        setScanResults([...results]);

        // Trigger alert for risky or suspicious connections
        if ((isRisky || isSuspicious) && !hasAlerted) {
          const audio = new Audio(alertSound);
          audio.play().catch(err => console.error('Failed to play alert:', err));
          hasAlerted = true;
        }

        // Notify user
        if (isRisky) {
          addMessage('warning', t('riskyConnectionDetected', { ip: conn.remoteAddress }));
        } else if (isSuspicious) {
          addMessage('warning', t('suspiciousProcessDetected', { processName, processPath, reason }));
        }

        // Delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Save to history
      if (results.length > 0) {
        await saveHistory(results);
      }
      addMessage('success', t('scanCompleted'));

      return results;
    } catch (error) {
      addMessage('error', t('scanFailed', { error: (error as Error).message }));
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [
    config,
    setConnections,
    addMessage,
    history,
    setScanResults,
    saveHistory,
    t,
    incrementPathRecurrence,
    getPathRecurrence,
  ]);

  return { scanNetwork, isScanning };
};