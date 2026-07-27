const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: sudo <command>'); process.exit(1); }
const cmd = args.join(' ');
// We just wrap it in cmd.exe /c seamlessly
spawnSync('cmd.exe', ['/c', cmd], { stdio: 'inherit' });