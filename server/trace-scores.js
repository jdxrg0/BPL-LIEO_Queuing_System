const { PrismaClient } = require("@prisma/client");
const { calculateSmartScores } = require("./utils/smartQueueEngine");

const prisma = new PrismaClient();

async function main() {
  const service = await prisma.service.findFirst({ where: { prefix: 'R' } });
  
  const existingQueue = await prisma.ticket.findMany({
    where: { serviceId: service.id, status: 'WAITING' },
    orderBy: { createdAt: 'asc' }
  });
  
  const priorityGroups = await prisma.priorityGroup.findMany();
  const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
    autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
  };
  const recentTickets = await prisma.ticket.findMany({
    where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
    orderBy: { servedAt: 'desc' },
    take: 50
  });

  const mockNewTicket = {
    id: -1,
    priorityType: 'REGULAR',
    createdAt: new Date(),
    serviceId: parseInt(service.id),
    skipCount: 0
  };

  const phantomQueue = [...existingQueue, mockNewTicket];
  
  process.env.NODE_ENV = 'test'; // To keep _smartScore
  const sortedPhantomQueue = calculateSmartScores(phantomQueue, priorityGroups, settings, recentTickets);
  
  sortedPhantomQueue.forEach(t => {
    console.log(`ID: ${t.id}, Pri: ${t.priorityType}, Created: ${t.createdAt}, waitMins: ${(Date.now() - new Date(t.createdAt).getTime())/60000}, Score: ${t._smartScore}`);
  });
}

main().finally(() => prisma.$disconnect());
