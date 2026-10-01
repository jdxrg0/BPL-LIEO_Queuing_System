const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf-8');

code = code.replace(/const onPrintReport = \(\) => .*?\n/g, '');
code = code.replace(/const onPrintTickets = \(\) => .*?\n/g, '');
code = code.replace(/const onAutoBalance = \(\) => \{[\s\S]*?\}\;\s*\n/g, '');

code = code.replace(/window\.addEventListener\('trigger-print-report'.*?\n/g, '');
code = code.replace(/window\.doPrintReport = .*?\n/g, '');
code = code.replace(/window\.addEventListener\('trigger-print-tickets'.*?\n/g, '');
code = code.replace(/window\.doPrintTickets = .*?\n/g, '');
code = code.addEventListener = code.replace(/window\.addEventListener\('trigger-auto-balance'.*?\n/g, '');

code = code.replace(/window\.removeEventListener\('trigger-print-report'.*?\n/g, '');
code = code.replace(/delete window\.doPrintReport.*?\n/g, '');
code = code.replace(/window\.removeEventListener\('trigger-print-tickets'.*?\n/g, '');
code = code.replace(/delete window\.doPrintTickets.*?\n/g, '');
code = code.replace(/window\.removeEventListener\('trigger-auto-balance'.*?\n/g, '');

fs.writeFileSync('client/src/pages/AdminDashboard.jsx', code, 'utf-8');
console.log('Cleaned AdminDashboard!');
