const fs = require('fs');
let code = fs.readFileSync('client/src/components/Layout/Layout.jsx', 'utf-8');

code = code.replace(
  /const \[isSidebarCollapsed, setIsSidebarCollapsed\] = useState\(\(\) => \{/,
  "const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);\n  const [popupMessage, setPopupMessage] = useState(null);\n  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {"
);

code = code.replace(
  /onClick=\{\(\) => \{ if \(window\.doPrintReport\) window\.doPrintReport\(\); else window\.dispatchEvent\(new Event\('trigger-print-report'\)\); \}\}/,
  "onClick={() => {\n                  const today = new Date();\n                  const start = new Date(today.getFullYear(), today.getMonth(), 1);\n                  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);\n                  const pad = n => n.toString().padStart(2, '0');\n                  const sStr = ${start.getFullYear()}--;\n                  const eStr = ${end.getFullYear()}--;\n                  window.open(/print-stats?startDate=&endDate=&year=, '_blank');\n                }}"
);

code = code.replace(
  /onClick=\{\(\) => \{ if \(window\.doPrintTickets\) window\.doPrintTickets\(\); else window\.dispatchEvent\(new Event\('trigger-print-tickets'\)\); \}\}/,
  "onClick={() => setIsPrintModalOpen(true)}"
);

code = code.replace(
  /onClick=\{\(\) => window\.dispatchEvent\(new Event\('trigger-auto-balance'\)\)\}/,
  "onClick={() => {\n                  api.autoBalanceCounters().then(res => {\n                    if (res.changes && res.changes.length > 0) {\n                      const details = res.changes.map(c => '- ' + c).join('\\n');\n                      setPopupMessage({ title: 'Auto-Balance Report', message: res.message + '\\n\\n' + details, type: 'success' });\n                    } else {\n                      setPopupMessage({ title: 'Success', message: res.message, type: 'success' });\n                    }\n                  }).catch(() => setPopupMessage({ title: 'Error', message: 'Failed to auto-balance counters.', type: 'error' }));\n                }}"
);

code = code.replace(
  /<SettingsModal/g,
  "{user?.role === 'ADMIN' && <PrintTicketsModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} />}\n      <GlobalPopup popupMessage={popupMessage} onClose={() => setPopupMessage(null)} />\n      <SettingsModal"
);

fs.writeFileSync('client/src/components/Layout/Layout.jsx', code, 'utf-8');
console.log('Patched Layout!');
