# Network Checker

**Network Checker** is a Windows desktop application built with Electron and React. It scans active network connections, enriches them with metadata (IP, country, ISP, process, signature status), and evaluates their risk using a customizable rule-based engine. The app features an interactive UI with map visualization, history tracking, alerts, and export options.
Available in english, french, spanish, italian, german, dutch, russian, chinese, korean, japanese.

## Features

- Scan active TCP/UDP connections using `netstat`
- Enrich results with geolocation and provider data from `ip-api.com`
- Extract process information via `tasklist`, `wmic`, and PowerShell
- Verify process digital signatures
- Custom scoring engine with rule-based evaluation (`ruleset.json`)
- Identify risky or suspicious connections
- Interactive interface with:
  - World map with color-coded pins
  - Detailed tables
  - History tab with exports (CSV/JSON)
  - Customizable settings (dark mode, language, risk criteria, etc.)
- Support for multiple languages (i18next)
- Dark and light themes
- Test mode with mock connections

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/Jango73/network-checker.git
   cd network-checker
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start in development mode:

   ```
   npm run dev
   ```

5. Run tests

   ```
   npm run test
   ```

4. Build for production:

   ```
   npm run build
   ```

## Usage

After launching the app, you can:

* Manually start a scan
* Enable periodic scanning
* Inspect connections in real time
* Mark IPs or processes as safe
* Configure risk criteria in the **Settings** tab
* View past scans in the **History** tab
* Export scan results as JSON or CSV

## Configuration

Settings are stored in `config.json` and include:

* Risky countries
* Banned and trusted IPs
* Risky providers
* Trusted processes
* Scan interval and history size
* Theme and language preferences
* Scan mode (Live or Test)

You can reset settings at any time via the UI.

## Ruleset

Risk evaluation is based on a scoring system defined in `ruleset.json`. It contains:

* Named datasets (trusted folders, suspicious folders, known process locations)
* Rules with multiple conditions and weights
* Example: unsigned critical processes in wrong locations are penalized

You can edit the `ruleset.json` file to fine-tune detection logic.

## Limitations

* Windows-only (uses `netstat`, `wmic`, PowerShell)
* Geolocation relies on [ip-api.com](http://ip-api.com), limited to 45 requests/min
* Process validation may fail for system-protected processes

## Tech Stack

* Electron (main process, IPC)
* React (frontend UI)
* Vite (build tool)
* Zustand (state management)
* Zod (schema validation)
* i18next (translations)
* Axios (HTTP requests)
* Prettier + ESLint

## Development

Project structure:

```
src/
├── main/         # Electron main process (IPC, services)
├── renderer/     # React frontend (pages, components, styles)
├── shared/       # Shared constants and logic
├── types/        # TypeScript types
├── assets/       # Static assets (map image, sounds, etc.)
```

Build commands:

```bash
npm run dev          # Start frontend dev server
npm run build        # Full production build (tsc + vite + electron-builder)
npm run typecheck    # Check types only
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## License

This project is licensed under the GPLv3.


## Notes

The app isn't production-ready (I did try).  
If someone wants to make it work, be my guest. It's brain-melting at this point.
