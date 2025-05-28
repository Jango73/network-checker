window.config = window.config || {};

// Regex for validating IP addresses
window.config.ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
window.config.ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;

// List of countries
window.config.countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
].sort();

// Default configuration
window.config.DEFAULT_CONFIG = {
  riskyCountries: ['Iran', 'Bangladesh', 'Venezuela', 'Honduras', 'Algeria', 'Nigeria', 'India', 'Panama', 'Thailand', 'Belarus', 'Kenya', 'South Africa', 'Ghana'],
  bannedIPs: [],
  trustedIPs: [],
  riskyProviders: ['Choopa', 'LeaseWeb', 'QuadraNet', 'Ecatel', 'Sharktech', 'HostSailor', 'M247', 'WorldStream'],
  trustedProcesses: [],
  intervalMin: 30,
  maxHistorySize: 10,
  isDarkMode: false,
  language: 'en',
  periodicScan: true,
  scanMode: 'live'
};

// Expected process locations for executables
window.config.processLocations = {
  'msedge.exe': [
    /^C:\\Program Files\\Microsoft\\Edge\\Application\\/i,
    /^C:\\Program Files \(x86\)\\Microsoft\\Edge\\Application\\/i
  ],
  'firefox.exe': [
    /^C:\\Program Files\\Mozilla Firefox\\/i,
    /^C:\\Program Files \(x86\)\\Mozilla Firefox\\/i
  ],
  'chrome.exe': [
    /^C:\\Program Files\\Google\\Chrome\\Application\\/i,
    /^C:\\Program Files \(x86\)\\Google\\Chrome\\Application\\/i
  ],
  'svchost.exe': [
    /^C:\\Windows\\System32\\/i
  ],
  'explorer.exe': [
    /^C:\\Windows\\/i
  ],
  'SDXHelper.exe': [
    /^C:\\Program Files\\Microsoft Office\\root\\Office\d+\\/i,
    /^C:\\Program Files \(x86\)\\Microsoft Office\\root\\Office\d+\\/i,
    /^C:\\Program Files\\WindowsApps\\Microsoft\.Office\.Desktop_.*\\Office\d+\\/i
  ]
};

// System processes considered legitimate if no path is found
window.config.systemProcesses = [
  'svchost.exe',
  'lsass.exe',
  'csrss.exe',
  'smss.exe',
  'winlogon.exe',
  'services.exe'
];

// Test configuration
window.config.TEST_CONFIG = {
  riskyCountries: ['ShadyCountry'],
  bannedIPs: ['203.0.113.1'],
  trustedIPs: [],
  riskyProviders: ['ShadyISP'],
  trustedProcesses: [],
  intervalMin: 30,
  maxHistorySize: 10,
  isDarkMode: false,
  language: 'en',
  periodicScan: true,
  scanMode: 'live'
};

// Mock connections for test mode
window.config.testConnections = [
  {
    ip: "192.168.1.100",
    country: "United States",
    isp: "Comcast",
    org: "Comcast Cable",
    city: "New York",
    lat: 40.7128,
    lon: -74.0060,
    isRisky: false,
    pid: "1234",
    processName: "chrome.exe",
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    isSuspicious: false,
    suspicionReason: ""
  },
  {
    ip: "203.0.113.1",
    country: "Germany",
    isp: "Deutsche Telekom",
    org: "Deutsche Telekom AG",
    city: "Berlin",
    lat: 52.5200,
    lon: 13.4050,
    isRisky: true,
    pid: "5678",
    processName: "firefox.exe",
    executablePath: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    isSuspicious: false,
    suspicionReason: ""
  },
  {
    ip: "198.51.100.50",
    country: "ShadyCountry",
    isp: "Rostelecom",
    org: "Rostelecom",
    city: "Moscow",
    lat: 55.7558,
    lon: 37.6173,
    isRisky: true,
    pid: "9012",
    processName: "edge.exe",
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    isSuspicious: false,
    suspicionReason: ""
  },
  {
    ip: "172.16.254.1",
    country: "United Kingdom",
    isp: "ShadyISP",
    org: "ShadyISP Ltd",
    city: "London",
    lat: 51.5074,
    lon: -0.1278,
    isRisky: true,
    pid: "3456",
    processName: "notepad.exe",
    executablePath: "C:\\Windows\\notepad.exe",
    isSuspicious: false,
    suspicionReason: ""
  },
  {
    ip: "10.0.0.1",
    country: "France",
    isp: "Orange",
    org: "Orange SA",
    city: "Paris",
    lat: 48.8566,
    lon: 2.3522,
    isRisky: false,
    pid: "7890",
    processName: "unknown.exe",
    executablePath: "C:\\Users\\User\\AppData\\Local\\Temp\\unknown.exe",
    isSuspicious: true,
    suspicionReason: "Suspicious executable path"
  },
  {
    ip: "93.184.216.34",
    country: "Canada",
    isp: "Bell Canada",
    org: "Bell Canada",
    city: "Toronto",
    lat: 43.6532,
    lon: -79.3832,
    isRisky: false,
    pid: "4",
    processName: "svchost.exe",
    executablePath: null,
    isSuspicious: false,
    suspicionReason: ""
  },
  {
    ip: "142.250.190.78",
    country: "Australia",
    isp: "Telstra",
    org: "Telstra Corporation",
    city: "Sydney",
    lat: -33.8688,
    lon: 151.2093,
    isRisky: false,
    pid: "Unknown",
    processName: "Unknown",
    executablePath: null,
    isSuspicious: false,
    suspicionReason: ""
  },
  {
    ip: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    country: "Japan",
    isp: "NTT",
    org: "NTT Communications",
    city: "Tokyo",
    lat: 35.6762,
    lon: 139.6503,
    isRisky: false,
    pid: "2345",
    processName: "code.exe",
    executablePath: "C:\\Program Files\\Microsoft VS Code\\Code.exe",
    isSuspicious: false,
    suspicionReason: ""
  }
];