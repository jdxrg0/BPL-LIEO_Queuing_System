const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf-8');
code = code.replace(/const onPrintReport = \(\) => window\.open\(\/print-stats\?startDate=\&endDate=\&year=\, '_blank'\);\r?\n    window\.doPrintReport = onPrintReport;/, "const onPrintReport = () => window.open(\\\/print-stats?startDate=\\$\\{trendStart\\}&endDate=\\$\\{trendEnd\\}&year=\\$\\{filterYear\\}\\\, '_blank');\\n    window.doPrintReport = onPrintReport;");
fs.writeFileSync('client/src/pages/AdminDashboard.jsx', code, 'utf-8');
console.log('Fixed Print Report syntax!');
