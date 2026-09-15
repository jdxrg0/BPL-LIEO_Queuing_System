const prisma = require('../config/db');
const socketConfig = require('../config/socket');
const { autoBalanceCounters } = require('./meta.controller');

const getPostponedTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: 'POSTPONED' },
      include: { service: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getWaitingTickets = async (req, res) => {
  try {
    let tickets = await prisma.ticket.findMany({
      where: { status: 'WAITING' },
      include: { service: true },
      orderBy: { createdAt: 'asc' }
    });
    
    // Sort by priority first
    tickets.sort((a, b) => {
      const priorityLevels = { "REGULAR": 0, "PWD": 1, "SENIOR": 1, "PREGNANT": 1, "RETURNING": 1 };
      const aPri = priorityLevels[a.priorityType] || 0;
      const bPri = priorityLevels[b.priorityType] || 0;
      if (aPri !== bPri) return bPri - aPri; // Higher priority first
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getRecentCalled = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: 'SERVING' },
      include: { service: true, counter: true },
      orderBy: { servedAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyServing = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createTicket = async (req, res) => {
  try {
    const { serviceId, createdByUserId, priorityType } = req.body;
    
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    
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
    
    // Calculate Dynamic Wait Time
    const completedTickets = await prisma.ticket.findMany({
      where: { serviceId, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 10
    });

    let avgServiceTimeMins = 5; 
    if (completedTickets.length > 0) {
      const totalMs = completedTickets.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
      avgServiceTimeMins = Math.max(1, Math.round((totalMs / completedTickets.length) / 60000));
    }

    const waitingCount = await prisma.ticket.count({
      where: { serviceId, status: 'WAITING' }
    });

    const estimatedWaitMins = waitingCount * avgServiceTimeMins;

    const ticket = await prisma.ticket.create({
      data: {
        number,
        serviceId,
        createdByUserId: createdByUserId || null,
        status: 'WAITING',
        priorityType: priorityType || 'REGULAR',
        estimatedWaitMins
      },
      include: { service: true }
    });

    socketConfig.getIo().emit('ticketCreated', ticket);

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.autoAdaptive) {
      await autoBalanceCounters(null, null);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteTicket = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.ticket.delete({ where: { id: parseInt(id) } });
    socketConfig.getIo().emit('ticketDeleted', { id: parseInt(id) });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

const callTicket = async (req, res) => {
  try {
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

    socketConfig.getIo().emit('ticketCalled', ticket);
    socketConfig.getIo().emit('queueUpdated');

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.autoAdaptive) {
      await autoBalanceCounters(null, null);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
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

    socketConfig.getIo().emit('queueUpdated');

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.autoAdaptive) {
      await autoBalanceCounters(null, null);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getPostponedTickets,
  getWaitingTickets,
  getRecentCalled,
  getMyServing,
  createTicket,
  deleteTicket,
  callTicket,
  updateTicketStatus
};
