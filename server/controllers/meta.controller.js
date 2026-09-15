const prisma = require('../config/db');
const socketConfig = require('../config/socket');

const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getCounters = async (req, res) => {
  try {
    const counters = await prisma.counter.findMany({ where: { isActive: true } });
    res.json(counters);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createCounter = async (req, res) => {
  try {
    const { name } = req.body;
    const counter = await prisma.counter.create({
      data: { name, isActive: true }
    });
    res.json(counter);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getSettings = async (req, res) => {
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
};

const updateSettings = async (req, res) => {
  const { websiteName, logoBase64, autoAdaptive } = req.body;
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { websiteName, logoBase64, autoAdaptive },
      create: { id: 1, websiteName, logoBase64, autoAdaptive }
    });
    socketConfig.getIo().emit('settingsUpdated', settings);
    res.json(settings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const autoBalanceCounters = async (req, res) => {
  try {
    const activeUsers = await prisma.user.findMany({ where: { counterId: { not: null } } });
    if (activeUsers.length === 0) {
      return res.json({ success: true, message: 'No active users to balance.' });
    }

    const services = await prisma.service.findMany({ where: { isActive: true } });
    const loadByService = {};

    for (const service of services) {
      const waitingCount = await prisma.ticket.count({ where: { serviceId: service.id, status: 'WAITING' } });
      const completed = await prisma.ticket.findMany({
        where: { serviceId: service.id, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10
      });
      let avgTimeMins = 5;
      if (completed.length > 0) {
        const totalMs = completed.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
        avgTimeMins = Math.max(1, Math.round((totalMs / completed.length) / 60000));
      }
      loadByService[service.prefix] = waitingCount * avgTimeMins;
    }

    let maxPrefix = null;
    let maxLoad = -1;
    for (const prefix in loadByService) {
      if (loadByService[prefix] > maxLoad) {
        maxLoad = loadByService[prefix];
        maxPrefix = prefix;
      }
    }

    if (maxLoad > 0 && maxPrefix) {
      for (const user of activeUsers) {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            caterNew: maxPrefix === 'NW' || maxLoad < 15,
            caterRenewal: maxPrefix === 'RNW' || maxLoad < 15,
            caterRetirement: maxPrefix === 'R' || maxLoad < 15
          }
        });
        socketConfig.getIo().emit('userUpdated', updatedUser);
      }
      socketConfig.getIo().emit('queueUpdated');
      socketConfig.getIo().emit('caterConfigUpdated', maxPrefix);
    }
    
    if (res) {
      res.json({ success: true, message: 'Counters auto-balanced successfully based on current load.' });
    }
  } catch (err) {
    console.error("Error auto-balancing counters:", err);
    if (res) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

const getLiveWaitTimes = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } });
    const waitTimes = {};

    for (const service of services) {
      const waitingCount = await prisma.ticket.count({ where: { serviceId: service.id, status: 'WAITING' } });
      const completed = await prisma.ticket.findMany({
        where: { serviceId: service.id, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10
      });
      let avgTimeMins = 5;
      if (completed.length > 0) {
        const totalMs = completed.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
        avgTimeMins = Math.max(1, Math.round((totalMs / completed.length) / 60000));
      }
      waitTimes[service.prefix] = waitingCount * avgTimeMins;
    }

    res.json(waitTimes);
  } catch (error) {
    console.error("Error fetching live wait times:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getServices,
  getCounters,
  createCounter,
  getSettings,
  updateSettings,
  autoBalanceCounters,
  getLiveWaitTimes
};
