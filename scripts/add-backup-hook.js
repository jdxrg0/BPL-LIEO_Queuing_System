const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

if (!content.includes('dbBackup')) {
  const initBackup = `
const { initAutomatedBackups } = require('./server/utils/dbBackup');
initAutomatedBackups();
`;
  content = content.replace("async function startServer() {", initBackup + "\nasync function startServer() {");
  fs.writeFileSync('server.js', content);
  console.log('Automated backups added to server.js');
}
