# Network Connection Checker

## What’s This About? (For Everyone)

The **Network Connection Checker** is a handy desktop app that keeps an eye on your computer’s network connections. Think of it as a watchdog that checks who your machine is “talking” to online—like websites, services, or servers—and flags anything that looks sketchy. It’s perfect for anyone who wants to stay on top of their network security without needing a PhD in tech.

### What It Does:
- **Scans Active Connections**: Shows all the IP addresses your computer is connected to.
- **Spots Risks**: Alerts you if a connection comes from a risky country, IP, or provider you’ve marked as suspicious.
- **Keeps a History**: Lets you review past scans to track what’s been going on.
- **Customizable**: You decide which countries, IPs, or providers are risky, and how often to scan.
- **User-Friendly**: Supports 9 languages (English, French, Spanish, etc.) and has a dark mode for late-night use.

It’s easy to use—just hit “Check Now,” and it’ll tell you if everything’s cool or if something’s off.

## How It Works (For Techies)

The **Network Connection Checker** is an Electron-based desktop app for real-time network connection monitoring. It uses React for the UI and external APIs to analyze IP addresses.

### Technical Features:
- **Connection Scanning**: Runs `netstat` (via Electron’s `child_process`) to list active TCP connections in the `ESTABLISHED` state.
- **IP Analysis**: Queries `ip-api.com` to fetch details like country, ISP, and organization for each IP.
- **Risk Detection**: Flags connections based on user-defined lists (risky countries, banned IPs, shady providers).
- **History**: Stores scan data in a JSON file with a configurable size limit (default: 10 MB).
- **Export**: Supports exporting history as JSON or CSV using Electron’s file API.
- **User Interface**:
  - **React**: Powers the UI with tabs (Main, History, Settings) and reactive components.
  - **i18next**: Handles internationalization for 9 languages (en, fr, it, de, es, el, ru, zh, ko) via `translations.json`.
  - **Dark Mode**: Toggled via CSS (`index.css`) with `light` and `dark` classes.
- **Configuration**: Saves settings (countries, scan interval, etc.) in a JSON file using Electron’s `fs` API.
- **Validation**: Ensures valid IPs and provider names to prevent user errors.
- **Performance**: Caps API requests at 45 per minute to comply with `ip-api.com`’s free-tier limits, with delays if needed.

### Architecture:
- **Key Files**:
  - `index.html`: Hosts the React UI and core logic (scanning, config, history).
  - `index.css`: Styles the UI, with dark mode support.
  - `main.js`: Electron entry point, manages the window and IPC calls.
  - `preload.js`: Secures communication between renderer and main processes.
  - `translations.json`: Stores translations for i18n.
- **Dependencies**:
  - Electron for the desktop app.
  - React and ReactDOM for the UI.
  - Axios for HTTP requests.
  - i18next for language support.
  - Babel for JSX support.

### Getting Started:
1. Clone the repo.
2. Install dependencies: `npm install`.
3. Run the app: `npm start`.
4. (Optional) Build an executable: `npm run build`.

### Limitations:
- `ip-api.com` free tier limits requests to 45 per minute.
- Requires system permissions for `netstat`.
- Currently only supports TCP connections (no UDP).

### Future Improvements:
- Add a confirmation prompt before resetting settings.
- Integrate additional IP analysis APIs.
- Visualize connections (e.g., a world map).
