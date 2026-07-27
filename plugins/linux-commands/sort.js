const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: sort <file>'); process.exit(1); }
try {
  const content = fs.readFileSync(args[0], 'utf8');
  console.log(content.split('\n').sort().join('\n'));
} catch (e) { console.error(e.message); }