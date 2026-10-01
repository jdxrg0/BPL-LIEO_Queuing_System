const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Find double `});` and replace with single
content = content.replace(/\}\);\r?\n\}\);\r?\n\r?\n\/\/ Start interval/, '});\n\n// Start interval');
fs.writeFileSync('server.js', content);
console.log('Fixed syntax error in server.js');
