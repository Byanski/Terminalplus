const os = require('os');
const args = process.argv.slice(2);
if (args.includes('-a')) console.log(os.type() + ' ' + os.hostname() + ' ' + os.release() + ' ' + os.arch());
else console.log(os.type());