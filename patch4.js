const fs = require('fs');
let code = fs.readFileSync('server/controllers/meta.controller.js', 'utf-8');
code = code.replace(/changes\.push\(Reset \*\*\*\* to cater all services \(Peace Mode\)\.\);/g, "changes.push(`Reset **${user.name}** to cater all services (Peace Mode).`);");
code = code.replace(/changes\.push\(Assigned \*\*\*\* to cater: \);/g, "changes.push(`Assigned **${currentUser.name}** to cater: ${catering.join(', ')}`);");
fs.writeFileSync('server/controllers/meta.controller.js', code, 'utf-8');
console.log('Fixed interpolation!');
