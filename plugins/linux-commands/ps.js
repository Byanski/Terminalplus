const { execSync } = require('child_process');
try {
  const out = execSync('tasklist', { encoding: 'utf8' });
  console.log(out.trim());
} catch (e) { console.error('Failed to get processes'); }