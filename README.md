# Terminal+

Welcome to **Terminal+**, a highly customizable, glassmorphic terminal application built on Electron and React. Designed for aesthetics and extensibility, Terminal+ gives you a beautiful command-line experience with powerful modular plugin capabilities.

## ✨ Features

- **Glassmorphic Design**: A sleek, modern aesthetic with customizable background images, tint colors, and adjustable transparency that affects the entire application.
- **Custom Font Uploads**: Upload your own fonts directly from the settings panel. Fonts are persisted in local storage and instantly applied to your terminal environment.
- **Native Plugin Architecture**: Terminal+ supports two types of plugins to completely customize your workflow:
  - **Backend CLI Plugins**: Create native command-line wrappers (e.g., Linux aliases) that get automatically injected into the terminal's `PATH`.
  - **Frontend UI Plugins**: Inject React-context UI scripts directly into the terminal interface to add custom widgets, monitors, and tools.

## 🚀 Getting Started

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the Dev Server:**
   ```bash
   npm run dev
   ```
   *This uses `concurrently` to boot up the Vite React server alongside the Electron TypeScript compiler.*

### Building the Executable

Terminal+ uses GitHub Actions to automatically build a Windows `.exe` installer. 
Whenever you push to the `main` branch, the `release.yml` workflow will trigger `electron-builder` and attach the `.exe` as an artifact to the GitHub Action run.

If you want to build locally:
```bash
npm run build
npm run dist
```

## 🧩 Plugins Guide

All plugins live in the `plugins/` directory. Each plugin must have a `plugin.json` manifest.

### Example: Backend CLI Plugin (Linux Commands)
By defining `commands` in your manifest, Terminal+ will generate native `.cmd`/`.ps1` wrappers and inject them into your active shell!
```json
{
  "name": "Linux Commands",
  "commands": {
    "ls": "ls.js",
    "grep": "grep.js"
  }
}
```

### Example: Frontend UI Plugin (System Monitor)
By defining a `renderer` script, your plugin executes directly in the React frontend with full Node.js `os` integration.
```json
{
  "name": "System Monitor",
  "renderer": "ui.js"
}
```
*Your `ui.js` script must export a `mount(container)` and `unmount()` function to hook into the terminal's top bar.*

---

**Built with ❤️ using React, Electron, Vite, and xterm.js.**
