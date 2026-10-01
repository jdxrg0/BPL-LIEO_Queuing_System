const { buildServiceFlagMap, getUnallocatableServices } = require('./server/utils/serviceFlagMap');
const { ensureMinimumCoverage } = require('./server/utils/capacityCoverage');
const prisma = require('./server/config/db');

async function testBalanceLogic() {
  const settings = await prisma.settings.findFirst();
  const threshold = settings?.autoBalanceThreshold || 15;
  const slaThreshold = settings?.slaThreshold || threshold;

  const activeUsers = await prisma.user.findMany({ where: { counterId: { not: null } } });
  const autoAssignUsers = activeUsers.filter(u => u.autoAssign === true);
  const services = await prisma.service.findMany({ where: { isActive: true } });
  
  const { flagByPrefix } = buildServiceFlagMap(services);

  const waitingCountByService = {};
  const loadByService = {};

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

  for (const service of services) {
    const avgTimeMins = 5; // Hardcoded for test
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

  console.log("maxLoad:", maxLoad, "maxPrefix:", maxPrefix);
  console.log("waitingCountByService:", waitingCountByService);

  const activeQueues = services.filter(s => waitingCountByService[s.prefix] > 0 && flagByPrefix[s.prefix]).map(s => s.prefix);
  const userAssignments = autoAssignUsers.map(u => ({ id: u.id, caterNew: false, caterRenewal: false, caterRetirement: false }));

  console.log("activeQueues:", activeQueues);

  if (autoAssignUsers.length < activeQueues.length) {
    console.log("Fallback branch");
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
    console.log("Strict branch");
    let totalLoad = 0;
    activeQueues.forEach(q => totalLoad += loadByService[q]);
    
    const allocation = {}; 
    activeQueues.forEach(q => allocation[q] = 1); 
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
      const sortedByFraction = [...activeQueues].sort((a, b) => fractions[b] - fractions[a]);
      for (let i = 0; i < unassigned; i++) {
        allocation[sortedByFraction[i]] += 1;
      }
    } else {
       if(maxPrefix) allocation[maxPrefix] += remainingWindows;
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

  console.log("Before minimum coverage:", userAssignments);
  ensureMinimumCoverage(userAssignments, services, flagByPrefix);
  console.log("After minimum coverage:", userAssignments);
}

testBalanceLogic()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
