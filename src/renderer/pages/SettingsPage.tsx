import { useState, useEffect } from 'react';
import { useI18n } from '@renderer/hooks/useI18n';
import { useStore } from '@renderer/store';
import { useConfig } from '@renderer/hooks/useConfig';
import { useTheme } from '@renderer/hooks/useTheme';
import { Config } from '../../types/config';
import { ALL_COUNTRIES } from '@shared/defaultConfig';
import styles from './SettingsPage.module.css';

type ArrayConfigKeys =
  | 'bannedIPs'
  | 'riskyCountries'
  | 'riskyProviders'
  | 'trustedIPs'
  | 'trustedProcesses';

export default function SettingsPage() {
  const { t } = useI18n();
  const { config, saveConfig, loadConfig, resetConfig } = useConfig();
  const { addMessage } = useStore();
  const { toggleTheme } = useTheme();
  const [form, setForm] = useState({
    bannedIP: '',
    riskyProvider: '',
    trustedIP: '',
    trustedProcess: '',
    scanInterval: (config.scanInterval / 1000).toString(),
    maxHistorySize: config.maxHistorySize.toString(),
  });

  // Sync form state when config is updated (e.g. after reset)
  useEffect(() => {
    setForm({
      bannedIP: '',
      riskyProvider: '',
      trustedIP: '',
      trustedProcess: '',
      scanInterval: (config.scanInterval / 1000).toString(),
      maxHistorySize: config.maxHistorySize.toString(),
    });
  }, [config]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddToList = (key: ArrayConfigKeys, value: string) => {
    if (value.trim()) {
      saveConfig({ ...config, [key]: [...config[key], value.trim()] });
      setForm({
        ...form,
        bannedIP: key === 'bannedIPs' ? '' : form.bannedIP,
        riskyProvider: key === 'riskyProviders' ? '' : form.riskyProvider,
        trustedIP: key === 'trustedIPs' ? '' : form.trustedIP,
        trustedProcess: key === 'trustedProcesses' ? '' : form.trustedProcess,
      });
    }
  };

  const handleRemoveFromList = (key: ArrayConfigKeys, value: string) => {
    saveConfig({
      ...config,
      [key]: config[key].filter(item => item !== value),
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveConfig({ ...config, language: e.target.value });
  };

  const handleScanModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveConfig({ ...config, scanMode: e.target.value as 'live' | 'test' });
  };

  const handleNumericChange = (
    key: 'scanInterval' | 'maxHistorySize',
    value: string
  ) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      saveConfig({
        ...config,
        [key]: key === 'scanInterval' ? num * 1000 : num,
      });
    }
  };

  // Handle country selection toggle
  const handleCountryToggle = (country: string) => {
    const isSelected = config.riskyCountries.includes(country);
    const newRiskyCountries = isSelected
      ? config.riskyCountries.filter(c => c !== country)
      : [...config.riskyCountries, country];
    saveConfig({ ...config, riskyCountries: newRiskyCountries });
  };

  const handleReset = async () => {
    const confirmed = window.confirm(t('confirmReset'));
    if (!confirmed) return;

    try {
      await resetConfig();
      await loadConfig();
      addMessage('success', t('settingsReset'));
    } catch (error) {
      addMessage('error', (error as Error).message);
    }
  };

  return (
    <div className={styles.container}>
      <h1>{t('settings')}</h1>

      {/* Banned IPs */}
      <section className={styles.section}>
        <h2>{t('bannedIPs')}</h2>
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="bannedIP"
            value={form.bannedIP}
            onChange={handleInputChange}
            placeholder={t('enterIP')}
          />
          <button onClick={() => handleAddToList('bannedIPs', form.bannedIP)}>
            {t('add')}
          </button>
        </div>
        <ul className={styles.list}>
          {config.bannedIPs.map(ip => (
            <li key={ip}>
              {ip}{' '}
              <button onClick={() => handleRemoveFromList('bannedIPs', ip)}>
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Risky Countries */}
      <section className={styles.section}>
        <h2>{t('riskyCountries')}</h2>
        <ul
          className={styles.list}
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {ALL_COUNTRIES.map(country => (
            <li key={country}>
              <label>
                <input
                  type="checkbox"
                  checked={config.riskyCountries.includes(country)}
                  onChange={() => handleCountryToggle(country)}
                />
                {country}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* Risky Providers */}
      <section className={styles.section}>
        <h2>{t('riskyProviders')}</h2>
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="riskyProvider"
            value={form.riskyProvider}
            onChange={handleInputChange}
            placeholder={t('enterProvider')}
          />
          <button
            onClick={() =>
              handleAddToList('riskyProviders', form.riskyProvider)
            }
          >
            {t('add')}
          </button>
        </div>
        <ul className={styles.list}>
          {config.riskyProviders.map(provider => (
            <li key={provider}>
              {provider}{' '}
              <button
                onClick={() => handleRemoveFromList('riskyProviders', provider)}
              >
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Trusted IPs */}
      <section className={styles.section}>
        <h2>{t('trustedIPs')}</h2>
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="trustedIP"
            value={form.trustedIP}
            onChange={handleInputChange}
            placeholder={t('enterIP')}
          />
          <button onClick={() => handleAddToList('trustedIPs', form.trustedIP)}>
            {t('add')}
          </button>
        </div>
        <ul className={styles.list}>
          {config.trustedIPs.map(ip => (
            <li key={ip}>
              {ip}{' '}
              <button onClick={() => handleRemoveFromList('trustedIPs', ip)}>
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Trusted Processes */}
      <section className={styles.section}>
        <h2>{t('trustedProcesses')}</h2>
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="trustedProcess"
            value={form.trustedProcess}
            onChange={handleInputChange}
            placeholder={t('enterProcess')}
          />
          <button
            onClick={() =>
              handleAddToList('trustedProcesses', form.trustedProcess)
            }
          >
            {t('add')}
          </button>
        </div>
        <ul className={styles.list}>
          {config.trustedProcesses.map(process => (
            <li key={process}>
              {process}{' '}
              <button
                onClick={() =>
                  handleRemoveFromList('trustedProcesses', process)
                }
              >
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Appearance */}
      <section className={styles.section}>
        <h2>{t('appearance')}</h2>
        <button
          onClick={toggleTheme}
          style={{ padding: '8px 16px', width: 'auto' }}
        >
          {t('toggleDarkMode')}
        </button>
      </section>

      {/* Language */}
      <section className={styles.section}>
        <h2>{t('language')}</h2>
        <select value={config.language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="it">Italiano</option>
          <option value="de">Deutsch</option>
          <option value="nl">Nederlands</option>
          <option value="ru">Русский</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
          <option value="ja">日本語</option>
        </select>
      </section>

      {/* Scan Settings */}
      <section className={styles.section}>
        <h2>{t('scanSettings')}</h2>
        <div className={styles.inputGroup}>
          <label>
            {t('scanInterval')}
            <input
              type="number"
              name="scanInterval"
              value={form.scanInterval}
              onChange={e => {
                setForm({ ...form, scanInterval: e.target.value });
                handleNumericChange('scanInterval', e.target.value);
              }}
              min="0"
            />
            {t('seconds')}
          </label>
        </div>
        <div className={styles.inputGroup}>
          <label>
            {t('maxHistorySize')}
            <input
              type="number"
              name="maxHistorySize"
              value={form.maxHistorySize}
              onChange={e => {
                setForm({ ...form, maxHistorySize: e.target.value });
                handleNumericChange('maxHistorySize', e.target.value);
              }}
              min="1"
            />
            {t('mb')}
          </label>
        </div>
      </section>

      {/* Dev Zone */}
      <section className={styles.section}>
        <h2>{t('devZone')}</h2>
        <div className={styles.inputGroup}>
          <label>
            {t('scanMode')}&nbsp;
            <select value={config.scanMode} onChange={handleScanModeChange}>
              <option value="live">{t('live')}</option>
              <option value="test">{t('test')}</option>
            </select>
          </label>
        </div>
      </section>

      {/* Danger Zone */}
      <section className={styles.section}>
        <h2>{t('dangerZone')}</h2>
        <div className={styles.inputGroup}>
          <button
            className={`${styles.resetButton} danger`}
            onClick={handleReset}
          >
            {t('resetSettings')}
          </button>
        </div>
      </section>
    </div>
  );
}