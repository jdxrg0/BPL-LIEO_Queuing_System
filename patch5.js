const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf-8');
code = code.replace(/res\.changes\.map\(c => \[^$]*\$\{c\}\\)/g, 'res.changes.map(c => - \)');
fs.writeFileSync('client/src/pages/AdminDashboard.jsx', code, 'utf-8');
console.log('Fixed bullet!');
