export interface Config {
  bannedIPs: string[];
  riskyCountries: string[];
  riskyProviders: string[];
  trustedIPs: string[];
  trustedProcesses: string[];
  darkMode: boolean;
  language: string;
  scanInterval: number;
  maxHistorySize: number;
  periodicScan: boolean;
}
