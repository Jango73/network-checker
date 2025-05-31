# Network Checker

## What’s This About? (For Everyone)

The **Network Checker** is a slick desktop app that keeps on eye on your computer’s network connections. It’s like having a personal security guard who checks what your machine is connecting to. Perfect for anyone who wants to stay secure without diving deep into tech jargon.

### What It Does:
- **Scans Active Connections**: Lists all IP addresses your computer is connected to.
- **Spots Risks**: Alerts you if a connection hits a risky country, IP, or provider you’ve flagged.
- **Tracks History**: Saves past scans and lets you expand details right in the table for a quick look.
- **Customizable**: You set what’s risky (countries, IPs, providers) and how often to scan.
- **User-Friendly**: Supports 10 languages (English, French, Spanish, Russian, Chinese, etc.), dark mode, and a clean interface.

Just click “Check Now,” and it’ll tell you if your network’s all good or if something’s fishy.

## How It Works (For Techies)

The **Network Checker** is an Electron-based desktop app for monitoring network connections, built with React for a responsive UI and external APIs for IP analysis.
It is meant to run on Windows but could be extended to Linux by adding the necessary process information in the relevant arrays and modifying the services to allow for Linux methods.

### Tech Stack
- **Electron**: Powers the desktop app, handling the main process (Node.js) and renderer process (React).
- **TypeScript**: Ensures type safety across the board.
- **React**: Drives the UI in the renderer process, with hooks and components for a smooth user experience.
- **Vite**: Handles fast builds and dev server for the frontend.
- **Zustand**: Lightweight state management for the renderer process.
- **i18next**: Manages internationalization for multi-language support.
- **Axios**: Used for potential API calls (e.g., geolocation lookups).
- **ESLint + Prettier**: Keeps the code clean and consistent.
- **Electron Builder**: Packages the app for Windows (NSIS target).

### Project Structure
```
network-checker/
├── src/
│   ├── main/               # Electron main process (Node.js)
│   │   ├── index.ts        # Entry point, creates BrowserWindow
│   │   ├── preload.ts      # Secure bridge between main and renderer
│   │   ├── services/       # Core logic for netstat, processes, config, history
│   │   ├── utils/          # Helper functions (e.g., IP validation)
│   │   └── ipc/            # IPC handlers for main-renderer communication
│   ├── renderer/           # React frontend
│   │   ├── components/     # Reusable UI components (e.g., ConnectionTable)
│   │   ├── hooks/          # Custom hooks for config, history, scanning, i18n
│   │   ├── pages/          # Main views: MainPage, MapPage, HistoryPage, SettingsPage
│   │   ├── store/          # Zustand store for state management
│   │   ├── styles/         # Global and module-specific CSS
│   │   └── types/          # TypeScript type definitions for renderer
│   ├── shared/             # Shared configs (e.g., defaultConfig.ts)
│   └── types/              # Shared TypeScript types (connection, config, history)
├── dist/                   # Build output
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config
└── vite.config.ts          # Vite config for renderer
```

### How It Works
1. **Main Process** (`src/main/`):
   - **index.ts**: Sets up the Electron app, creates the `BrowserWindow`, and loads the renderer (dev: `localhost:5173`, prod: `index.html`).
   - **preload.ts**: Exposes a secure `electron` API to the renderer via `contextBridge`, restricting IPC to specific channels (e.g., `run-netstat`, `load-config`).
   - **services/**:
     - `NetstatService.ts`: Runs `netstat -ano` to fetch active connections, parsing them into `Connection` objects (protocol, IPs, ports, PID).
     - `ProcessService.ts`: Gets process details (name, path, signature status) using `tasklist` and `wmic` commands.
     - `ConfigService.ts`: Manages `config.json` for user settings (banned IPs, trusted processes, etc.).
     - `HistoryService.ts`: Handles `history.json` for storing and exporting scan history (JSON/CSV).
   - **ipc/index.ts**: Defines IPC handlers to bridge main and renderer processes, ensuring secure communication.

2. **Renderer Process** (`src/renderer/`):
   - **index.tsx**: Entry point for React, initializes i18next and renders the `App` component.
   - **pages/**:
     - `MainPage.tsx`: Displays a control panel with a scan button, periodic scan toggle, and a `ConnectionTable` showing scan results.
     - `MapPage.tsx`: Renders a canvas with a world map (`map.jpg`) and plots connections as pins (red for risky, green for safe) using Mercator projection.
     - `HistoryPage.tsx`: Shows scan history with expandable entries and export options (JSON/CSV).
     - `SettingsPage.tsx`: Allows users to manage banned IPs, risky countries/providers, trusted IPs/processes, and app settings (language, theme, scan interval).
   - **hooks/**:
     - `useConfig.ts`: Loads/saves config via IPC and syncs with Zustand store.
     - `useHistory.ts`: Manages scan history (load, save, export, clear) via IPC.
     - `useScan.ts`: Handles network scanning logic, integrating with `NetstatService` and geolocation lookups.
     - `useI18n.ts`: Wraps i18next for translations.
   - **store/index.ts**: Centralized Zustand store for config, connections, scan results, history, and messages.

3. **Key Features**:
   - **Network Scanning**: Uses `netstat` to list active TCP/UDP connections, enriched with process details and geolocation data (IP, country, city, etc.).
   - **Risk Detection**: Flags connections as risky/suspicious based on user-defined banned IPs, risky countries/providers, or untrusted processes.
   - **History Management**: Stores scan results in `history.json`, with size limits and export options.
   - **Interactive Map**: Visualizes connections on a world map with clustering for nearby points and tooltips for details.
   - **Configurability**: Users can tweak settings like scan intervals, trusted IPs/processes, and risky countries via a settings page.
   - **i18n**: Supports multiple languages (English, French, Spanish, etc.) via i18next.
   - **Theming**: Light/dark mode toggle with CSS variables.

4. **Build & Run**:
   - **Dev**: `npm run dev` for Vite dev server, `npm run start` to launch Electron.
   - **Build**: `npm run build` compiles TypeScript and Vite, then uses Electron Builder to package for Windows.
   - **Lint/Format**: `npm run lint` and `npm run format` for code quality.

### Getting Started
1. Clone the repo: `git clone https://github.com/Jango73/network-checker.git`
2. Install dependencies: `npm install`
3. Run in dev mode: `npm run dev` or `npm run start`
4. Build for production: `npm run build`

### Notes for Devs
- **Security**: IPC channels are restricted to prevent unauthorized access. `contextIsolation` and `nodeIntegration: false` are enabled.
- **Extensibility**: Add new IPC channels in `preload.ts` and `ipc/index.ts` for new features. Extend `Config` and `HistoryEntry` types as needed.
- **Geolocation**: The app assumes external API calls for geolocation (not shown in code). Integrate with services like IP-API or MaxMind for real-world use.
- **Performance**: History trimming ensures `history.json` stays under `maxHistorySize` (default 10MB).
