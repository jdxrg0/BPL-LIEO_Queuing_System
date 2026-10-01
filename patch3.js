const fs = require('fs');
let code = fs.readFileSync('server/controllers/meta.controller.js', 'utf-8');

code = code.replace(
  /const updatedUser = await prisma\.user\.update\(\{[\s]*where: \{ id: assignment\.id \},[\s]*data: \{[\s]*caterNew: assignment\.caterNew,[\s]*caterRenewal: assignment\.caterRenewal,[\s]*caterRetirement: assignment\.caterRetirement[\s]*\},[\s]*include: \{ counter: true \}[\s]*\}\);[\s]*socketConfig\.getIo\(\)\.emit\('userUpdated', updatedUser\);/g,
  "const updatedUser = await prisma.user.update({\n            where: { id: assignment.id },\n            data: {\n              caterNew: assignment.caterNew,\n              caterRenewal: assignment.caterRenewal,\n              caterRetirement: assignment.caterRetirement\n            },\n            include: { counter: true }\n          });\n          let catering = [];\n          if (assignment.caterNew) catering.push('New');\n          if (assignment.caterRenewal) catering.push('Renewal');\n          if (assignment.caterRetirement) catering.push('Retirement');\n          changes.push(Assigned **\** to cater: \);\n          socketConfig.getIo().emit('userUpdated', updatedUser);"
);

fs.writeFileSync('server/controllers/meta.controller.js', code, 'utf-8');
console.log('Done crunch mode!');
