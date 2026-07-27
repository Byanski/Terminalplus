/**
 * grep - Search text for patterns
 * 
 * Usage: grep "search term" filename.txt
 */
const fs = require('fs');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: grep <pattern> <file>");
  process.exit(1);
}

const pattern = args[0];
const filePath = args[1];

try {
  // Read the file as a string
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find lines that include the pattern
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      // Highlight the match in red
      const highlighted = lines[i].split(pattern).join(`\x1b[31m${pattern}\x1b[0m`);
      console.log(highlighted);
    }
  }
} catch (err) {
  console.error("grep error:", err.message);
}
