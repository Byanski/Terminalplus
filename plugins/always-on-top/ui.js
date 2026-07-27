const toggleState = { isTop: false };

module.exports = {
  mount: () => {
    const titlebar = document.querySelector('.titlebar');
    if (!titlebar) return;
    
    // Create custom menu element
    const menu = document.createElement('div');
    menu.id = 'aot-context-menu';
    menu.style.position = 'fixed';
    menu.style.display = 'none';
    menu.style.background = 'rgba(25, 25, 30, 0.95)';
    menu.style.backdropFilter = 'blur(10px)';
    menu.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    menu.style.padding = '8px 12px';
    menu.style.borderRadius = '6px';
    menu.style.cursor = 'pointer';
    menu.style.zIndex = '99999';
    menu.style.color = '#fff';
    menu.style.fontFamily = 'monospace';
    menu.style.fontSize = '12px';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    menu.innerText = 'Enable Always on Top';
    
    // Hover effects
    menu.onmouseenter = () => menu.style.background = 'rgba(40, 40, 45, 0.95)';
    menu.onmouseleave = () => menu.style.background = 'rgba(25, 25, 30, 0.95)';
    
    document.body.appendChild(menu);

    menu.onclick = () => {
      toggleState.isTop = !toggleState.isTop;
      window.electronAPI.setAlwaysOnTop(toggleState.isTop);
      menu.style.display = 'none';
      menu.innerText = toggleState.isTop ? 'Disable Always on Top' : 'Enable Always on Top';
    };

    const hideMenu = () => {
      menu.style.display = 'none';
    };
    
    document.addEventListener('click', hideMenu);

    const onContextMenu = (e) => {
      e.preventDefault();
      menu.style.left = e.pageX + 'px';
      menu.style.top = e.pageY + 'px';
      menu.style.display = 'block';
    };

    titlebar.addEventListener('contextmenu', onContextMenu);

    // Store cleanup function for unmount
    this._cleanup = () => {
      titlebar.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('click', hideMenu);
      menu.remove();
    };
  },
  
  unmount: () => {
    if (this._cleanup) this._cleanup();
    
    // Reset state when plugin is disabled
    toggleState.isTop = false;
    window.electronAPI.setAlwaysOnTop(false);
  }
};
