const fs = require('fs');
let code = fs.readFileSync('server/controllers/meta.controller.js', 'utf-8');

code = code.replace(
  /const updatedUser = await prisma\.user\.update\(\{[\s]*where: \{ id: user\.id \},[\s]*data: \{ caterNew: true, caterRenewal: true, caterRetirement: true \},[\s]*include: \{ counter: true \}[\s]*\}\);[\s]*socketConfig\.getIo\(\)\.emit\('userUpdated', updatedUser\);/g,
  "const updatedUser = await prisma.user.update({\n            where: { id: user.id },\n            data: { caterNew: true, caterRenewal: true, caterRetirement: true },\n            include: { counter: true }\n          });\n          changes.push(Reset **\** to cater all services (Peace Mode).);\n          socketConfig.getIo().emit('userUpdated', updatedUser);"
);

fs.writeFileSync('server/controllers/meta.controller.js', code, 'utf-8');
console.log('Done peace mode!');
