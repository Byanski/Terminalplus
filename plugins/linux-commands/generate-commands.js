const fs = require('fs');
const path = require('path');

const pluginDir = 'C:\\Users\\Cameron\\Documents\\custom-terminal\\plugins\\linux-commands';

const commands = {
  sudo: `const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: sudo <command>'); process.exit(1); }
const cmd = args.join(' ');
// We just wrap it in cmd.exe /c seamlessly
spawnSync('cmd.exe', ['/c', cmd], { stdio: 'inherit' });`,
  cp: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: cp <source> <dest>'); process.exit(1); }
try { fs.cpSync(args[0], args[1], { recursive: true }); } catch (e) { console.error(e.message); }`,
  touch: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: touch <file>'); process.exit(1); }
try {
  const time = new Date();
  args.forEach(f => {
    try { fs.utimesSync(f, time, time); } catch (e) { fs.closeSync(fs.openSync(f, 'w')); }
  });
} catch (e) { console.error(e.message); }`,
  man: `const args = process.argv.slice(2);
if (args.length === 0) { console.error('What manual page do you want?'); process.exit(1); }
console.log('No manual entry for ' + args[0] + ' on Windows Terminal+');`,
  sort: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: sort <file>'); process.exit(1); }
try {
  const content = fs.readFileSync(args[0], 'utf8');
  console.log(content.split('\\n').sort().join('\\n'));
} catch (e) { console.error(e.message); }`,
  mv: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: mv <source> <dest>'); process.exit(1); }
try { fs.renameSync(args[0], args[1]); } catch (e) { console.error(e.message); }`,
  ln: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: ln [-s] <target> <link>'); process.exit(1); }
try {
  if (args[0] === '-s') fs.symlinkSync(args[1], args[2]);
  else fs.linkSync(args[0], args[1]);
} catch (e) { console.error(e.message); }`,
  cal: `console.log('      ' + new Date().toLocaleString('en-us', { month: 'long', year: 'numeric' }));
console.log('Su Mo Tu We Th Fr Sa');
const d = new Date();
const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
let out = '   '.repeat(first);
for (let i = 1; i <= days; i++) {
  out += i.toString().padStart(2, ' ') + ' ';
  if ((i + first) % 7 === 0) out += '\\n';
}
console.log(out);`,
  rm: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: rm [-r] <file>'); process.exit(1); }
const recursive = args.includes('-r') || args.includes('-rf');
const files = args.filter(a => !a.startsWith('-'));
files.forEach(f => {
  try { fs.rmSync(f, { recursive, force: true }); } catch (e) { console.error(e.message); }
});`,
  cat: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: cat <file>'); process.exit(1); }
args.forEach(f => {
  try { console.log(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(e.message); }
});`,
  whereis: `const { execSync } = require('child_process');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: whereis <command>'); process.exit(1); }
try {
  const out = execSync('where ' + args[0], { encoding: 'utf8' });
  console.log(args[0] + ':', out.trim().replace(/\\n/g, ' '));
} catch (e) { console.log(args[0] + ':'); }`,
  uname: `const os = require('os');
const args = process.argv.slice(2);
if (args.includes('-a')) console.log(os.type() + ' ' + os.hostname() + ' ' + os.release() + ' ' + os.arch());
else console.log(os.type());`,
  clear: `process.stdout.write('\\x1Bc');`,
  wget: `const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: wget <url>'); process.exit(1); }
const url = args[0];
const dest = path.basename(new URL(url).pathname) || 'index.html';
const file = fs.createWriteStream(dest);
const client = url.startsWith('https') ? https : http;
client.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => { file.close(); console.log('Saved to ' + dest); });
}).on('error', (err) => { fs.unlink(dest); console.error(err.message); });`,
  df: `const { execSync } = require('child_process');
try {
  const out = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
  console.log(out.trim());
} catch (e) { console.error('Failed to get disk space'); }`,
  locate: `console.log('locate is not indexed on this system. Use dir /s or File Explorer.');`,
  ps: `const { execSync } = require('child_process');
try {
  const out = execSync('tasklist', { encoding: 'utf8' });
  console.log(out.trim());
} catch (e) { console.error('Failed to get processes'); }`,
  whoami: `const os = require('os');
console.log(os.userInfo().username);`,
  wc: `const fs = require('fs');
const args = process.argv.slice(2);
if (args.length === 0) { console.error('usage: wc <file>'); process.exit(1); }
try {
  const content = fs.readFileSync(args[0], 'utf8');
  const lines = content.split('\\n').length;
  const words = content.split(/\\s+/).filter(w => w.length > 0).length;
  const bytes = Buffer.byteLength(content, 'utf8');
  console.log(\`\${lines} \${words} \${bytes} \${args[0]}\`);
} catch (e) { console.error(e.message); }`
};

for (const [cmd, code] of Object.entries(commands)) {
  fs.writeFileSync(path.join(pluginDir, cmd + '.js'), code);
}
console.log('Generated commands.');
