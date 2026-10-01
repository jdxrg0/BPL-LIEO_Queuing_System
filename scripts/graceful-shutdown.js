const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const gracefulShutdown = `
// --- Graceful Shutdown ---
let isShuttingDown = false;

const cleanup = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\\n[Graceful Shutdown] Received kill signal, shutting down safely...');
  
  // Close socket.io connections
  if (io) {
    io.close(() => {
      console.log('[Graceful Shutdown] Socket.io closed.');
    });
  }

  // Stop accepting new HTTP requests
  server.close(async () => {
    console.log('[Graceful Shutdown] HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('[Graceful Shutdown] Database disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('[Graceful Shutdown] Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('[Graceful Shutdown] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
`;

if (!content.includes('SIGTERM')) {
  content = content.replace("module.exports = { app, server, io };", gracefulShutdown + "\nmodule.exports = { app, server, io };");
  fs.writeFileSync('server.js', content);
  console.log('Graceful shutdown added to server.js');
}
