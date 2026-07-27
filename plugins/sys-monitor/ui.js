/**
 * System Monitor Plugin
 * 
 * This plugin runs directly in the terminal's React frontend context.
 * Because the terminal allows Node Integration, we can require native Node
 * modules like 'os' right here in the UI script!
 */
const os = require('os');

let intervalId = null;

// Helper to get CPU load across all cores
function getCpuInfo() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

let lastCpuInfo = getCpuInfo();

module.exports = {
  // mount() is called by the terminal when the plugin is enabled
  mount: (container) => {
    if (!container) return;

    // Create our UI element
    const monitorDiv = document.createElement('div');
    monitorDiv.id = 'sys-monitor-widget';
    monitorDiv.style.display = 'flex';
    monitorDiv.style.gap = '15px';
    container.appendChild(monitorDiv);

    const updateStats = () => {
      // 1. Calculate CPU Usage %
      const currentCpuInfo = getCpuInfo();
      const idleDiff = currentCpuInfo.idle - lastCpuInfo.idle;
      const totalDiff = currentCpuInfo.total - lastCpuInfo.total;
      
      // Prevent division by zero on first tick
      const cpuUsage = totalDiff === 0 ? 0 : 100 - ~~(100 * idleDiff / totalDiff);
      lastCpuInfo = currentCpuInfo;

      // 2. Calculate RAM Usage (GB)
      const totalRam = os.totalmem() / (1024 ** 3);
      const freeRam = os.freemem() / (1024 ** 3);
      const usedRam = totalRam - freeRam;

      // 3. Update the UI
      monitorDiv.innerHTML = `
        <div>CPU: ${cpuUsage}%</div>
        <div>RAM: ${usedRam.toFixed(1)}GB / ${totalRam.toFixed(1)}GB</div>
      `;
    };

    // Update immediately, then every second
    updateStats();
    intervalId = setInterval(updateStats, 1000);
  },

  // unmount() is called when the plugin is disabled or the app cleans up
  unmount: () => {
    if (intervalId) clearInterval(intervalId);
    const widget = document.getElementById('sys-monitor-widget');
    if (widget) {
      widget.remove();
    }
  }
};
