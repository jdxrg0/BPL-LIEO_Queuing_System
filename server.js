const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ----- API ENDPOINTS -----

// 1. Auth (Simple login for demonstration)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ 
    where: { username },
    include: { counter: true } // Include assigned counter
  });
  
  // In production, compare hashed passwords!
  if (user && user.passwordHash === password) {
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId, counter: user.counter, caterNew: user.caterNew, caterRenewal: user.caterRenewal, caterRetirement: user.caterRetirement, profilePictureBase64: user.profilePictureBase64 });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Services & Counters
app.get('/api/services', async (req, res) => {
  const services = await prisma.service.findMany({ where: { isActive: true } });
  res.json(services);
});

app.get('/api/counters', async (req, res) => {
  const counters = await prisma.counter.findMany({ where: { isActive: true } });
  res.json(counters);
});

app.post('/api/counters', async (req, res) => {
  const { name } = req.body;
  const counter = await prisma.counter.create({
    data: { name, isActive: true }
  });
  res.json(counter);
});

// 2.5 Admin: User Management
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true, counterId: true, counter: true, caterNew: true, caterRenewal: true, caterRetirement: true, profilePictureBase64: true }
  });
  res.json(users);
});

app.get('/api/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { counter: true }
  });
  if (user) {
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId, counter: user.counter, caterNew: user.caterNew, caterRenewal: user.caterRenewal, caterRetirement: user.caterRetirement, profilePictureBase64: user.profilePictureBase64 });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, name, role, windowNumber, caterNew, caterRenewal, caterRetirement } = req.body;
  
  let finalCounterId = null;
  if (windowNumber) {
    const counterName = `Window ${windowNumber}`;
    let counter = await prisma.counter.findFirst({ where: { name: counterName } });
    if (!counter) {
      counter = await prisma.counter.create({ data: { name: counterName, isActive: true } });
    }
    finalCounterId = counter.id;
  }

  // Note: Storing plain text password for demo simplicity.
  // In production, ALWAYS hash passwords before saving (e.g. bcrypt).
  const user = await prisma.user.create({
    data: { 
      username, 
      passwordHash: password, // Named passwordHash in schema
      name, 
      role,
      counterId: finalCounterId,
      caterNew: caterNew !== undefined ? caterNew : true,
      caterRenewal: caterRenewal !== undefined ? caterRenewal : true,
      caterRetirement: caterRetirement !== undefined ? caterRetirement : true
    }
  });
  res.json({ id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId });
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { windowNumber, role, name, username, currentPassword, caterNew, caterRenewal, caterRetirement } = req.body;
  
  // Verify current password
  const userRecord = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!userRecord || userRecord.passwordHash !== currentPassword) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }

  let updateData = {};
  if (role) updateData.role = role;
  if (name) updateData.name = name;
  if (username) updateData.username = username;
  if (caterNew !== undefined) updateData.caterNew = caterNew;
  if (caterRenewal !== undefined) updateData.caterRenewal = caterRenewal;
  if (caterRetirement !== undefined) updateData.caterRetirement = caterRetirement;

  if (windowNumber !== undefined) {
    if (windowNumber) {
      const counterName = `Window ${windowNumber}`;
      let counter = await prisma.counter.findFirst({ where: { name: counterName } });
      if (!counter) {
        counter = await prisma.counter.create({ data: { name: counterName, isActive: true } });
      }
      updateData.counterId = counter.id;
    } else {
      updateData.counterId = null;
    }
  }
  
  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: { counter: true }
  });
  
  // Format user to omit passwordHash before broadcasting
  const updatedUser = { id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId, counter: user.counter, caterNew: user.caterNew, caterRenewal: user.caterRenewal, caterRetirement: user.caterRetirement };
  io.emit('userUpdated', updatedUser);
  
  res.json(updatedUser);
});

app.put('/api/users/:id/change-password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  const userRecord = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!userRecord || userRecord.passwordHash !== currentPassword) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { passwordHash: newPassword }
  });
  res.json({ success: true });
});

app.put('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { name, profilePictureBase64 } = req.body;

  try {
    const dataToUpdate = { name, profilePictureBase64 };

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      include: { counter: true }
    });

    const safeUser = { id: updatedUser.id, username: updatedUser.username, name: updatedUser.name, role: updatedUser.role, counterId: updatedUser.counterId, counter: updatedUser.counter, caterNew: updatedUser.caterNew, caterRenewal: updatedUser.caterRenewal, caterRetirement: updatedUser.caterRetirement, profilePictureBase64: updatedUser.profilePictureBase64 };
    
    // Broadcast user update so other sessions update seamlessly
    io.emit('userUpdated', safeUser);

    res.json(safeUser);
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const { resetKey, newPassword } = req.body;
  const SECRET_RESET_KEY = 'zM7XQ94LFBei6b7y3669';

  if (resetKey !== SECRET_RESET_KEY) {
    return res.status(401).json({ error: 'Invalid reset key' });
  }

  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { passwordHash: newPassword }
  });
  res.json({ success: true });
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  const userRecord = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!userRecord || userRecord.username !== username || userRecord.passwordHash !== password) {
    return res.status(401).json({ error: 'Incorrect username or password' });
  }

  // Detach User from any Tickets before deleting to prevent Foreign Key constraint errors
  await prisma.ticket.updateMany({
    where: { createdByUserId: parseInt(id) },
    data: { createdByUserId: null }
  });
  
  await prisma.ticket.updateMany({
    where: { servedByUserId: parseInt(id) },
    data: { servedByUserId: null }
  });

  await prisma.user.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// 2.6 Admin: Statistics
app.get('/api/stats', async (req, res) => {
  const { startDate, endDate, days } = req.query;
  const now = new Date();
  
  const queryYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();
  const isHistorical = queryYear !== now.getFullYear();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfYear = new Date(queryYear, 0, 1);
  const endOfYear = new Date(queryYear, 11, 31, 23, 59, 59);

  const [total, newApp, renewal, retirement] = await Promise.all([
    prisma.ticket.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfYear, lte: endOfYear } } }),
    prisma.ticket.count({ where: { status: 'COMPLETED', service: { prefix: 'NW' }, completedAt: { gte: startOfYear, lte: endOfYear } } }),
    prisma.ticket.count({ where: { status: 'COMPLETED', service: { prefix: 'RNW' }, completedAt: { gte: startOfYear, lte: endOfYear } } }),
    prisma.ticket.count({ where: { status: 'COMPLETED', service: { prefix: 'R' }, completedAt: { gte: startOfYear, lte: endOfYear } } })
  ]);
  const officeStats = { isHistorical, total, newApp, renewal, retirement, year: queryYear };

  const trend = [];
  let trendStart, trendEnd;

  if (startDate && endDate) {
    trendStart = new Date(startDate);
    trendEnd = new Date(endDate);
  } else {
    trendStart = new Date(now.getFullYear(), now.getMonth(), 1);
    trendEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  trendStart.setHours(0, 0, 0, 0);
  trendEnd.setHours(23, 59, 59, 999);

  const trendTickets = await prisma.ticket.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: trendStart, lte: trendEnd }
    },
    select: { completedAt: true, service: { select: { prefix: true } } }
  });

  const dateBuckets = {};
  let current = new Date(trendStart);
  let loopCount = 0;
  while (current <= trendEnd && loopCount < 366) {
    const monthStr = current.toLocaleString('default', { month: 'short' });
    const dateStr = `${monthStr} ${current.getDate()}`;
    dateBuckets[dateStr] = { total: 0, newApp: 0, renewal: 0, retirement: 0 };
    
    current.setDate(current.getDate() + 1);
    loopCount++;
  }

  trendTickets.forEach(t => {
    if (!t.completedAt) return;
    const d = new Date(t.completedAt);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    const dateStr = `${monthStr} ${d.getDate()}`;
    if (dateBuckets[dateStr] !== undefined) {
      dateBuckets[dateStr].total++;
      if (t.service?.prefix === 'NW') dateBuckets[dateStr].newApp++;
      if (t.service?.prefix === 'RNW') dateBuckets[dateStr].renewal++;
      if (t.service?.prefix === 'R') dateBuckets[dateStr].retirement++;
    }
  });

  for (const [date, counts] of Object.entries(dateBuckets)) {
    trend.push({ 
      date, 
      tickets: counts.total,
      newApp: counts.newApp,
      renewal: counts.renewal,
      retirement: counts.retirement
    });
  }

  // Employee Stats
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, counter: true, caterNew: true, caterRenewal: true, caterRetirement: true, profilePictureBase64: true }
  });

  const employeeStats = await Promise.all(users.map(async (u) => {
    const [servedTotalYear, servedNewYear, servedRenewalYear, servedRetirementYear] = await Promise.all([
      prisma.ticket.count({ where: { status: 'COMPLETED', servedByUserId: u.id, completedAt: { gte: startOfYear, lte: endOfYear } } }),
      prisma.ticket.count({ where: { status: 'COMPLETED', servedByUserId: u.id, service: { prefix: 'NW' }, completedAt: { gte: startOfYear, lte: endOfYear } } }),
      prisma.ticket.count({ where: { status: 'COMPLETED', servedByUserId: u.id, service: { prefix: 'RNW' }, completedAt: { gte: startOfYear, lte: endOfYear } } }),
      prisma.ticket.count({ where: { status: 'COMPLETED', servedByUserId: u.id, service: { prefix: 'R' }, completedAt: { gte: startOfYear, lte: endOfYear } } })
    ]);
    const servedTotalAllTime = await prisma.ticket.count({
      where: { status: 'COMPLETED', servedByUserId: u.id }
    });
    return { ...u, servedTotalYear, servedNewYear, servedRenewalYear, servedRetirementYear, servedTotalAllTime };
  }));

  res.json({
    office: officeStats,
    trend,
    employees: employeeStats
  });
});

// 3. Queue / Tickets
app.get('/api/tickets/postponed', async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { status: 'POSTPONED' },
    include: { service: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(tickets);
});

app.get('/api/tickets/waiting', async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { status: 'WAITING' },
    include: { service: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(tickets);
});

app.get('/api/tickets/recent-called', async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { status: 'SERVING' },
    include: { service: true, counter: true },
    orderBy: { servedAt: 'desc' }
  });
  res.json(tickets);
});
app.get('/api/tickets/my-serving/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });
  
  const tickets = await prisma.ticket.findMany({
    where: { 
      status: 'SERVING',
      servedByUserId: userId
    },
    include: { service: true, counter: true },
    orderBy: { servedAt: 'desc' }
  });
  res.json(tickets);
});

app.post('/api/tickets', async (req, res) => {
  const { serviceId, createdByUserId } = req.body;
  
  // Generate Number (e.g. N-001)
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  
  // Get today's start to find tickets for the day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastTicket = await prisma.ticket.findFirst({
    where: { serviceId, createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' }
  });
  
  let nextSeq = 1;
  if (lastTicket && lastTicket.number) {
    const parts = lastTicket.number.split('-');
    if (parts.length >= 2) {
      nextSeq = parseInt(parts[parts.length - 1], 10) + 1;
    }
  }
  
  const dateStr = String(today.getMonth() + 1).padStart(2, '0') + 
                  String(today.getDate()).padStart(2, '0') + 
                  String(today.getFullYear()).slice(-2);
  
  const number = `${service.prefix}-${dateStr}-${String(nextSeq).padStart(3, '0')}`;
  
  const ticket = await prisma.ticket.create({
    data: {
      number,
      serviceId,
      createdByUserId: createdByUserId || null,
      status: 'WAITING'
    },
    include: { service: true }
  });

  io.emit('ticketCreated', ticket);
  res.json(ticket);
});

// Delete a ticket
app.delete('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.ticket.delete({ where: { id: parseInt(id) } });
    io.emit('ticketDeleted', { id: parseInt(id) });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// Call a ticket
app.put('/api/tickets/:id/call', async (req, res) => {
  const { id } = req.params;
  const { counterId, servedByUserId } = req.body;

  const ticket = await prisma.ticket.update({
    where: { id: parseInt(id) },
    data: {
      status: 'SERVING',
      counterId,
      servedByUserId,
      servedAt: new Date()
    },
    include: { counter: true, service: true }
  });

  io.emit('ticketCalled', ticket); // This triggers the TV Audio
  io.emit('queueUpdated');
  res.json(ticket);
});

app.put('/api/tickets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const ticket = await prisma.ticket.update({
    where: { id: parseInt(id) },
    data: { 
      status,
      completedAt: status === 'COMPLETED' ? new Date() : null,
      ...(status === 'WAITING' || status === 'POSTPONED' ? { servedByUserId: null, counterId: null, servedAt: null } : {})
    }
  });

  io.emit('queueUpdated');
  res.json(ticket);
});

// ----- SETTINGS -----
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/settings', async (req, res) => {
  const { websiteName, logoBase64 } = req.body;
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { websiteName, logoBase64 },
      create: { id: 1, websiteName, logoBase64 }
    });
    // Broadcast setting change in real-time
    io.emit('settingsUpdated', settings);
    res.json(settings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ----- SOCKET.IO -----
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
