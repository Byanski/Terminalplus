const { execSync } = require('child_process');
try {
  const out = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
  console.log(out.trim());
} catch (e) { console.error('Failed to get disk space'); }