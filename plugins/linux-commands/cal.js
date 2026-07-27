console.log('      ' + new Date().toLocaleString('en-us', { month: 'long', year: 'numeric' }));
console.log('Su Mo Tu We Th Fr Sa');
const d = new Date();
const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
let out = '   '.repeat(first);
for (let i = 1; i <= days; i++) {
  out += i.toString().padStart(2, ' ') + ' ';
  if ((i + first) % 7 === 0) out += '\n';
}
console.log(out);