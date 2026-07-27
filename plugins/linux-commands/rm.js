const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: rm [-r] <file>'); process.exit(1); }
const recursive = args.includes('-r') || args.includes('-rf');
const files = args.filter(a => !a.startsWith('-'));
files.forEach(f => {
  try { fs.rmSync(f, { recursive, force: true }); } catch (e) { console.error(e.message); }
});