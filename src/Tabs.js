window.Tabs = window.Tabs || {};

// Navigation bar for tabs
window.Tabs.Tabs = ({ activeTab, setActiveTab, i18next }) => {
  return (
    <div className="tabs">
      <div className={`tab ${activeTab === 'main' ? 'active' : ''}`} onClick={() => setActiveTab('main')}>
        {i18next.t('main')}
      </div>
      <div className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
        {i18next.t('map')}
      </div>
      <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
        {i18next.t('history')}
      </div>
      <div className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
        {i18next.t('settings')}
      </div>
      <div className={`tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
        {i18next.t('about')}
      </div>
    </div>
  );
};

// Main tab content (scan button, periodic checkbox, country/connections tables)
window.Tabs.MainContent = ({ connections, isScanning, scanConnections, periodicScan, setPeriodicScan, scanProgress, i18next }) => {
  const countryCounts = connections.reduce((acc, conn) => {
    acc[conn.country] = (acc[conn.country] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <button onClick={scanConnections} disabled={isScanning}>
        {isScanning ? <span className="spinner"></span> : i18next.t('check')}
      </button>
      {isScanning && scanProgress.total > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Scanning {scanProgress.current}/{scanProgress.total} IPs ({Math.round((scanProgress.current / scanProgress.total) * 100)}%)
          </div>
        </div>
      )}
      <div className="form-group" style={{ marginTop: '0.625rem' }}>
        <label>
          <input
            type="checkbox"
            checked={periodicScan}
            onChange={() => setPeriodicScan(!periodicScan)}
          />
          {i18next.t('periodic')}
        </label>
      </div>
      <div style={{ marginTop: '1.25rem' }}>
        <h2>{i18next.t('scannedIPs')}</h2>
        {typeof window.Tabs.renderConnectionsTable === 'function'
          ? window.Tabs.renderConnectionsTable(connections, i18next)
          : <p>Error: renderConnectionsTable is not available.</p>}
      </div>
      <div style={{ marginTop: '1.25rem' }}>
        <h2>{i18next.t('connectionsByCountry')}</h2>
        {Object.keys(countryCounts).length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{i18next.t('country')}</th>
                <th>{i18next.t('connections')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(countryCounts).map(([country, count]) => (
                <tr key={country}>
                  <td>{country}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{i18next.t('noConnections')}</p>
        )}
      </div>
    </div>
  );
};

// Map tab content (wrapper for NetworkMap)
window.Tabs.MapContent = ({ connections, isDarkMode, i18next }) => {
  return (
    <div>
      <h2>{i18next.t('map')}</h2>
      <NetworkMap connections={connections} isDarkMode={isDarkMode} />
    </div>
  );
};

// History tab content (export/clear buttons, history table with expandable rows)
window.Tabs.HistoryContent = ({ history, i18next, handleExport, handleClearHistory }) => {
  const [expandedRow, setExpandedRow] = React.useState(null);

  const toggleRow = (timestamp) => {
    setExpandedRow(prev => prev === timestamp ? null : timestamp);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="clear" onClick={handleClearHistory}>
          {i18next.t('clearHistory')}
        </button>
        <button className="export-json" onClick={() => handleExport('json')}>
          {i18next.t('exportJSON')}
        </button>
        <button className="export-csv" onClick={() => handleExport('csv')}>
          {i18next.t('exportCSV')}
        </button>
      </div>
      <div>
        <h2>{i18next.t('history')}</h2>
        {history.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{i18next.t('scanDate')}</th>
                <th>{i18next.t('totalConnections')}</th>
                <th>{i18next.t('riskyConnections')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((scan) => (
                <React.Fragment key={scan.timestamp}>
                  <tr
                    className="history-row"
                    onClick={() => toggleRow(scan.timestamp)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{new Date(scan.timestamp).toLocaleString()}</td>
                    <td>{scan.totalConnections}</td>
                    <td>{scan.riskyConnections}</td>
                  </tr>
                  {expandedRow === scan.timestamp && (
                    <tr>
                      <td colSpan="3" style={{ padding: '0.625rem' }}>
                        <div style={{ margin: '0.625rem 0' }}>
                          <h3>{i18next.t('scanDetails')} ({new Date(scan.timestamp).toLocaleString()})</h3>
                          {typeof window.Tabs.renderConnectionsTable === 'function'
                            ? window.Tabs.renderConnectionsTable(scan.connections, i18next)
                            : <p>Error: renderConnectionsTable is not available.</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{i18next.t('noHistory')}</p>
        )}
      </div>
    </div>
  );
};

// Settings tab content (configuration forms)
window.Tabs.SettingsContent = ({ language, setLanguage, isDarkMode, setIsDarkMode, intervalMin, setIntervalMin, maxHistorySize, setMaxHistorySize, bannedIPs, handleBannedIPsChange, ipError, riskyProviders, handleRiskyProvidersChange, providerError, riskyCountries, handleCountryClick, handleResetSettings, i18next, scanMode, setScanMode }) => {
  return (
    <div className="config">
      <div className="form-group">
        <label>{i18next.t('language')}</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="it">Italiano</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
          <option value="el">Ελληνικά</option>
          <option value="ru">Русский</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
        </select>
      </div>
      <div className="form-group">
        <label>{i18next.t('darkMode')}</label>
        <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
      </div>
      <div className="form-group">
        <label>{i18next.t('interval')}</label>
        <input
          type="number"
          value={intervalMin}
          onChange={(e) => setIntervalMin(Math.max(0, parseInt(e.target.value)))}
        />
      </div>
      <div className="form-group">
        <label>{i18next.t('maxHistorySize')}</label>
        <input
          type="number"
          value={maxHistorySize}
          onChange={(e) => setMaxHistorySize(Math.max(1, parseInt(e.target.value)))}
        />
      </div>
      <div className="form-group">
        <label>{i18next.t('bannedIPs')}</label>
        <input
          type="text"
          value={bannedIPs.join(',')}
          onChange={handleBannedIPsChange}
        />
        {ipError && <div className="error-message">{ipError}</div>}
      </div>
      <div className="form-group">
        <label>{i18next.t('riskyProviders')}</label>
        <input
          type="text"
          value={riskyProviders.join(',')}
          onChange={handleRiskyProvidersChange}
        />
        {providerError && <div className="error-message">{providerError}</div>}
      </div>
      <div className="form-group">
        <label>{i18next.t('countriesRisky')}</label>
        <select multiple value={riskyCountries}>
          {window.config.countries.map(country => (
            <option
              key={country}
              value={country}
              onClick={() => handleCountryClick(country)}
            >
              {country}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>{i18next.t('scanMode')}</label>
        <select value={scanMode} onChange={(e) => setScanMode(e.target.value)}>
          <option value="live">{i18next.t('liveMode')}</option>
          <option value="test">{i18next.t('testMode')}</option>
        </select>
      </div>
      <button className="reset" onClick={handleResetSettings}>
        {i18next.t('resetSettings')}
      </button>
    </div>
  );
};

// About tab content (static text and links)
window.Tabs.AboutContent = ({ i18next }) => {
  return (
    <div className="form-group">
      <h2>{i18next.t('about')}</h2>
      <p>
        This application is licensed under the
        <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer">
          GNU General Public License v3.0 (GPLv3).
        </a>.
      </p>
      <p>
        Map (unmodified): "Mercator Projection" by Daniel R. Strebe, licensed under Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0).
        <a href="https://commons.wikimedia.org/wiki/File:Mercator_projection_Square.JPG" target="_blank" rel="noopener noreferrer">
          Source: Wikimedia Commons
        </a>.
      </p>
    </div>
  );
};

// Renders the connections table
window.Tabs.renderConnectionsTable = (conns, i18next) => {
  if (!conns || conns.length === 0) {
    return <p>{i18next.t('noConnections')}</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>IP</th>
          <th>{i18next.t('country')}</th>
          <th>{i18next.t('isp')}</th>
          <th>{i18next.t('org')}</th>
          <th>PID</th>
          <th>{i18next.t('process')}</th>
          <th>{i18next.t('risky')}</th>
          <th>{i18next.t('suspicious')}</th>
          <th>WHOIS</th>
        </tr>
      </thead>
      <tbody>
        {conns.map(conn => (
          <tr key={conn.ip} className={conn.isRisky ? 'risky' : ''}>
            <td>{conn.ip}</td>
            <td>{conn.country}</td>
            <td>{conn.isp}</td>
            <td>{conn.org}</td>
            <td>{conn.pid}</td>
            <td>{conn.processName}</td>
            <td>{conn.isRisky ? i18next.t('risky') : '-'}</td>
            <td>{conn.isSuspicious ? i18next.t('suspicious') : '-'}</td>
            <td>
              <a href={`https://whois.domaintools.com/${conn.ip}`} target="_blank">WHOIS</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};