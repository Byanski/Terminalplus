const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: cat <file>'); process.exit(1); }
args.forEach(f => {
  try { console.log(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(e.message); }
});