# Network Checker

## What’s This About? (For Everyone)

The **Network Checker** is a slick desktop app that keeps on eye on your computer’s network connections. It’s like having a personal security guard who checks what your machine is connecting to. Perfect for anyone who wants to stay secure without diving deep into tech jargon.

### What It Does:
- **Scans Active Connections**: Lists all IP addresses your computer is connected to.
- **Spots Risks**: Alerts you if a connection hits a risky country, IP, or provider you’ve flagged.
- **Tracks History**: Saves past scans and lets you expand details right in the table for a quick look.
- **Customizable**: You set what’s risky (countries, IPs, providers) and how often to scan.
- **User-Friendly**: Supports 9 languages (English, French, Spanish, etc.), dark mode, and a clean interface.

Just click “Check Now,” and it’ll tell you if your network’s all good or if something’s fishy.

## How It Works (For Techies)

The **Network Checker** is an Electron-based desktop app for monitoring network connections, built with React for a responsive UI and external APIs for IP analysis.

### Technical Features:
- **Connection Scanning**: Uses `netstat` (via Electron’s `child_process`) to grab active TCP connections in the `ESTABLISHED` state.
- **IP Analysis**: Queries `ip-api.com` for details like country, ISP, organization, and geolocation (latitude/longitude).
- **Risk Detection**: Flags connections based on user-defined lists (banned IPs, risky countries, or providers).
- **History Management**: Stores scans in a JSON file with a configurable size limit (default: 10 MB). View details inline with expandable table rows.
- **Export Options**: Export history as JSON or CSV using Electron’s file dialogs.
- **User Interface**:
  - **React**: Drives the UI with tabs (Main, Map, History, Settings, About) and dynamic components.
  - **i18next**: Powers internationalization for 9 languages (en, fr, it, de, es, el, ru, zh, ko) via `translations.json`.
  - **Dark Mode**: Toggled with CSS (`index.css`) using `light` and `dark` classes.
- **Configuration**: Persists settings (scan interval, risky lists, etc.) in a JSON file via Electron’s `fs` API.
- **Validation**: Checks for valid IPs and provider names to avoid user errors.
- **Performance**: Limits API requests to 45 per minute to respect `ip-api.com`’s free-tier cap, with delays as needed.
- **Map Visualization**: Displays connections on a world map using geolocation data (in the Map tab).

### Architecture:
- **Key Files**:
  - `index.html`: Entry point for the React UI, orchestrates scanning, config, and history.
  - `index.css`: Styles the app, including dark mode and table layouts.
  - `src/main.js`: Electron main process, handles window creation and IPC.
  - `src/preload.js`: Secures IPC communication between renderer and main processes.
  - `src/Tabs.js`: Defines React components for each tab (Main, Map, History, Settings, About).
  - `src/utils.js`: Contains utility functions for scanning, validation, and history/export handling.
  - `src/config.js`: Stores default configuration and constants (e.g., risky countries, regex for IPs).
  - `src/Map.js`: Renders the network map visualization using connection geolocation data.
  - `data/translations.json`: Holds translations for i18n support.
- **Dependencies**:
  - Electron: Desktop app framework.
  - React, ReactDOM: UI rendering.
  - Axios: HTTP requests to `ip-api.com`.
  - i18next: Language support.
  - Babel: JSX transpilation.

### Getting Started:
1. Clone the repo: `git clone <repo-url>`.
2. Install dependencies: `npm install`.
3. Start the app: `npm start`.
4. (Optional) Build an executable: `npm run build`.

### Limitations:
- `ip-api.com` free tier caps requests at 45 per minute.
- Requires system permissions to run `netstat`.
- Only monitors TCP connections (no UDP support yet).
- Map visualization depends on `ip-api.com` geolocation accuracy.

### Future Improvements:
- Add confirmation prompts for resetting settings or clearing history.
- Integrate additional IP analysis APIs for redundancy.
- Enhance map visualization with interactive features (e.g., click to filter connections).
- Support UDP connection monitoring.

### License:
Licensed under the GNU General Public License v3.0 (GPLv3). See `LICENSE` for details.
