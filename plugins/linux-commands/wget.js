const https = require('https');
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
}).on('error', (err) => { fs.unlink(dest); console.error(err.message); });