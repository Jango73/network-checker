/**
 * Configuration for process validation and scoring.
 */

/**
 * Expected paths for known processes (regex patterns).
 */
export const PROCESS_LOCATIONS: { [key: string]: RegExp } = {
  'chrome.exe':
    /Program Files( \(x86\))?\\Google\\Chrome\\Application\\chrome\.exe$/i,
  'firefox.exe': /Program Files( \(x86\))?\\Mozilla Firefox\\firefox\.exe$/i,
  'msedge.exe':
    /Program Files( \(x86\))?\\Microsoft\\Edge\\Application\\msedge\.exe$/i,
  'opera.exe': /Program Files( \(x86\))?\\Opera\\opera\.exe$/i,
  'brave.exe':
    /Program Files( \(x86\))?\\BraveSoftware\\Brave-Browser\\Application\\brave\.exe$/i,
  'code.exe': /Program Files( \(x86\))?\\Microsoft VS Code\\Code\.exe$/i,
  'discord.exe': /AppData\\Local\\Discord\\app-[0-9.]+\.exe$/i,
  'spotify.exe': /AppData\\Roaming\\Spotify\\Spotify\.exe$/i,
  'notepad.exe': /Windows\\(System32|SysWOW64)\\notepad\.exe$/i,
  'explorer.exe': /Windows\\explorer\.exe$/i,
  'taskmgr.exe': /Windows\\System32\\Taskmgr\.exe$/i,
  'Microsoft.Photos.exe': /Program Files\\WindowsApps\\Microsoft\.Windows\.Photos_[\d.]+_x64__8wekyb3d8bbwe\\Microsoft\.Photos\.exe$/i
};

/**
 * List of system processes considered legitimate even without a path.
 */
export const SYSTEM_PROCESSES = [
  'svchost.exe', // Service Host process for Windows services
  'lsass.exe', // Local Security Authority process for authentication
  'wininit.exe', // Windows Start-Up application
  'csrss.exe', // Client/Server Runtime Subsystem for user-mode operations
  'smss.exe', // Session Manager Subsystem for session initialization
  'winlogon.exe', // Windows Logon process for user login
  'dwm.exe', // Desktop Window Manager
  'services.exe', // Services control process for managing Windows services
  'taskhostw.exe', // Task Host for Windows tasks
  'conhost.exe', // Console Host for command-line applications
  'rundll32.exe', // Runs DLLs as applications
  'dllhost.exe', // COM Surrogate for hosting DLLs
  'msmpeng.exe', // Microsoft Defender
  'spoolsv.exe', // Printing
  'ctfmon.exe', // Language
];

/**
 * Suspicious folder paths that decrease process score.
 */
export const SUSPICIOUS_FOLDERS = [
  /\\Temp\\/i,
  /\\Downloads\\/i,
  /\\AppData\\Local\\Temp\\/i,
  /\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\/i, // Startup
  /\\Users\\[^\\]+\\AppData\\Local\\[^\\]+\\Temp\\/i, // User temp files
  /\\Public\\/i, // Public shared folder
  /\\Recycle\.Bin\\/i, // Trash
];

/**
 * Legitimate folder paths that increase process score.
 */
export const LEGITIMATE_FOLDERS = [
  /\\AppData\\Local\\Programs\\/i,
  /\\Steam\\/i,
  /\\Epic Games\\/i,
  /\\Program Files( \(x86\))?\\Microsoft\\Edge\\Application\\/i,
  /\\Program Files( \(x86\))?\\Google\\Chrome\\Application\\/i,
  /\\Program Files( \(x86\))?\\Mozilla Firefox\\/i,
  /\\Program Files( \(x86\))?\\BraveSoftware\\Brave-Browser\\/i,
  /\\Program Files( \(x86\))?\\Opera\\/i,
  /\\Program Files( \(x86\))?\\Microsoft\\Office\\root\\Office[0-9]+\\/i, // Microsoft Office
  /\\Program Files( \(x86\))?\\Adobe\\Acrobat.*\\/i, // Adobe Acrobat
  /\\Program Files( \(x86\))?\\Common Files\\/i,
  /\\Windows\\System32\\/i,
  /\\Windows\\SysWOW64\\/i,
];
