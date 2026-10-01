const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf-8');

// Remove from JSX
code = code.replace(/<PrintTicketsModal[\s\S]*?\/>/, '');

// Remove listeners and functions
code = code.replace(/const onPrintReport = \(\) => .*?\r?\n/, '');
code = code.replace(/const onPrintTickets = \(\) => .*?\r?\n/, '');
code = code.replace(/const onAutoBalance = \(\) => \{[\s\S]*?\}\;\s*\r?\n/, '');

code = code.replace(/window\.addEventListener\('trigger-print-report'.*?\r?\n/, '');
code = code.replace(/window\.doPrintReport = .*?\r?\n/, '');
code = code.replace(/window\.addEventListener\('trigger-print-tickets'.*?\r?\n/, '');
code = code.replace(/window\.doPrintTickets = .*?\r?\n/, '');
code = code.replace(/window\.addEventListener\('trigger-auto-balance'.*?\r?\n/, '');

code = code.replace(/window\.removeEventListener\('trigger-print-report'.*?\r?\n/, '');
code = code.replace(/delete window\.doPrintReport.*?\r?\n/, '');
code = code.replace(/window\.removeEventListener\('trigger-print-tickets'.*?\r?\n/, '');
code = code.replace(/delete window\.doPrintTickets.*?\r?\n/, '');
code = code.replace(/window\.removeEventListener\('trigger-auto-balance'.*?\r?\n/, '');

fs.writeFileSync('client/src/pages/AdminDashboard.jsx', code, 'utf-8');
console.log('Cleaned AdminDashboard properly!');
