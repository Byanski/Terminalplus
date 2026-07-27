const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: wc <file>'); process.exit(1); }
try {
  const content = fs.readFileSync(args[0], 'utf8');
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const bytes = Buffer.byteLength(content, 'utf8');
  console.log(`${lines} ${words} ${bytes} ${args[0]}`);
} catch (e) { console.error(e.message); }