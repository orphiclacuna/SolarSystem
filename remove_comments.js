const fs = require('fs');
const path = require('path');

// Path to the main.js file
const filePath = path.join(__dirname, 'src', 'main.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove single-line comments (anything after // on a line)
content = content.replace(/\/\/.*$/gm, '');

// Clean up any empty lines caused by comment removal
content = content.replace(/^\s*[\r\n]/gm, '');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('All comments have been removed from main.js');
