import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';
import * as pty from 'node-pty';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let ptyProcess: pty.IPty | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, 
      contextIsolation: true
    },
  });

  // Load Vite dev server in development, otherwise load the built index.html
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function spawnShell(shellName: string) {
  if (ptyProcess) {
    ptyProcess.kill();
  }

  const shell = shellName === 'powershell' 
    ? 'powershell.exe' 
    : process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'] || 'cmd.exe';

  const binDir = path.join(__dirname, '..', 'plugins', '.bin');
  const customEnv = { ...process.env };
  if (fs.existsSync(binDir)) {
    customEnv.PATH = `${binDir};${process.env.PATH || ''}`;
  }

  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || process.env.USERPROFILE,
    env: customEnv as Record<string, string>
  });

  ptyProcess.onData((data) => {
    mainWindow?.webContents.send('terminal.incData', data);
  });
}

const keystrokeInterceptors: ((key: string) => boolean | void)[] = [];

// NEW PLUGIN ARCHITECTURE
let pluginSettings: Record<string, boolean> = {};

function getPluginSettingsPath() {
  return path.join(__dirname, '..', 'plugins', 'settings.json');
}

function loadPluginSettings() {
  const settingsPath = getPluginSettingsPath();
  if (fs.existsSync(settingsPath)) {
    try {
      pluginSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {}
  }
}

function savePluginSettings() {
  const settingsPath = getPluginSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify(pluginSettings, null, 2));
}

function reloadPlugins() {
  const pluginsDir = path.join(__dirname, '..', 'plugins');
  const binDir = path.join(pluginsDir, '.bin');

  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir);

  // Clear existing wrappers
  const existingWrappers = fs.readdirSync(binDir);
  for (const w of existingWrappers) {
    fs.unlinkSync(path.join(binDir, w));
  }

  const dirs = fs.readdirSync(pluginsDir, { withFileTypes: true });
  for (const dir of dirs) {
    if (dir.isDirectory() && dir.name !== '.bin') {
      const pluginPath = path.join(pluginsDir, dir.name);
      const manifestPath = path.join(pluginPath, 'plugin.json');
      
      if (fs.existsSync(manifestPath)) {
        // Default to enabled if not explicitly disabled
        const isEnabled = pluginSettings[dir.name] !== false;
        
        if (isEnabled) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (manifest.commands) {
              for (const [cmd, script] of Object.entries(manifest.commands)) {
                // Generate .cmd wrapper
                const cmdWrapper = path.join(binDir, `${cmd}.cmd`);
                fs.writeFileSync(cmdWrapper, `@echo off\ncd /d "%cd%"\nnode "${path.join(pluginPath, script as string)}" %*\n`);
                
                // Generate .ps1 wrapper
                const ps1Wrapper = path.join(binDir, `${cmd}.ps1`);
                fs.writeFileSync(ps1Wrapper, `node "${path.join(pluginPath, script as string)}" $args\n`);
              }
            }
          } catch (e) {
            console.error(`Failed to load plugin ${dir.name}`, e);
          }
        }
      }
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  loadPluginSettings();
  reloadPlugins();
  // Shell will be spawned when React frontend sends app.switchShell on mount

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC listeners
ipcMain.on('terminal.keystroke', (event, key) => {
  let preventDefault = false;
  for (const interceptor of keystrokeInterceptors) {
    if (interceptor(key) === true) {
      preventDefault = true;
    }
  }
  if (!preventDefault) {
    ptyProcess?.write(key);
  }
});

ipcMain.on('terminal.resize', (event, cols, rows) => {
  try {
    ptyProcess?.resize(cols, rows);
  } catch (e) {
    console.error('Failed to resize pty', e);
  }
});

ipcMain.on('app.switchShell', (event, shellName) => {
  spawnShell(shellName);
});

// Plugin IPC endpoints
import { shell as electronShell } from 'electron';

ipcMain.handle('plugins.get', () => {
  const pluginsDir = path.join(__dirname, '..', 'plugins');
  if (!fs.existsSync(pluginsDir)) return [];
  
  const pluginsList = [];
  const dirs = fs.readdirSync(pluginsDir, { withFileTypes: true });
  for (const dir of dirs) {
    if (dir.isDirectory() && dir.name !== '.bin') {
      const pluginPath = path.join(pluginsDir, dir.name);
      const manifestPath = path.join(pluginPath, 'plugin.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          pluginsList.push({
            id: dir.name,
            name: manifest.name || dir.name,
            description: manifest.description || '',
            renderer: manifest.renderer,
            pluginPath: pluginPath,
            enabled: pluginSettings[dir.name] !== false
          });
        } catch (e) {}
      }
    }
  }
  return pluginsList;
});

ipcMain.handle('plugins.toggle', (event, pluginId, enabled) => {
  pluginSettings[pluginId] = enabled;
  savePluginSettings();
  reloadPlugins();
});

ipcMain.handle('plugins.openFolder', () => {
  const pluginsDir = path.join(__dirname, '..', 'plugins');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
  electronShell.openPath(pluginsDir);
});

ipcMain.on('app.switchShell', (event, shellName) => {
  spawnShell(shellName);
});

ipcMain.on('app.close', () => {
  app.quit();
});

ipcMain.on('app.minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('app.maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('app.setAlwaysOnTop', (event, flag) => {
  mainWindow?.setAlwaysOnTop(flag);
});
