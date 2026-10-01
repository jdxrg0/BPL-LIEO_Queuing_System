const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf-8');
code = code.replace(/const \[isPrintModalOpen, setIsPrintModalOpen\] = useState\(false\);\r?\n/, '');
code = code.replace(/const \[printConfig, setPrintConfig\] = useState\(\{.*?\}\);\r?\n/, '');
fs.writeFileSync('client/src/pages/AdminDashboard.jsx', code, 'utf-8');
