import { Config } from '../types/config';

export const DEFAULT_CONFIG: Config = {
  bannedIPs: [],
  riskyCountries: [
    'Iran', 'Bangladesh', 'Venezuela', 'Honduras', 'Algeria', 'Nigeria',
    'India', 'Panama', 'Thailand', 'Belarus', 'Kenya', 'South Africa', 'Ghana'
  ],
  riskyProviders: [
    'Choopa', 'LeaseWeb', 'QuadraNet', 'Ecatel', 'Sharktech',
    'HostSailor', 'M247', 'WorldStream'
  ],
  trustedIPs: [],
  trustedProcesses: [],
  darkMode: false,
  language: 'en',
  scanInterval: 30 * 60 * 1000,
  maxHistorySize: 10,
  scanMode: 'live',
  periodicScan: true,
};