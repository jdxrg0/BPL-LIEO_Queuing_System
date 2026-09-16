require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Import configuration and routes
const socketConfig = require('./server/config/socket');
const authRoutes = require('./server/routes/auth.routes');
const userRoutes = require('./server/routes/user.routes');
const ticketRoutes = require('./server/routes/ticket.routes');
const statsRoutes = require('./server/routes/stats.routes');
const metaRoutes = require('./server/routes/meta.routes');
const { autoBalanceCounters } = require('./server/controllers/meta.controller');

// Import Security Middlewares
const { verifyToken } = require('./server/middlewares/auth.middleware');
const { apiLimiter } = require('./server/middlewares/rateLimit.middleware');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: '*' }
});
socketConfig.init(io);

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount Routes
// /api/login has its own specific rate limiter, so we mount it first
app.use('/api', authRoutes); 

// Apply global API rate limiter to all subsequent routes
app.use('/api', apiLimiter);

app.use('/api/users', verifyToken, userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/stats', verifyToken, statsRoutes);
app.use('/api', metaRoutes); // /api/services, /api/counters, /api/settings, /api/admin/...

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
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
