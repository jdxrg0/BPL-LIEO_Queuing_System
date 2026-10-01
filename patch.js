const fs = require('fs');
let code = fs.readFileSync('server/controllers/meta.controller.js', 'utf-8');

code = code.replace(
  '            const updatedUser = await prisma.user.update({\n' +
  '              where: { id: user.id },\n' +
  '              data: { caterNew: true, caterRenewal: true, caterRetirement: true },\n' +
  '              include: { counter: true }\n' +
  '            });\n' +
  '            socketConfig.getIo().emit(\'userUpdated\', updatedUser);',
  '            const updatedUser = await prisma.user.update({\n' +
  '              where: { id: user.id },\n' +
  '              data: { caterNew: true, caterRenewal: true, caterRetirement: true },\n' +
  '              include: { counter: true }\n' +
  '            });\n' +
  '            changes.push(Reset \\\\\\ to cater all services (Peace Mode).);\n' +
  '            socketConfig.getIo().emit(\'userUpdated\', updatedUser);'
);

code = code.replace(
  '            const updatedUser = await prisma.user.update({\n' +
  '              where: { id: assignment.id },\n' +
  '              data: {\n' +
  '                caterNew: assignment.caterNew,\n' +
  '                caterRenewal: assignment.caterRenewal,\n' +
  '                caterRetirement: assignment.caterRetirement\n' +
  '              },\n' +
  '              include: { counter: true }\n' +
  '            });\n' +
  '            socketConfig.getIo().emit(\'userUpdated\', updatedUser);',
  '            const updatedUser = await prisma.user.update({\n' +
  '              where: { id: assignment.id },\n' +
  '              data: {\n' +
  '                caterNew: assignment.caterNew,\n' +
  '                caterRenewal: assignment.caterRenewal,\n' +
  '                caterRetirement: assignment.caterRetirement\n' +
  '              },\n' +
  '              include: { counter: true }\n' +
  '            });\n' +
  '            let catering = [];\n' +
  '            if (assignment.caterNew) catering.push(\'New\');\n' +
  '            if (assignment.caterRenewal) catering.push(\'Renewal\');\n' +
  '            if (assignment.caterRetirement) catering.push(\'Retirement\');\n' +
  '            changes.push(Assigned \\\\\\ to cater: \\);\n' +
  '            socketConfig.getIo().emit(\'userUpdated\', updatedUser);'
);

fs.writeFileSync('server/controllers/meta.controller.js', code, 'utf-8');
console.log('Done!');
