const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: touch <file>'); process.exit(1); }
try {
  const time = new Date();
  args.forEach(f => {
    try { fs.utimesSync(f, time, time); } catch (e) { fs.closeSync(fs.openSync(f, 'w')); }
  });
} catch (e) { console.error(e.message); }