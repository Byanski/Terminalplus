const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: ln [-s] <target> <link>'); process.exit(1); }
try {
  if (args[0] === '-s') fs.symlinkSync(args[1], args[2]);
  else fs.linkSync(args[0], args[1]);
} catch (e) { console.error(e.message); }