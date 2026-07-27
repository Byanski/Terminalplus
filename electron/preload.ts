import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal.incData', (_event, data) => callback(data));
  },
  sendTerminalKeystroke: (key: string) => {
    ipcRenderer.send('terminal.keystroke', key);
  },
  resizeTerminal: (cols: number, rows: number) => {
    ipcRenderer.send('terminal.resize', cols, rows);
  },
  switchShell: (shellName: string) => {
    ipcRenderer.send('app.switchShell', shellName);
  },
  closeApp: () => {
    ipcRenderer.send('app.close');
  },
  minimizeApp: () => {
    ipcRenderer.send('app.minimize');
  },
  maximizeApp: () => {
    ipcRenderer.send('app.maximize');
  },
  getPlugins: () => ipcRenderer.invoke('plugins.get'),
  togglePlugin: (id: string, enabled: boolean) => ipcRenderer.invoke('plugins.toggle', id, enabled),
  openPluginsFolder: () => ipcRenderer.invoke('plugins.openFolder'),
  loadFrontendPlugin: (pluginPath: string, rendererScript: string) => {
    try {
      const p = require('path');
      const plugin = require(p.join(pluginPath, rendererScript));
      if (plugin.mount) {
        plugin.mount(document.getElementById('plugin-topbar-area'));
      }
    } catch(e) {
      console.error(e);
    }
  },
  unmountFrontendPlugin: (pluginPath: string, rendererScript: string) => {
    try {
      const p = require('path');
      // Delete from require cache so it can be reloaded
      const fullPath = p.join(pluginPath, rendererScript);
      const plugin = require(fullPath);
      if (plugin.unmount) {
        plugin.unmount();
      }
      delete require.cache[require.resolve(fullPath)];
    } catch(e) {
      console.error(e);
    }
  }
});
