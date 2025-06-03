import ConnectionTable from '@renderer/components/ConnectionTable';
import { useI18n } from '@renderer/hooks/useI18n';
import { useScan } from '@renderer/hooks/useScan';
import { useStore } from '@renderer/store';
import { useConfig } from '@renderer/hooks/useConfig';
import { useEffect, useState } from 'react';
import styles from './MainPage.module.css';

export default function MainPage() {
  const { t } = useI18n();
  const { scanNetwork } = useScan();
  const { connections, scanResults, isScanning, addMessage } = useStore();
  const { config, saveConfig } = useConfig();
  const [progress, setProgress] = useState(0);

  // Update progress during scan
  useEffect(() => {
    if (isScanning && connections.length > 0) {
      const completed = scanResults.length;
      const total = connections.length;
      setProgress((completed / total) * 100);
    } else {
      setProgress(0);
    }
  }, [isScanning, connections, scanResults]);

  // Handle scan button click
  const handleScanClick = async () => {
    if (!isScanning) {
      await scanNetwork(false);
    }
  };

  // Handle periodic scan toggle
  const handlePeriodicScanToggle = () => {
    saveConfig({ ...config, periodicScan: !config.periodicScan });
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={handleScanClick} disabled={isScanning}>
          {isScanning ? t('scanning') : t('scan')}
        </button>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={config.periodicScan}
            onChange={handlePeriodicScanToggle}
          />
          {t('periodicScan')}
        </label>
        {isScanning && (
          <div className={styles.progress}>
            <progress value={progress} max={100} />
            <span>
              {t('scanProgress', {
                completed: scanResults.length,
                total: connections.length,
                percentage: Math.round(progress),
              })}
            </span>
          </div>
        )}
      </div>
      <ConnectionTable />
    </div>
  );
}