/**
 * ls - List directory contents
 * 
 * This script is executed whenever the user types 'ls' in the terminal.
 * It uses Node's built in 'fs' module to read the current directory
 * and print out the files and folders.
 */
const fs = require('fs');
const path = require('path');

// process.cwd() gives us the directory where the user ran the command!
const currentDir = process.cwd();
const args = process.argv.slice(2);
const showAll = args.includes('-a'); // basic support for 'ls -a'

try {
  // Read all files in the current directory
  const files = fs.readdirSync(currentDir);
  
  const output = files
    // Filter out hidden files unless -a was passed
    .filter(file => showAll || !file.startsWith('.'))
    .map(file => {
      // Basic formatting: Add a slash for directories to make them obvious
      try {
        const stat = fs.statSync(path.join(currentDir, file));
        return stat.isDirectory() ? `\x1b[36m${file}/\x1b[0m` : file;
      } catch (e) {
        return file;
      }
    });

  // Print them out! The terminal will capture this standard output
  console.log(output.join('  '));
} catch (err) {
  console.error("Error reading directory:", err.message);
}
