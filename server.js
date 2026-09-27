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

const app = express();
const server = http.createServer(app);

// Allowed origins: Vite dev server and production CLIENT_URL
const allowedOrigins = ['http://localhost:5173'];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: allowedOrigins }
});
socketConfig.init(io);

// Global Middleware
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// Mount Routes
// /api/login has its own specific rate limiter, so we mount it first
app.use('/api', authRoutes); 

// Apply global API rate limiter to all subsequent routes
app.use('/api', apiLimiter);

app.use('/api/users', verifyToken, userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', metaRoutes); // /api/services, /api/counters, /api/settings, /api/admin/..., /api/stats/live-wait-times
app.use('/api/stats', verifyToken, statsRoutes);

// Socket.io Event Listeners
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start interval for auto-balancing counters (runs every 5 minutes)
setInterval(() => autoBalanceCounters(), 5 * 60 * 1000);

// Start Server
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Reset all users' online status on startup before accepting connections
  try {
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT 0;');
    } catch (e) {
      // Column already exists or cannot alter table
    }
    await prisma.user.updateMany({
      data: { isOnline: false }
    });
    console.log('Reset all user online status on startup');
  } catch (err) {
    console.warn('Could not reset user online status on startup:', err.message);
  }

  server.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    // Enable SQLite WAL for reads/writes to share the DB file with less lock contention
    try {
      await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
    } catch (err) {
      console.warn('Could not enable SQLite WAL mode:', err.message);
    }
    // Perform cloud sync catch up
    await catchUpSync(prisma);
    // Push branding (logo, title) to Firebase for the Vercel tracker
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings) await syncSettings(settings);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
