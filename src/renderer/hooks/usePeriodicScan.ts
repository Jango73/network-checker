import { useEffect, useState } from 'react';
import { useConfig } from '@renderer/hooks/useConfig';
import { useScan } from '@renderer/hooks/useScan';
import { useI18n } from '@renderer/hooks/useI18n';

// Hook to manage periodic network scans and provide time until next scan
export const usePeriodicScan = () => {
  const { config } = useConfig();
  const { scanNetwork } = useScan();
  const { t } = useI18n();
  const [lastScanTime, setLastScanTime] = useState<number | null>(Date.now());
  const [timeUntilNextScan, setTimeUntilNextScan] = useState(config.scanInterval);

  // Handle periodic scans and update time until next scan
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;
    let timerInterval: NodeJS.Timeout | null = null;

    if (config.periodicScan) {
      // Trigger periodic scans
      scanInterval = setInterval(async () => {
        await scanNetwork();
        setLastScanTime(Date.now());
      }, config.scanInterval);

      // Update time until next scan every second
      timerInterval = setInterval(() => {
        if (lastScanTime) {
          const elapsed = Date.now() - lastScanTime;
          const remaining = Math.max(0, config.scanInterval - elapsed);
          setTimeUntilNextScan(remaining);
        } else {
          setTimeUntilNextScan(config.scanInterval);
        }
      }, 1000);
    } else {
      setTimeUntilNextScan(config.scanInterval);
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [config.periodicScan, config.scanInterval, lastScanTime, scanNetwork, t]);

  useEffect(() => {
    if (config.periodicScan) {
      setLastScanTime(Date.now());
    }
  }, [config.periodicScan]);

  return {
    timeUntilNextScan,
  };
};