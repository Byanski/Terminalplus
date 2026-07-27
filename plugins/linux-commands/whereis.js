const { execSync } = require('child_process');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: whereis <command>'); process.exit(1); }
try {
  const out = execSync('where ' + args[0], { encoding: 'utf8' });
  console.log(args[0] + ':', out.trim().replace(/\n/g, ' '));
} catch (e) { console.log(args[0] + ':'); }