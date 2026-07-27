const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: cp <source> <dest>'); process.exit(1); }
try { fs.cpSync(args[0], args[1], { recursive: true }); } catch (e) { console.error(e.message); }