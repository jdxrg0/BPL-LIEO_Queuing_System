const fs = require('fs');
let code = fs.readFileSync('client/src/components/Layout/Layout.jsx', 'utf-8');

code = code.replace(
  /const \[isPrintModalOpen, setIsPrintModalOpen\] = useState\(false\);/,
  "const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);\n  const [printConfig, setPrintConfig] = useState({ type: 'N', startNumber: '1', quantity: 1, format: 'A4' });"
);

code = code.replace(
  /\{user\?\.role === 'ADMIN' && <PrintTicketsModal isOpen=\{isPrintModalOpen\} onClose=\{\(\) => setIsPrintModalOpen\(false\)\} \/>\}/,
  \{user?.role === 'ADMIN' && <PrintTicketsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        config={printConfig}
        onConfigChange={setPrintConfig}
        onGenerate={async () => {
          setIsPrintModalOpen(false);
          window.open(\\\/print-tickets?type=\\$\\{printConfig.type\\}&start=\\$\\{printConfig.startNumber\\}&qty=\\$\\{printConfig.quantity\\}&format=\\$\\{printConfig.format || 'A4'\\}\\\, '_blank');
          
          try {
            const servicesRes = await api.getServices();
            const services = servicesRes || [];
            const service = services.find(s => s.prefix === printConfig.type);
            
            if (service) {
              const tickets = [];
              const d = new Date();
              const dateStr = String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + String(d.getFullYear()).slice(-2);
              
              for (let i = 0; i < printConfig.quantity; i++) {
                const num = String(Number(printConfig.startNumber) + i).padStart(3, '0');
                tickets.push({
                  number: \\\\\$\\{printConfig.type\\}\\$\\{dateStr\\}\\$\\{num\\}\\\,
                  type: 'REGULAR',
                  status: 'WAITING',
                  serviceId: service.id
                });
              }
              await api.bulkGenerateTickets(tickets);
            }
          } catch (err) {
            console.error('Failed to sync bulk tickets to DB', err);
          }
        }}
      />}\
);

fs.writeFileSync('client/src/components/Layout/Layout.jsx', code, 'utf-8');
console.log('Added printConfig and handlers to Layout!');
