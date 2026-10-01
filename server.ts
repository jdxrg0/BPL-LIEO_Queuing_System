const logger = require('./server/utils/logger');
export {};
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

// Import configuration and routes
const socketConfig = require('./server/config/socket');
const authRoutes = require('./server/routes/auth.routes');
const userRoutes = require('./server/routes/user.routes');
const ticketRoutes = require('./server/routes/ticket.routes');
const statsRoutes = require('./server/routes/stats.routes');
const metaRoutes = require('./server/routes/meta.routes');
const { autoBalanceCounters } = require('./server/controllers/meta.controller');
const { catchUpSync, syncSettings } = require('./server/services/cloudSync.service');
const prisma = require('./server/config/db');

// Import Security Middlewares
const { verifyToken } = require('./server/middlewares/auth.middleware');
const { apiLimiter } = require('./server/middlewares/rateLimit.middleware');

// --- Robust Error Handling ---
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL ERROR: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const server = http.createServer(app);

// Allowed origins: Vite dev server and production CLIENT_URL
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});
socketConfig.init(io);

// Global Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Mount Routes
// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date() });
  }
});

app.use('/api', authRoutes); 
app.use('/api', apiLimiter);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', metaRoutes);
app.use('/api/stats', verifyToken, statsRoutes);

// Swagger API Documentation
const { swaggerUi, specs } = require('./server/config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Global Error Handler (Must be placed AFTER all routes)
const errorHandler = require('./server/middlewares/error.middleware');
app.use(errorHandler);

// Track multi-tab presence
const activeSockets = new Map(); // userId -> Set of socket.ids

// Socket.io Event Listeners
io.on('connection', (socket: any) => {
  logger.info('Client connected:', socket.id);
  
  // Track userId when client identifies itself
  socket.on('identify', async (userId: string | number) => {
    if (!userId) return;
    const uidStr = String(userId);
    
    // If the socket was previously identified as a DIFFERENT user (e.g. they logged out and logged in as someone else without refreshing),
    // clean up the old user's socket track.
    if (socket.userId && socket.userId !== uidStr) {
      const oldUidStr = socket.userId;
      const oldSockets = activeSockets.get(oldUidStr);
      if (oldSockets) {
        oldSockets.delete(socket.id);
        if (oldSockets.size === 0) {
          activeSockets.delete(oldUidStr);
          try {
            await prisma.user.update({ where: { id: parseInt(oldUidStr) }, data: { isOnline: false } });
            io.emit('userOnlineStatus', { userId: parseInt(oldUidStr), isOnline: false });
          } catch(e) {}
        }
      }
    }

    socket.userId = uidStr;
    let sockets = activeSockets.get(uidStr);
    let isFirstConnection = false;
    
    if (!sockets) {
      sockets = new Set();
      activeSockets.set(uidStr, sockets);
      isFirstConnection = true;
    }
    sockets.add(socket.id);

    if (isFirstConnection) {
      try {
        await prisma.user.update({
          where: { id: parseInt(uidStr) },
          data: { isOnline: true }
        });
        io.emit('userOnlineStatus', { userId: parseInt(uidStr), isOnline: true });
      } catch(e) {
        logger.error('Error updating online status:', e);
      }
    }
  });

  socket.on('disconnect', async () => {
    logger.info('Client disconnected:', socket.id);
    if (socket.userId) {
      const uidStr = String(socket.userId);
      const sockets = activeSockets.get(uidStr);
      if (sockets) {
        sockets.delete(socket.id);
        
        if (sockets.size === 0) {
          activeSockets.delete(uidStr);
          try {
            await prisma.user.update({
              where: { id: parseInt(uidStr) },
              data: { isOnline: false }
            });
            io.emit('userOnlineStatus', { userId: parseInt(uidStr), isOnline: false });
          } catch(e) {
            logger.error('Error updating offline status:', e);
          }
        }
      }
    }
  });
});

// Start interval for auto-balancing counters (runs every 5 minutes)
setInterval(() => autoBalanceCounters(), 5 * 60 * 1000);

// Start Server
// Default port is 5000 — matches the Vite dev proxy (vite.config.js) and BAT launchers.
// Override by setting PORT= in your .env file.
const PORT = process.env.PORT || 5000;

const { initAutomatedBackups } = require('./server/utils/dbBackup');
initAutomatedBackups();

async function startServer() {
  // Reset all users' online status on startup before accepting connections
  try {
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT 0;');
    } catch (e) {}
    await prisma.user.updateMany({
      data: { isOnline: false }
    });
    logger.info('Reset all user online status on startup');
  } catch (err: any) {
    console.warn('Could not reset user online status on startup:', err.message);
  }

  server.listen(PORT, async () => {
    logger.info(`Server listening on port ${PORT}`);
    try {
      await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    } catch (err: any) {
      console.warn('Could not enable SQLite WAL mode:', err.message);
    }
    await catchUpSync(prisma);
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings) await syncSettings(settings);
  });
}

if (require.main === module) {
  startServer();
}

// --- Graceful Shutdown ---
let isShuttingDown = false;

const cleanup = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`\n[Graceful Shutdown] Received ${signal || 'kill signal'}, shutting down safely...`);
  
  if (io) {
    io.close(() => {
      logger.info('[Graceful Shutdown] Socket.io closed.');
    });
  }

  server.close(async () => {
    logger.info('[Graceful Shutdown] HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('[Graceful Shutdown] Database disconnected.');
      if (signal === 'SIGUSR2') {
        process.kill(process.pid, 'SIGUSR2');
      } else {
        process.exit(0);
      }
    } catch (err) {
      logger.error('[Graceful Shutdown] Error during database disconnect:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('[Graceful Shutdown] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGINT', () => cleanup('SIGINT'));
process.once('SIGUSR2', () => cleanup('SIGUSR2'));

module.exports = { app, server, io };

