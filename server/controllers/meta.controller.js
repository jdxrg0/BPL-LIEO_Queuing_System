const prisma = require('../config/db');
const socketConfig = require('../config/socket');
const { calculatePredictiveWaitTime } = require('../utils/smartQueueEngine');
const { getActiveStaffProfiles, getDynamicAverageServiceTime } = require('../utils/capacityTracker');
const { buildServiceFlagMap, getUnallocatableServices } = require('../utils/serviceFlagMap');

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
  const { websiteName, logoBase64, autoAdaptive, autoBalanceThreshold, slaThreshold, zipperRatio, agingRate, skipLimit } = req.body;
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { websiteName, logoBase64, autoAdaptive, autoBalanceThreshold, slaThreshold, zipperRatio, agingRate, skipLimit },
      create: { id: 1, websiteName, logoBase64, autoAdaptive, autoBalanceThreshold, slaThreshold, zipperRatio, agingRate, skipLimit }
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

const performAutoBalance = async () => {
    const settings = await prisma.settings.findFirst();
    const threshold = settings?.autoBalanceThreshold || 15;
    const slaThreshold = settings?.slaThreshold || threshold;
    
    const activeUsers = await prisma.user.findMany({ where: { counterId: { not: null } } });
    if (activeUsers.length === 0) {
      return { success: true, message: 'No active users to balance.' };
    }

    // Only users with autoAssign enabled participate in auto-allocation. Users that
    // an admin has manually specialized (autoAssign false) are never mutated here.
    const autoAssignUsers = activeUsers.filter(u => u.autoAssign === true);
    if (autoAssignUsers.length === 0) {
      return { success: true, message: 'No auto-assignable users to balance.' };
    }

    const services = await prisma.service.findMany({ where: { isActive: true } });
    const { flagByPrefix } = buildServiceFlagMap(services);
    const unallocatableServices = getUnallocatableServices(services);
    if (unallocatableServices.length > 0) {
      console.warn(`[auto-balance] Active services with no cater flag slot (${unallocatableServices.map(s => s.prefix).join(', ')}); they cannot be auto-allocated.`);
    }
    const loadByService = {};
    const waitingCountByService = {};

    const priorityGroups = await prisma.priorityGroup.findMany();
    const weightMap = {};
    priorityGroups.forEach(pg => weightMap[pg.name] = pg.weight);

    const activeServiceIds = services.map(s => s.id);

    const waitingTickets = await prisma.ticket.findMany({
      where: { serviceId: { in: activeServiceIds }, status: 'WAITING' },
      select: { serviceId: true, priorityType: true }
    });
    const waitingByService = {};
    const weightedByService = {};
    for (const t of waitingTickets) {
      const key = t.serviceId;
      waitingByService[key] = (waitingByService[key] || 0) + 1;
      const w = weightMap[t.priorityType];
      weightedByService[key] = (weightedByService[key] || 0) + (w !== undefined ? 1 + w : 1);
    }

    const recentAvgMins = await prisma.$queryRaw`
      SELECT "serviceId" AS "serviceId",
             MAX(1, CAST(ROUND(AVG((CAST("completedAt" AS REAL) - CAST("servedAt" AS REAL)) / 60000.0)) AS INTEGER)) AS "avgMins"
      FROM (
        SELECT "serviceId", "servedAt", "completedAt",
               ROW_NUMBER() OVER (PARTITION BY "serviceId" ORDER BY "completedAt" DESC) AS "rn"
        FROM "Ticket"
        WHERE "status" = 'COMPLETED' AND "servedAt" IS NOT NULL AND "completedAt" IS NOT NULL
      )
      WHERE "rn" <= 10
      GROUP BY "serviceId"
    `;
    const avgMinsByService = {};
    recentAvgMins.forEach(row => {
      avgMinsByService[row.serviceId] = Number(row.avgMins);
    });

    for (const service of services) {
      const avgTimeMins = avgMinsByService[service.id] || 5;
      waitingCountByService[service.prefix] = waitingByService[service.id] || 0;
      loadByService[service.prefix] = (weightedByService[service.id] || 0) * avgTimeMins;
    }

    let maxPrefix = null;
    let maxLoad = -1;
    for (const prefix in loadByService) {
      if (!flagByPrefix[prefix]) continue;
      if (loadByService[prefix] > maxLoad) {
        maxLoad = loadByService[prefix];
        maxPrefix = prefix;
      }
    }

    // SLA Starvation Prevention Check
    let slaForced = false;
    const oldestWaitingTicket = await prisma.ticket.findFirst({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      include: { service: true }
    });

    if (oldestWaitingTicket) {
      const waitMins = Math.floor((new Date() - new Date(oldestWaitingTicket.createdAt)) / 60000);
      // Starvation floor derived from the per-ticket SLA target (3x; default 15min -> 45min).
      const starvationFloor = Math.max(30, slaThreshold * 3);
      const starvedPrefix = oldestWaitingTicket.service?.prefix;
      if (starvedPrefix && flagByPrefix[starvedPrefix] && waitMins >= starvationFloor) {
        // SLA Breached! Force the system to prioritize this ticket's queue.
        // This overrides the hysteresis deadband below.
        slaForced = true;
        maxPrefix = starvedPrefix;
        maxLoad = Math.max(maxLoad, threshold + 1); // Artificially force crunch time
        loadByService[maxPrefix] += 99999; // Force proportional algorithm to dump all remaining windows here!
      }
    }

    if (maxLoad >= 0 && maxPrefix) {
      // Hysteresis (deadband) to prevent peace/crunch flapping on consecutive runs:
      // enter crunch only once load clears threshold * 1.5, and exit only after it
      // falls back below the base threshold.
      const enterCrunchLoad = Math.ceil(threshold * 1.5);
      const inCrunch = autoBalanceState.mode === 'crunch';
      const shouldCrunch = slaForced ||
        (inCrunch ? maxLoad >= threshold : maxLoad >= enterCrunchLoad);

      if (!shouldCrunch) {
        // Peace time: All windows serve all services
        autoBalanceState.mode = 'peace';
        for (const user of autoAssignUsers) {
          if (user.caterNew && user.caterRenewal && user.caterRetirement) continue;
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
        autoBalanceState.mode = 'crunch';
        const activeQueues = services.filter(s => waitingCountByService[s.prefix] > 0 && flagByPrefix[s.prefix]).map(s => s.prefix);
        const userAssignments = autoAssignUsers.map(u => ({ id: u.id, caterNew: false, caterRenewal: false, caterRetirement: false }));
        
        if (autoAssignUsers.length <= activeQueues.length) {
          // Fallback to Multi-Tasking to prevent starvation
          userAssignments.forEach(a => {
            a.caterNew = false;
            a.caterRenewal = false;
            a.caterRetirement = false;
            a[flagByPrefix[maxPrefix]] = true;
          });
          const secondaryQueues = activeQueues.filter(q => q !== maxPrefix);
          for (let i = 0; i < secondaryQueues.length; i++) {
            const queue = secondaryQueues[i];
            const userIndex = i % userAssignments.length;
            userAssignments[userIndex][flagByPrefix[queue]] = true;
          }
        } else {
          // Strict Mutually Exclusive Proportional Allocation
          let totalLoad = 0;
          activeQueues.forEach(q => totalLoad += loadByService[q]);
          
          const allocation = {}; 
          activeQueues.forEach(q => allocation[q] = 1); // Guarantee 1 window per active queue
          let remainingWindows = autoAssignUsers.length - activeQueues.length;
          
          if (totalLoad > 0) {
            const fractions = {};
            activeQueues.forEach(q => {
              const share = (loadByService[q] / totalLoad) * remainingWindows;
              const floored = Math.floor(share);
              allocation[q] += floored;
              fractions[q] = share - floored;
            });
            
            let assignedSoFar = Object.values(allocation).reduce((a, b) => a + b, 0);
            let unassigned = autoAssignUsers.length - assignedSoFar;
            
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
              userAssignments[userIdx][flagByPrefix[q]] = true;
              userIdx++;
            }
          }
        }

        for (const assignment of userAssignments) {
          const currentUser = autoAssignUsers.find(u => u.id === assignment.id);
          if (currentUser &&
              currentUser.caterNew === assignment.caterNew &&
              currentUser.caterRenewal === assignment.caterRenewal &&
              currentUser.caterRetirement === assignment.caterRetirement) {
            continue;
          }
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
    
    return { success: true, message: 'Counters auto-balanced successfully based on current load.' };
};

// Single-flight mutex: admin clicks, the 5-minute interval, and the debounced
// scheduled runs all serialize through this chain so their DB writes can never
// interleave. A failed run still releases the chain.
let autoBalanceLock = Promise.resolve();
const withAutoBalanceLock = (fn) => {
  const run = autoBalanceLock.then(fn);
  autoBalanceLock = run.then(() => {}, () => {});
  return run;
};

// Express-compatible handler (also invoked fire-and-forget by server.js and the
// debounced scheduler, in which case `res` is null/undefined).
const autoBalanceCounters = async (req, res) => {
  try {
    const result = await withAutoBalanceLock(performAutoBalance);
    if (res) res.json(result);
    return result;
  } catch (err) {
    console.error('Error auto-balancing counters:', err);
    if (res) res.status(500).json({ error: 'Server error' });
    return { error: 'Server error' };
  }
};

let autoBalanceTimer = null;

// Persistent peace/crunch mode for the hysteresis deadband (flaps once per run).
const autoBalanceState = { mode: 'peace' };

// Debounced schedule (3s). Events during the window collapse into one timer; the
// resulting run executes after any in-flight run and re-reads fresh DB state at
// execution time, so no rebalance is ever dropped.
const scheduleAutoBalance = () => {
  if (autoBalanceTimer) return;
  autoBalanceTimer = setTimeout(() => {
    autoBalanceTimer = null;
    autoBalanceCounters(null, null)
      .catch(() => {});
  }, 3000);
};

const getLiveWaitTimes = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } });
    const waitTimes = {};

    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
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
