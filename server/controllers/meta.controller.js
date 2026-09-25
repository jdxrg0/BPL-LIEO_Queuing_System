const prisma = require('../config/db');
const socketConfig = require('../config/socket');
const { calculatePredictiveWaitTime } = require('../utils/smartQueueEngine');
const { getActiveStaffProfiles, getDynamicAverageServiceTime } = require('../utils/capacityTracker');

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
    
    const activeServices = await prisma.service.findMany({ 
      where: { isActive: true },
      select: { prefix: true, name: true }
    });
    
    res.json({ ...settings, services: activeServices });
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const { syncSettings } = require('../services/cloudSync.service');

const updateSettings = async (req, res) => {
  const { websiteName, logoBase64, autoAdaptive, autoBalanceThreshold, zipperRatio, agingRate, skipLimit } = req.body;
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { websiteName, logoBase64, autoAdaptive, autoBalanceThreshold, zipperRatio, agingRate, skipLimit },
      create: { id: 1, websiteName, logoBase64, autoAdaptive, autoBalanceThreshold, zipperRatio, agingRate, skipLimit }
    });
    socketConfig.getIo().emit('settingsUpdated', settings);

    // Push branding to Firebase for the Vercel tracker
    await syncSettings(settings);

    res.json(settings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const autoBalanceCounters = async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    const threshold = settings?.autoBalanceThreshold || 15;
    
    const activeUsers = await prisma.user.findMany({ where: { counterId: { not: null } } });
    if (activeUsers.length === 0) {
      return res.json({ success: true, message: 'No active users to balance.' });
    }

    const services = await prisma.service.findMany({ where: { isActive: true } });
    const loadByService = {};
    const waitingCountByService = {};

    for (const service of services) {
      const waitingTickets = await prisma.ticket.findMany({ 
        where: { serviceId: service.id, status: 'WAITING' },
        select: { priorityType: true } 
      });
      
      const waitingCount = waitingTickets.length;
      waitingCountByService[service.prefix] = waitingCount;
      
      // Calculate priority-weighted load using dynamic weights from DB
      const priorityGroups = await prisma.priorityGroup.findMany();
      const weightMap = {};
      priorityGroups.forEach(pg => weightMap[pg.name] = pg.weight);
      
      let weightedCount = 0;
      for (const t of waitingTickets) {
        const w = weightMap[t.priorityType];
        weightedCount += (w !== undefined ? 1 + w : 1);
      }
      
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
      loadByService[service.prefix] = weightedCount * avgTimeMins;
    }

    let maxPrefix = null;
    let maxLoad = -1;
    for (const prefix in loadByService) {
      if (loadByService[prefix] > maxLoad) {
        maxLoad = loadByService[prefix];
        maxPrefix = prefix;
      }
    }

    // SLA Starvation Prevention Check
    const oldestWaitingTicket = await prisma.ticket.findFirst({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      include: { service: true }
    });

    if (oldestWaitingTicket) {
      const waitMins = Math.floor((new Date() - new Date(oldestWaitingTicket.createdAt)) / 60000);
      if (waitMins >= 45) {
        // SLA Breached! Force the system to prioritize this ticket's queue
        maxPrefix = oldestWaitingTicket.service.prefix;
        maxLoad = Math.max(maxLoad, threshold + 1); // Artificially force crunch time
        loadByService[maxPrefix] += 99999; // Force proportional algorithm to dump all remaining windows here!
      }
    }

    if (maxLoad >= 0 && maxPrefix) {
      if (maxLoad < threshold) {
        // Peace time: All windows serve all services
        for (const user of activeUsers) {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { caterNew: true, caterRenewal: true, caterRetirement: true },
            include: { counter: true }
          });
          socketConfig.getIo().emit('userUpdated', updatedUser);
        }
        socketConfig.getIo().emit('queueUpdated');
        socketConfig.getIo().emit('caterConfigUpdated', null); // null indicates normalized traffic
      } else {
        // Crunch time: Proportional "Robin Hood" Allocation + Starvation Prevention
        const activeQueues = services.filter(s => waitingCountByService[s.prefix] > 0).map(s => s.prefix);
        const userAssignments = activeUsers.map(u => ({ id: u.id, caterNew: false, caterRenewal: false, caterRetirement: false }));
        
        if (activeUsers.length <= activeQueues.length) {
          // Fallback to Multi-Tasking to prevent starvation
          userAssignments.forEach(a => {
            a.caterNew = maxPrefix === 'NW';
            a.caterRenewal = maxPrefix === 'RNW';
            a.caterRetirement = maxPrefix === 'R';
          });
          const secondaryQueues = activeQueues.filter(q => q !== maxPrefix);
          for (let i = 0; i < secondaryQueues.length; i++) {
            const queue = secondaryQueues[i];
            const userIndex = i % userAssignments.length;
            if (queue === 'NW') userAssignments[userIndex].caterNew = true;
            if (queue === 'RNW') userAssignments[userIndex].caterRenewal = true;
            if (queue === 'R') userAssignments[userIndex].caterRetirement = true;
          }
        } else {
          // Strict Mutually Exclusive Proportional Allocation
          let totalLoad = 0;
          activeQueues.forEach(q => totalLoad += loadByService[q]);
          
          const allocation = {}; 
          activeQueues.forEach(q => allocation[q] = 1); // Guarantee 1 window per active queue
          let remainingWindows = activeUsers.length - activeQueues.length;
          
          if (totalLoad > 0) {
            const fractions = {};
            activeQueues.forEach(q => {
              const share = (loadByService[q] / totalLoad) * remainingWindows;
              const floored = Math.floor(share);
              allocation[q] += floored;
              fractions[q] = share - floored;
            });
            
            let assignedSoFar = Object.values(allocation).reduce((a, b) => a + b, 0);
            let unassigned = activeUsers.length - assignedSoFar;
            
            const sortedByFraction = activeQueues.sort((a, b) => fractions[b] - fractions[a]);
            for (let i = 0; i < unassigned; i++) {
              allocation[sortedByFraction[i]] += 1;
            }
          } else {
             allocation[maxPrefix] += remainingWindows;
          }
          
          let userIdx = 0;
          for (const q of activeQueues) {
            const count = allocation[q];
            for (let i = 0; i < count; i++) {
              if (q === 'NW') userAssignments[userIdx].caterNew = true;
              if (q === 'RNW') userAssignments[userIdx].caterRenewal = true;
              if (q === 'R') userAssignments[userIdx].caterRetirement = true;
              userIdx++;
            }
          }
        }

        for (const assignment of userAssignments) {
          const updatedUser = await prisma.user.update({
            where: { id: assignment.id },
            data: {
              caterNew: assignment.caterNew,
              caterRenewal: assignment.caterRenewal,
              caterRetirement: assignment.caterRetirement
            },
            include: { counter: true }
          });
          socketConfig.getIo().emit('userUpdated', updatedUser);
        }
        
        socketConfig.getIo().emit('queueUpdated');
        socketConfig.getIo().emit('caterConfigUpdated', maxPrefix);
      }
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

let autoBalanceTimer = null;
let autoBalanceBusy = false;

const scheduleAutoBalance = () => {
  if (autoBalanceTimer || autoBalanceBusy) return;
  autoBalanceTimer = setTimeout(() => {
    autoBalanceTimer = null;
    autoBalanceBusy = true;
    autoBalanceCounters(null, null)
      .catch(err => console.error('Auto-balance error:', err))
      .finally(() => {
        autoBalanceBusy = false;
      });
  }, 3000);
};

const getLiveWaitTimes = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } });
    const waitTimes = {};

    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    for (const service of services) {
      const existingQueue = await prisma.ticket.findMany({
        where: { serviceId: service.id, status: 'WAITING' },
        orderBy: { createdAt: 'asc' }
      });

      const { activeCount, activeUserIds } = await getActiveStaffProfiles(service.prefix);
      const avgServiceTimeMins = await getDynamicAverageServiceTime(service.id, activeUserIds);

      // Simulate a regular ticket joining to find expected wait time for the display
      const estimatedWaitMins = calculatePredictiveWaitTime(
        service.id,
        'REGULAR',
        existingQueue,
        priorityGroups,
        settings,
        recentTickets,
        activeCount,
        avgServiceTimeMins
      );

      waitTimes[service.prefix] = estimatedWaitMins;
    }

    res.json(waitTimes);
  } catch (error) {
    console.error("Error fetching live wait times:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

const { clearCloudDatabase } = require('../services/cloudSync.service');

const resetAllData = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Delete all tickets locally
    await prisma.ticket.deleteMany({});
    
    // Delete all tickets in Firebase to prevent accumulation
    await clearCloudDatabase();
    
    // Notify all clients to fetch fresh data
    socketConfig.getIo().emit('queueUpdated');
    
    res.json({ success: true, message: 'All tickets have been successfully deleted.' });
  } catch (error) {
    console.error('Failed to reset data:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ======================== PRIORITY GROUPS CRUD ========================

const getPriorityGroups = async (req, res) => {
  try {
    let groups = await prisma.priorityGroup.findMany({ orderBy: { id: 'asc' } });
    
    // Auto-seed defaults if table is empty
    if (groups.length === 0) {
      const defaults = [
        { name: 'PWD', label: 'Person with Disability', shortLabel: 'PWD', weight: 1 },
        { name: 'SENIOR', label: 'Senior Citizen', shortLabel: 'SR', weight: 1 },
        { name: 'PREGNANT', label: 'Pregnant Woman', shortLabel: 'PREG', weight: 1 },
        { name: 'RETURNING', label: 'Returning Client', shortLabel: 'RTN', weight: 1 },
      ];
      for (const d of defaults) {
        await prisma.priorityGroup.create({ data: d });
      }
      groups = await prisma.priorityGroup.findMany({ orderBy: { id: 'asc' } });
    }
    
    res.json(groups);
  } catch (err) {
    console.error('Error fetching priority groups:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createPriorityGroup = async (req, res) => {
  const { name, label, shortLabel, weight, slaThreshold } = req.body;
  try {
    const group = await prisma.priorityGroup.create({
      data: { name: name.toUpperCase().replace(/\s+/g, '_'), label, shortLabel: shortLabel || name.substring(0, 4).toUpperCase(), weight: weight || 1, slaThreshold: slaThreshold || null }
    });
    socketConfig.getIo().emit('priorityGroupsUpdated');
    res.json(group);
  } catch (err) {
    console.error('Error creating priority group:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updatePriorityGroup = async (req, res) => {
  const { id } = req.params;
  const { name, label, shortLabel, weight, slaThreshold, isActive } = req.body;
  try {
    const group = await prisma.priorityGroup.update({
      where: { id: parseInt(id) },
      data: { 
        ...(name !== undefined && { name: name.toUpperCase().replace(/\s+/g, '_') }),
        ...(label !== undefined && { label }),
        ...(shortLabel !== undefined && { shortLabel }),
        ...(weight !== undefined && { weight }),
        ...(slaThreshold !== undefined && { slaThreshold }),
        ...(isActive !== undefined && { isActive })
      }
    });
    socketConfig.getIo().emit('priorityGroupsUpdated');
    res.json(group);
  } catch (err) {
    console.error('Error updating priority group:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deletePriorityGroup = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.priorityGroup.delete({ where: { id: parseInt(id) } });
    socketConfig.getIo().emit('priorityGroupsUpdated');
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting priority group:', err);
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
  scheduleAutoBalance,
  getLiveWaitTimes,
  resetAllData,
  getPriorityGroups,
  createPriorityGroup,
  updatePriorityGroup,
  deletePriorityGroup
};
