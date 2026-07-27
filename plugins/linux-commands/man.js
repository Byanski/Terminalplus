const args = process.argv.slice(2);
if (args.length === 0) { console.error('What manual page do you want?'); process.exit(1); }
console.log('No manual entry for ' + args[0] + ' on Windows Terminal+');