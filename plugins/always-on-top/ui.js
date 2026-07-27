const toggleState = { isTop: false };

module.exports = {
  mount: (container) => {
    if (!container) return;
    
    // Create custom pin button
    const pinBtn = document.createElement('div');
    pinBtn.id = 'aot-pin-btn';
    pinBtn.style.cursor = 'pointer';
    pinBtn.style.display = 'flex';
    pinBtn.style.alignItems = 'center';
    pinBtn.style.justifyContent = 'center';
    pinBtn.style.padding = '2px 6px';
    pinBtn.style.borderRadius = '4px';
    pinBtn.style.transition = 'all 0.2s';
    pinBtn.style.color = '#a0a0a5';
    // non-drag region to ensure clicks register
    pinBtn.style.setProperty('-webkit-app-region', 'no-drag');
    
    // SVG Pin Icon
    pinBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
    
    // Hover effects
    pinBtn.onmouseenter = () => pinBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    pinBtn.onmouseleave = () => pinBtn.style.background = 'transparent';
    
    container.appendChild(pinBtn);

    pinBtn.onclick = () => {
      toggleState.isTop = !toggleState.isTop;
      window.electronAPI.setAlwaysOnTop(toggleState.isTop);
      
      if (toggleState.isTop) {
        pinBtn.style.color = 'var(--accent)';
        pinBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      } else {
        pinBtn.style.color = '#a0a0a5';
        pinBtn.style.background = 'transparent';
      }
    };

    // Store cleanup function for unmount
    this._cleanup = () => {
      pinBtn.remove();
    };
  },
  
  unmount: () => {
    if (this._cleanup) this._cleanup();
    
    // Reset state when plugin is disabled
    toggleState.isTop = false;
    window.electronAPI.setAlwaysOnTop(false);
  }
};
