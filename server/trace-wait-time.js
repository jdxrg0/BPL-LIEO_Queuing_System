const { PrismaClient } = require("@prisma/client");
const { getActiveStaffProfiles, getDynamicAverageServiceTime } = require("./utils/capacityTracker");
const { calculatePredictiveWaitTime } = require("./utils/smartQueueEngine");

const prisma = new PrismaClient();

async function main() {
  const service = await prisma.service.findFirst({ where: { prefix: 'R' } });
  
  const existingQueue = await prisma.ticket.findMany({
    where: { serviceId: service.id, status: 'WAITING' },
    orderBy: { createdAt: 'asc' }
  });
  
  const { activeCount, activeUserIds } = await getActiveStaffProfiles('R');
  const avgServiceTimeMins = await getDynamicAverageServiceTime(service.id, activeUserIds);
  
  const priorityGroups = await prisma.priorityGroup.findMany();
  const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
    autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
  };
  const recentTickets = await prisma.ticket.findMany({
    where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
    orderBy: { servedAt: 'desc' },
    take: 50
  });

  console.log("existingQueue length:", existingQueue.length);
  console.log("activeCount:", activeCount);
  console.log("avgServiceTimeMins:", avgServiceTimeMins);

  const mockNewTicket = {
    id: -1,
    priorityType: 'REGULAR',
    createdAt: new Date(),
    serviceId: parseInt(service.id),
    skipCount: 0
  };

  const { calculateSmartScores } = require("./utils/smartQueueEngine");
  const phantomQueue = [...existingQueue, mockNewTicket];
  const sortedPhantomQueue = calculateSmartScores(phantomQueue, priorityGroups, settings, recentTickets);
  
  const trueRank = sortedPhantomQueue.findIndex(t => t.id === -1) + 1;
  console.log("trueRank:", trueRank);
  
  const predicted = Math.round((trueRank / activeCount) * avgServiceTimeMins);
  console.log("Predicted:", predicted);
}

main().finally(() => prisma.$disconnect());
