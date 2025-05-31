import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@renderer/store';
import { useI18n } from '@renderer/hooks/useI18n';
import { Connection, ScanResult, ProcessEvaluation } from '../../types/network';
import { Config } from '../../types/config';
import { History } from '../../types/history';
import axios from 'axios';
import alertSound from '@assets/alert.mp3';
import { useHistory } from '@renderer/hooks/useHistory';
import { isValidIP, isLocalIP } from '@main/utils/ip';
import { PROCESS_LOCATIONS, SYSTEM_PROCESSES, SUSPICIOUS_FOLDERS, LEGITIMATE_FOLDERS } from '@shared/processConfig';

// Track path recurrence
const pathRecurrence: { [key: string]: number } = {};

/**
 * Evaluate process legitimacy based on SRS scoring rules.
 * @param processName Process name.
 * @param processPath Process executable path.
 * @param isSigned Whether the process is digitally signed.
 * @returns Evaluation result with suspicion status and reason.
 */
const evaluateProcessLocation = (
  processName: string,
  processPath: string,
  isSigned: boolean,
  config: Config,
  history: History[]
): ProcessEvaluation => {
  let score = 0;
  let reason = '';

  // Check trusted processes
  if (
    config.trustedProcesses.includes(processName) ||
    config.trustedProcesses.includes(processPath)
  ) {
    return { isSuspicious: false, reason: 'Trusted process' };
  }

  // System processes without path
  if (SYSTEM_PROCESSES.includes(processName.toLowerCase()) && !processPath) {
    return { isSuspicious: false, reason: 'System process' };
  }

  // No path available
  if (!processPath) {
    return { isSuspicious: true, reason: 'No executable path found' };
  }

  // Known processes
  const knownProcessRegex = PROCESS_LOCATIONS[processName.toLowerCase()];
  if (knownProcessRegex && knownProcessRegex.test(processPath)) {
    score += 100;
  }

  // Specific process penalties
  if (
    ['svchost.exe', 'cmd.exe', 'rundll32.exe'].includes(
      processName.toLowerCase()
    )
  ) {
    if (!knownProcessRegex || !knownProcessRegex.test(processPath)) {
      score -= 50;
    }
  }

  // Folder-based scoring
  if (LEGITIMATE_FOLDERS.some(regex => regex.test(processPath))) {
    score += 80;
  }
  if (SUSPICIOUS_FOLDERS.some(regex => regex.test(processPath))) {
    score -= 30;
  }

  // Signature status
  score += isSigned ? 80 : -20;

  // Path recurrence
  pathRecurrence[processPath] = (pathRecurrence[processPath] || 0) + 1;
  if (pathRecurrence[processPath] > 3) {
    score += 20;
  }

  // History-based scoring
  const nonRiskyCount = history.filter(
    (entry: History) =>
      entry.process === processName && !entry.isRisky && !entry.isSuspicious
  ).length;
  if (nonRiskyCount > 5) {
    score += 50;
  }

  // Final evaluation
  const isSuspicious = score < 50;
  if (isSuspicious) {
    reason =
      score < 0 ? 'Suspicious executable path' : 'Unexpected executable path';
  }

  return { isSuspicious, reason };
};

export const useScan = () => {
  const { t } = useI18n();
  const {
    config,
    connections,
    setConnections,
    addMessage,
    history,
    setScanResults,
    isScanning,
    setIsScanning,
  } = useStore();
  const { saveHistory } = useHistory();

  /**
   * Perform a network scan (live or test mode).
   * @returns Array of scan results or undefined if scan fails.
   */
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanResults([]); // Reset scan results to ensure progress starts from 0

    // Check if IPC is available
    if (!window.electron || !window.electron.ipcRenderer) {
      addMessage('error', 'IPC communication is not initialized');
      setIsScanning(false);
      return [];
    }

    try {
      let rawConnections: Connection[] = [];

      if (config.scanMode === 'live') {
        const response =
          await window.electron.ipcRenderer.invoke('run-netstat');
        if (!response.success) {
          throw new Error(response.error || 'Failed to run netstat');
        }

        rawConnections = response.data.filter(
          (conn: Connection) =>
            conn.state === 'ESTABLISHED' &&
            isValidIP(conn.remoteAddress) &&
            !isLocalIP(conn.remoteAddress) &&
            conn.remoteAddress !== '::'
        );
      } else {
        // Mock data for test mode
        rawConnections = [
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
        // Simulate delay for test mode
        await new Promise(resolve =>
          setTimeout(resolve, rawConnections.length * 50)
        );
      }

      setConnections(rawConnections);

      const results: ScanResult[] = [];
      let requestCount = 0;
      let startTime = Date.now();

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

        // Get process info
        const [nameResp, pathResp, sigResp] = await Promise.all([
          window.electron.ipcRenderer.invoke('get-process-name', conn.pid),
          window.electron.ipcRenderer.invoke('get-process-path', conn.pid),
          window.electron.ipcRenderer.invoke('get-process-signature', conn.pid),
        ]);

        if (!nameResp.success) {
          addMessage('error', `Failed to get process name for PID ${conn.pid}`);
          console.error(nameResp.error);
        }

        const processName = nameResp.data || '';

        if (!pathResp.success) {
          addMessage('error', `Failed to get process path for PID ${conn.pid}`);
          console.error(pathResp.error);
        }

        const processPath = pathResp.data || '';

        if (!sigResp.success) {
          addMessage(
            'error',
            `Failed to get process signature for PID ${processName}`
          );
          console.error(sigResp.error);
        }

        const isSigned = sigResp.data || false;

        // Evaluate process
        const { isSuspicious, reason } = evaluateProcessLocation(
          processName,
          processPath,
          isSigned,
          config,
          history
        );

        // Get IP info
        let country = '',
          provider = '',
          organization = '',
          city = '',
          lat = 0,
          lon = 0;

        try {
          const { data } = await axios.get(
            `http://ip-api.com/json/${conn.remoteAddress}`,
            {
              timeout: 5000,
            }
          );
          requestCount++;
          country = data.country || '';
          provider = data.isp || '';
          organization = data.org || '';
          city = data.city || '';
          lat = data.lat || 0;
          lon = data.lon || 0;
        } catch (error) {
          addMessage(
            'warning',
            `Failed to fetch IP info for ${conn.remoteAddress}: ${(error as Error).message}`
          );
        }

        // Evaluate connection
        const isRisky =
          config.bannedIPs.includes(conn.remoteAddress) ||
          config.riskyCountries.includes(country) ||
          config.riskyProviders.some(p =>
            provider.toLowerCase().includes(p.toLowerCase())
          ) ||
          config.riskyProviders.some(p =>
            organization.toLowerCase().includes(p.toLowerCase())
          );

        const result: ScanResult = {
          ip: conn.remoteAddress,
          country,
          provider,
          organization,
          city,
          lat,
          lon,
          pid: conn.pid,
          process: processName,
          processPath,
          isRisky,
          isSuspicious: isRisky ? false : isSuspicious,
          suspicionReason: isRisky ? 'Risky connection' : reason,
        };

        results.push(result);
        setScanResults([...results]); // Update scan results incrementally

        // Play alert sound for first risky/suspicious connection
        if (isRisky || isSuspicious) {
          const audio = new Audio(alertSound);
          audio
            .play()
            .catch(err => console.error('Failed to play alert sound:', err));
          addMessage(
            'warning',
            isRisky
              ? t('riskyConnectionDetected', { ip: conn.remoteAddress })
              : t('suspiciousProcessDetected', {
                  processName,
                  processPath,
                  reason,
                })
          );
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Save results to history
      await saveHistory(results);
      addMessage('success', 'Scan completed successfully');
      return results;
    } catch (error) {
      addMessage('error', `Scan failed: ${(error as Error).message}`);
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
  ]);

  /**
   * Auto-scan based on scanInterval and periodicScan.
   */
  useEffect(() => {
    if (!config.periodicScan || config.scanInterval <= 0) return;
    const interval = setInterval(() => {
      scanNetwork();
    }, config.scanInterval);
    return () => clearInterval(interval);
  }, [config.scanInterval, config.periodicScan, scanNetwork]);

  return { scanNetwork, isScanning };
};
