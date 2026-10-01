const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

if (!content.includes('process.on(\'uncaughtException\'')) {
  const handlers = `
// --- Robust Error Handling ---
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
});
`;
  content = content.replace("const app = express();", handlers + "\nconst app = express();");
  fs.writeFileSync('server.js', content);
  console.log('Added global error handlers to server.js');
}
