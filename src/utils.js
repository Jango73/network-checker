window.utils = window.utils || {};

// Global object to track path recurrence
window.utils.pathRecurrence = {};

// Evaluates if a process is in a legitimate location
window.utils.evaluateProcessLocation = (processName, executablePath, i18next) => {
  const lowerProcessName = processName.toLowerCase();
  console.log(`Evaluating ${processName} at ${executablePath}`);

  if (!executablePath && window.config.systemProcesses.includes(lowerProcessName)) {
    console.log(`System process ${processName} with no path, assuming legitimate`);
    return {
      score: 100,
      isSuspicious: false,
      reason: ''
    };
  }

  if (!executablePath) {
    console.warn(`No path for ${processName}, marking as suspicious`);
    return {
      score: 0,
      isSuspicious: true,
      reason: i18next.t('error.no_path')
    };
  }

  let score = 0;
  const normalizedPath = executablePath.replace(/\//g, '\\').toLowerCase();
  const parentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('\\') + 1);
  console.log(`Normalized path: ${normalizedPath}, Parent dir: ${parentDir}`);

  if (window.config.processLocations[lowerProcessName]) {
    const isValidPath = window.config.processLocations[lowerProcessName].some(regex => {
      const matches = regex.test(parentDir);
      console.log(`Testing regex ${regex} against ${parentDir}: ${matches}`);
      return matches;
    });
    if (isValidPath) {
      score += 100;
      console.log(`Valid path detected for ${processName}`);
    } else if (['svchost.exe', 'cmd.exe', 'rundll32.exe'].includes(lowerProcessName)) {
      score -= 20;
      console.log(`Generic process name ${processName} in unexpected path`);
    }
  } else {
    console.log(`No location rules for ${processName}`);
  }

  const suspectFolders = [
    /\\Temp\\/i,
    /\\AppData\\Local\\/i,
    /\\AppData\\Roaming\\/i,
    /\\Users\\[^\\]+\\Downloads\\/i
  ];

  if (suspectFolders.some(regex => regex.test(normalizedPath))) {
    score -= 50;
    console.log(`Suspicious folder detected in ${normalizedPath}`);
  }

  const pathKey = `${lowerProcessName}:${normalizedPath}`;
  window.utils.pathRecurrence[pathKey] = (window.utils.pathRecurrence[pathKey] || 0) + 1;
  if (window.utils.pathRecurrence[pathKey] > 3) {
    score += 10;
    console.log(`Recurrence bonus for ${pathKey}`);
  }

  const isSuspicious = score < 50;
  const reason = isSuspicious
    ? score < 0
      ? i18next.t('error.suspect_path')
      : i18next.t('error.unexpected_path')
    : '';
  console.log(`Evaluation for ${processName}: score=${score}, isSuspicious=${isSuspicious}, reason=${reason}`);

  return { score, isSuspicious, reason };
};

// Scans network connections
window.utils.scanConnections = async (setConnections, setIsScanning, setScanProgress, addMessage, bannedIPs, riskyCountries, riskyProviders, maxHistorySize, i18next, scanMode) => {
  console.log(`Starting scanConnections in ${scanMode} mode`);
  setIsScanning(true);
  setScanProgress({ current: 0, total: 0 });
  try {
    let hasPlayedSound = false;
    let connections = [];
    if (scanMode === 'test') {
      // Test mode: use mock connections
      setScanProgress({ current: 0, total: window.config.testConnections.length });
      for (let i = 0; i <= window.config.testConnections.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setScanProgress({ current: i, total: window.config.testConnections.length });
      }
      connections = window.config.testConnections.map(conn => ({
        ...conn,
        isRisky: window.config.TEST_CONFIG.bannedIPs.includes(conn.ip) ||
          window.config.TEST_CONFIG.riskyCountries.includes(conn.country) ||
          window.config.TEST_CONFIG.riskyProviders.some(p => conn.isp.includes(p) || conn.org.includes(p)),
        isSuspicious: conn.isSuspicious || (conn.executablePath && window.utils.evaluateProcessLocation(conn.processName, conn.executablePath, i18next).isSuspicious),
        suspicionReason: conn.suspicionReason || (conn.executablePath ? window.utils.evaluateProcessLocation(conn.processName, conn.executablePath, i18next).reason : '')
      }));
      for (const conn of connections) {
        const ip = conn.ip;
        if ((conn.isRisky || conn.isSuspicious) && !hasPlayedSound) {
          new Audio('https://freesound.org/data/previews/316/316847_4939433-lq.mp3').play();
          if (conn.isRisky) {
            addMessage(i18next.t('warning.risky_connection', { ip }), 'warning');
          }
          hasPlayedSound = true;
        }
      }
      console.log('Mock scan completed, connections:', connections);
    } else {
      // Live mode: real scan
      const netstatOutput = await window.electron.ipcRenderer.invoke('run-netstat');
      const lines = netstatOutput.split('\n').filter(line => line.includes('ESTABLISHED'));

      const ipSet = new Set(lines.map(line => {
        const parts = line.trim().split(/\s+/);
        let ip = parts[2];
        if (!ip) return null;
        if (ip.startsWith('[')) {
          const match = ip.match(/^\[(.*?)\](?::\d+)?$/);
          return match ? match[1] : null;
        } else {
          return ip.split(':')[0];
        }
      }).filter(ip => {
        return ip && (window.config.ipv4Regex.test(ip) || window.config.ipv6Regex.test(ip)) &&
          !/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|::1|0\.0\.0\.0)/.test(ip);
      }));

      const processMap = await window.electron.ipcRenderer.invoke('get-process-name');
      let requestCount = 0;
      let hasPlayedSound = false;
      setScanProgress({ current: 0, total: ipSet.size });
      console.log('Scanning IPs:', ipSet.size);

      for (const ip of ipSet) {
        try {
          const response = await axios.get(`http://ip-api.com/json/${ip}`);
          console.log(`API response for IP ${ip}:`, response.data);
          if (response.data.status === 'success') {
            const { country, isp, org, city, lat, lon } = response.data;
            console.log(`Coordinates for ${city}: lat=${lat}, lon=${lon}`);
            const isRisky = bannedIPs.includes(ip) || riskyCountries.includes(country) || riskyProviders.some(p => isp.includes(p) || org.includes(p));
            const line = lines.find(l => l.includes(ip));
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            const processName = processMap[pid] || 'Unknown';

            let executablePath = null;
            let isSuspicious = false;
            let suspicionReason = '';

            if (pid && !isNaN(pid)) {
              try {
                executablePath = await window.electron.ipcRenderer.invoke('get-process-path', pid);
                const evaluation = window.utils.evaluateProcessLocation(processName, executablePath, i18next);
                isSuspicious = evaluation.isSuspicious;
                suspicionReason = evaluation.reason;
                if (isSuspicious) {
                  console.warn(`Suspicious process detected: ${processName} at ${executablePath}, reason: ${suspicionReason}`);
                  addMessage(i18next.t('warning.suspicious_process', { processName, executablePath, reason: suspicionReason }), 'warning');
                }
              } catch (error) {
                console.error(`Error fetching path for PID ${pid}:`, error);
              }
            }

            connections.push({
              ip,
              country,
              isp,
              org,
              city,
              lat,
              lon,
              isRisky,
              pid: isNaN(pid) ? 'Unknown' : pid,
              processName,
              executablePath,
              isSuspicious,
              suspicionReason
            });

            if ((isRisky || isSuspicious) && !hasPlayedSound) {
              new Audio('https://freesound.org/data/previews/316/316847_4939433-lq.mp3').play();
              if (isRisky) {
                addMessage(i18next.t('warning.risky_connection', { ip }), 'warning');
              }
              hasPlayedSound = true;
            }
          } else {
            console.warn(`Geoloc failed for ${ip}: ${response.data.message}`);
            addMessage(`Geoloc failed for ${ip}`, 'error');
          }
        } catch (error) {
          console.error(`Error checking IP ${ip}:`, error);
          addMessage(`Error checking IP ${ip}`, 'error');
        }
        requestCount++;
        setScanProgress(prev => ({ ...prev, current: prev.current + 1 }));
        if (requestCount >= 45) {
          await new Promise(resolve => setTimeout(resolve, 60000));
          requestCount = 0;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log('Live scan completed, connections:', connections);
    }

    setConnections(connections);
    const scanData = {
      timestamp: new Date().toISOString(),
      connections,
      totalConnections: connections.length,
      riskyConnections: connections.filter(c => c.isRisky || c.isSuspicious).length
    };
    try {
      await window.electron.ipcRenderer.invoke('save-history', scanData, maxHistorySize);
      const updatedHistory = await window.electron.ipcRenderer.invoke('load-history');
      console.log('History saved and updated:', updatedHistory);
      return updatedHistory || [];
    } catch (error) {
      console.error('Failed to save history:', error);
      addMessage('Failed to save scan history.', 'error');
    }
  } catch (error) {
    console.error(`Error in scanConnections (${scanMode} mode):`, error);
    addMessage(`Failed to run scan in ${scanMode} mode. Check network or system permissions.`, 'error');
  } finally {
    console.log('Finalizing scan: resetting isScanning and scanProgress');
    setIsScanning(false);
    setScanProgress({ current: 0, total: 0 });
  }
};

// Validates an IP address
window.utils.validateIP = (ip) => {
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  return ipRegex.test(ip) && ip.split('.').every(num => parseInt(num) >= 0 && parseInt(num) <= 255);
};

// Validates a provider name
window.utils.validateProvider = (provider) => {
  return provider.length >= 3;
};

// Handles banned IPs input changes
window.utils.handleBannedIPsChange = (e, setBannedIPs, setIpError, i18next) => {
  const newIPs = e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip);
  const invalidIP = newIPs.find(ip => !window.utils.validateIP(ip));
  if (invalidIP) {
    setIpError(i18next.t('invalidIP'));
  } else {
    setIpError('');
    setBannedIPs(newIPs);
  }
};

// Handles risky providers input changes
window.utils.handleRiskyProvidersChange = (e, setRiskyProviders, setProviderError, i18next) => {
  const newProviders = e.target.value.split(',').map(p => p.trim()).filter(p => p);
  const invalidProvider = newProviders.find(p => !window.utils.validateProvider(p));
  if (invalidProvider) {
    setProviderError(i18next.t('invalidProvider'));
  } else {
    setProviderError('');
    setRiskyProviders(newProviders);
  }
};

// Handles country selection for risky countries
window.utils.handleCountryClick = (country, riskyCountries, setRiskyCountries) => {
  setRiskyCountries(prev =>
    prev.includes(country)
      ? prev.filter(c => c !== country)
      : [...prev, country]
  );
};

// Handles history export
window.utils.handleExport = async (format, addMessage, i18next) => {
  try {
    const result = await window.electron.ipcRenderer.invoke('export-history', format);
    addMessage(i18next.t(result.success ? 'exportSuccess' : result.message === 'Export canceled' ? 'exportCanceled' : 'exportError', { filePath: result.message.includes('exported to') ? result.message.split('exported to ')[1] : '' }), result.success ? 'success' : 'error');
  } catch (error) {
    console.error('Failed to export history:', error);
    addMessage(i18next.t('exportError'), 'error');
  }
};

// Clears scan history
window.utils.handleClearHistory = async (setHistory, setSelectedScan, addMessage, i18next) => {
  try {
    await window.electron.ipcRenderer.invoke('clear-history');
    setHistory([]);
    setSelectedScan(null);
  } catch (error) {
    console.error('Failed to clear history:', error);
    addMessage('Failed to clear history.', 'error');
  }
};

// Resets settings to default
window.utils.handleResetSettings = async (setRiskyCountries, setBannedIPs, setRiskyProviders, setIntervalMin, setMaxHistorySize, setIsDarkMode, setLanguage, setPeriodicScan, addMessage, i18next, setScanMode) => {
  try {
    setRiskyCountries(window.config.DEFAULT_CONFIG.riskyCountries);
    setBannedIPs(window.config.DEFAULT_CONFIG.bannedIPs);
    setRiskyProviders(window.config.DEFAULT_CONFIG.riskyProviders);
    setIntervalMin(window.config.DEFAULT_CONFIG.intervalMin);
    setMaxHistorySize(window.config.DEFAULT_CONFIG.maxHistorySize);
    setIsDarkMode(window.config.DEFAULT_CONFIG.isDarkMode);
    setLanguage(window.config.DEFAULT_CONFIG.language);
    setPeriodicScan(window.config.DEFAULT_CONFIG.periodicScan);
    setScanMode(window.config.DEFAULT_CONFIG.scanMode);
    await window.electron.ipcRenderer.invoke('save-config', {
      riskyCountries: window.config.DEFAULT_CONFIG.riskyCountries,
      bannedIPs: window.config.DEFAULT_CONFIG.bannedIPs,
      riskyProviders: window.config.DEFAULT_CONFIG.riskyProviders,
      intervalMin: window.config.DEFAULT_CONFIG.intervalMin,
      maxHistorySize: window.config.DEFAULT_CONFIG.maxHistorySize,
      isDarkMode: window.config.DEFAULT_CONFIG.isDarkMode,
      language: window.config.DEFAULT_CONFIG.language,
      periodicScan: window.config.DEFAULT_CONFIG.periodicScan,
      scanMode: window.config.DEFAULT_CONFIG.scanMode
    });
    addMessage(i18next.t('resetSuccess'), 'success');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    addMessage(i18next.t('resetError'), 'error');
  }
};