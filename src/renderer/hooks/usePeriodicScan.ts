import { useEffect } from 'react';
import { useStore } from '@renderer/store';
import { useConfig } from '@renderer/hooks/useConfig';
import { useScan } from '@renderer/hooks/useScan';

/**
 * Hook to manage periodic network scanning based on configuration.
 */
export function usePeriodicScan() {
  const { config } = useConfig();
  const { scanNetwork } = useScan();
  const { isScanning } = useStore();

  useEffect(() => {
    if (!config.periodicScan || isScanning) return;

    const interval = setInterval(() => {
      scanNetwork();
    }, config.scanInterval);

    return () => clearInterval(interval);
  }, [config.periodicScan, config.scanInterval, isScanning, scanNetwork]);
}