const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf-8');
code = code.replace(/const details = res\.changes\.map\(c => -  \+ c\)\.join\('\\n'\);/, "const details = res.changes.map(c => '- ' + c).join('\\n');");
fs.writeFileSync('client/src/pages/AdminDashboard.jsx', code, 'utf-8');
console.log('Fixed quotes!');
