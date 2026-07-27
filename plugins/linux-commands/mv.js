const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: mv <source> <dest>'); process.exit(1); }
try { fs.renameSync(args[0], args[1]); } catch (e) { console.error(e.message); }