const fs = require('fs');
let code = fs.readFileSync('client/src/components/Layout/Layout.jsx', 'utf-8');

code = code.replace(
  /onClick=\{\(\) => \{\n                  const today = new Date\(\);\n                  const start = new Date\(today\.getFullYear\(\), today\.getMonth\(\), 1\);\n                  const end = new Date\(today\.getFullYear\(\), today\.getMonth\(\) \+ 1, 0\);\n                  const pad = n => n\.toString\(\)\.padStart\(2, '0'\);\n                  const sStr = --;\n                  const eStr = --;\n                  window\.open\(\/print-stats\?startDate=&endDate=&year=, '_blank'\);\n                \}\}/,
  "onClick={() => {\n                  const today = new Date();\n                  const start = new Date(today.getFullYear(), today.getMonth(), 1);\n                  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);\n                  const pad = n => n.toString().padStart(2, '0');\n                  const sStr = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`;\n                  const eStr = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`;\n                  window.open(`/print-stats?startDate=${sStr}&endDate=${eStr}&year=${today.getFullYear()}`, '_blank');\n                }}"
);

fs.writeFileSync('client/src/components/Layout/Layout.jsx', code, 'utf-8');
console.log('Fixed Layout syntax!');
