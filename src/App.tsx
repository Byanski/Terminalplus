import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

// Declare the global window API provided by our preload script
declare global {
  interface Window {
    electronAPI: {
      onTerminalData: (callback: (data: string) => void) => void;
      sendTerminalKeystroke: (key: string) => void;
      resizeTerminal: (cols: number, rows: number) => void;
      switchShell: (shellName: string) => void;
      closeApp: () => void;
      minimizeApp: () => void;
      maximizeApp: () => void;
      setAlwaysOnTop: (flag: boolean) => void;
      getPlugins: () => Promise<any[]>;
      togglePlugin: (id: string, enabled: boolean) => Promise<void>;
      openPluginsFolder: () => Promise<void>;
      loadFrontendPlugin: (path: string, script: string) => void;
      unmountFrontendPlugin: (path: string, script: string) => void;
    };
  }
}

export default function App() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  interface CustomFont {
    name: string;
    dataUrl: string;
  }
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [pluginsList, setPluginsList] = useState<any[]>([]);
  const [opacity, setOpacity] = useState(0.85);
  const [bgColor, setBgColor] = useState('#121214');
  const [fgColor, setFgColor] = useState('#f0f0f0');
  const [shell, setShell] = useState('cmd');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Consolas, "Courier New", monospace');

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      allowTransparency: true,
      fontFamily: fontFamily,
      fontSize: fontSize,
      theme: {
        background: '#00000000',
        foreground: fgColor,
      }
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data) => {
      window.electronAPI.sendTerminalKeystroke(data);
    });

    window.electronAPI.onTerminalData((data) => {
      term.write(data);
    });

    const handleResize = () => {
      fitAddon.fit();
      window.electronAPI.resizeTerminal(term.cols, term.rows);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize to sync pty size
    setTimeout(() => {
      handleResize();
      // Only request the shell spawn after the frontend is fully ready and listening!
      window.electronAPI.switchShell('cmd');
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []); // Run once on mount

  // Load custom fonts on mount
  useEffect(() => {
    const savedFontsStr = localStorage.getItem('customFonts');
    if (savedFontsStr) {
      try {
        const fonts: CustomFont[] = JSON.parse(savedFontsStr);
        setCustomFonts(fonts);
        fonts.forEach(font => {
          const newStyle = document.createElement('style');
          newStyle.appendChild(document.createTextNode(`
            @font-face {
              font-family: '${font.name}';
              src: url("${font.dataUrl}");
            }
          `));
          document.head.appendChild(newStyle);
        });
      } catch (e) {
        console.error('Failed to load custom fonts', e);
      }
    }
  }, []);

  // Update theme when settings change
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = {
        background: '#00000000', // Hex transparent
        foreground: fgColor,
      };
      xtermRef.current.options.fontSize = fontSize;
      xtermRef.current.options.fontFamily = fontFamily;
      if (fitAddonRef.current) {
         fitAddonRef.current.fit();
         window.electronAPI.resizeTerminal(xtermRef.current.cols, xtermRef.current.rows);
      }
    }
  }, [fgColor, fontSize, fontFamily]);

  const handleShellChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShell = e.target.value;
    setShell(newShell);
    window.electronAPI.switchShell(newShell);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-opacity', opacity.toString());
    document.documentElement.style.setProperty('--root-bg-color', bgColor);
  }, [bgColor, opacity]);

  // Load custom background image on mount
  useEffect(() => {
    const savedBg = localStorage.getItem('customBackgroundImage');
    if (savedBg) {
      document.documentElement.style.setProperty('--root-bg-image', `url("${savedBg}")`);
    }
  }, []);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          document.documentElement.style.setProperty('--root-bg-image', `url("${dataUrl}")`);
          localStorage.setItem('customBackgroundImage', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBackground = () => {
    document.documentElement.style.setProperty('--root-bg-image', 'none');
    localStorage.removeItem('customBackgroundImage');
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          const newStyle = document.createElement('style');
          newStyle.appendChild(document.createTextNode(`
            @font-face {
              font-family: '${fontName}';
              src: url("${dataUrl}");
            }
          `));
          document.head.appendChild(newStyle);
          
          const newFont: CustomFont = { name: fontName, dataUrl };
          const newFonts = [...customFonts, newFont];
          setCustomFonts(newFonts);
          localStorage.setItem('customFonts', JSON.stringify(newFonts));
          
          setFontFamily(`'${fontName}', monospace`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const loadPluginsList = async () => {
    const list = await window.electronAPI.getPlugins();
    setPluginsList(list);
  };

  // Initial mount load plugins
  useEffect(() => {
    let isMounted = true;
    let loadedList: any[] = [];
    
    window.electronAPI.getPlugins().then(list => {
      if (!isMounted) return;
      
      setPluginsList(list);
      loadedList = list;
      list.forEach(plugin => {
        if (plugin.enabled && plugin.renderer) {
          window.electronAPI.loadFrontendPlugin(plugin.pluginPath, plugin.renderer);
        }
      });
    });
    
    return () => {
      isMounted = false;
      // Unmount all on cleanup
      loadedList.forEach(plugin => {
        if (plugin.enabled && plugin.renderer) {
          window.electronAPI.unmountFrontendPlugin(plugin.pluginPath, plugin.renderer);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (showPlugins) {
      loadPluginsList();
    }
  }, [showPlugins]);

  return (
    <>
      <div className="titlebar">
        <div className="titlebar-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 11 9 9 9-9"/><path d="M4 11V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/></svg>
          Terminal +
          <div id="plugin-topbar-area" style={{ display: 'flex', marginLeft: '20px', gap: '15px', color: '#a0a0a5', fontSize: '11px', fontFamily: 'monospace' }}></div>
        </div>
        <div className="titlebar-controls">
          <button title="Plugins" onClick={() => setShowPlugins(!showPlugins)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </button>
          <button title="Settings" onClick={() => setShowSettings(!showSettings)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <button title="Minimize" onClick={() => window.electronAPI.minimizeApp()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
          </button>
          <button title="Maximize" onClick={() => window.electronAPI.maximizeApp()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </button>
          <button title="Close" className="close-btn" onClick={() => window.electronAPI.closeApp()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
      
      <div className="terminal-container">
        <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {showSettings && (
        <>
          <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
          <div className="settings-overlay">
            <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Terminal Settings
          </h3>
          
          <div className="settings-row">
            <label>Shell Profile</label>
            <select value={shell} onChange={handleShellChange}>
              <option value="cmd">Command Prompt</option>
              <option value="powershell">PowerShell</option>
            </select>
          </div>

          <div className="settings-row">
            <label>Glass Transparency</label>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={opacity} 
              onChange={(e) => setOpacity(parseFloat(e.target.value))} 
            />
          </div>

          <div className="settings-row">
            <label>Background Tint</label>
            <input 
              type="color" 
              value={bgColor} 
              onChange={(e) => setBgColor(e.target.value)} 
            />
          </div>
          
          <div className="settings-row">
            <label>Text Color</label>
            <input 
              type="color" 
              value={fgColor} 
              onChange={(e) => setFgColor(e.target.value)} 
            />
          </div>

          <div className="settings-row">
            <label>Font Family</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ width: '130px' }}>
              <option value='Consolas, "Courier New", monospace'>Consolas</option>
              <option value='"Press Start 2P", monospace'>Retro Arcade</option>
              <option value='"VT323", monospace'>Hacker CRT</option>
              <option value='"Creepster", cursive'>Creepster</option>
              <option value='"Pacifico", cursive'>Pacifico (Cursive)</option>
              <option value='"Orbitron", sans-serif'>Sci-Fi Orbitron</option>
              {customFonts.map((font) => (
                <option key={font.name} value={`'${font.name}', monospace`}>* {font.name}</option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <label>Upload Font File</label>
            <input 
              type="file" 
              accept=".ttf,.woff,.woff2,.otf"
              onChange={handleFontUpload}
            />
          </div>
          
          <div className="settings-row">
            <label>Font Size (px)</label>
            <input 
              type="number" 
              min="10" max="32"
              value={fontSize} 
              onChange={(e) => setFontSize(parseInt(e.target.value) || 14)} 
              style={{ width: '50px', textAlign: 'center' }}
            />
          </div>

          <div className="settings-row">
            <label>Custom BG Image</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleBackgroundUpload}
                style={{ width: '130px' }}
              />
              <button onClick={resetBackground} style={{ background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', padding: '0 8px' }}>Reset</button>
            </div>
          </div>
        </div>
        </>
      )}

      {showPlugins && (
        <>
          <div className="settings-backdrop" onClick={() => setShowPlugins(false)} />
          <div className="settings-overlay" style={{ right: '50px', width: '380px' }}>
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Plugin Manager
            </h3>
            
            <p style={{ fontSize: '11px', color: '#999', marginBottom: '16px', lineHeight: '1.4' }}>
              Plugins wrap commands natively. Create a folder in the plugins directory with a <code>plugin.json</code>.
            </p>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              {pluginsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '12px' }}>
                  No plugins found.
                </div>
              ) : (
                pluginsList.map(plugin => (
                  <div key={plugin.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff', marginBottom: '4px' }}>{plugin.name}</div>
                      <div style={{ fontSize: '11px', color: '#aaa' }}>{plugin.description}</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '2px' }}>
                      <input 
                        type="checkbox" 
                        checked={plugin.enabled}
                        onChange={async (e) => {
                          const enabled = e.target.checked;
                          
                          // Optimistic UI update
                          setPluginsList(prev => prev.map(p => p.id === plugin.id ? { ...p, enabled } : p));
                          
                          // Explicitly handle Frontend Plugin Mount/Unmount
                          if (plugin.renderer) {
                            if (enabled) {
                              window.electronAPI.loadFrontendPlugin(plugin.pluginPath, plugin.renderer);
                            } else {
                              window.electronAPI.unmountFrontendPlugin(plugin.pluginPath, plugin.renderer);
                            }
                          }

                          await window.electronAPI.togglePlugin(plugin.id, enabled);
                          loadPluginsList(); // Sync backend state
                        }}
                        style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                      />
                    </label>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => window.electronAPI.openPluginsFolder()}
              style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Open Plugins Folder
            </button>
          </div>
        </>
      )}
    </>
  );
}
