const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  
  if (!services.length) {
    console.error('No services found.');
    return;
  }
  
  const service = services[0]; // Just use the first service (NW) for the wave

  // 1. Log all staff off (set isOnline to false)
  await prisma.user.updateMany({
    data: { isOnline: false }
  });
  console.log("Logged all staff offline to test wait time prediction fallback.");

  // 2. Inject 5 REGULAR tickets from 20 minutes ago
  const dateStr = `100126`; // For Oct 1, 2026
  let totalInjected = 0;

  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const counter = await prisma.ticketCounter.upsert({
      where: { serviceId_date: { serviceId: service.id, date: dateStr } },
      update: { seq: { increment: 1 } },
      create: { serviceId: service.id, date: dateStr, seq: 1 }
    });
    
    const number = `${service.prefix}-${dateStr}-${String(counter.seq).padStart(3, '0')}`;
    const createdAt = new Date(now.getTime() - (20 * 60000) + (i * 1000)); // 20 mins ago
    
    const ticket = await prisma.ticket.create({
      data: {
        number,
        status: 'WAITING',
        createdAt,
        priorityType: 'REGULAR',
        serviceId: service.id
      }
    });
    totalInjected++;
  }

  // 3. Inject 30 Priority tickets (PWD/SENIOR) created JUST NOW
  for (let i = 0; i < 30; i++) {
    const pType = i % 2 === 0 ? 'PWD' : 'SENIOR';
    
    const counter = await prisma.ticketCounter.upsert({
      where: { serviceId_date: { serviceId: service.id, date: dateStr } },
      update: { seq: { increment: 1 } },
      create: { serviceId: service.id, date: dateStr, seq: 1 }
    });
    
    const number = `${service.prefix}-${dateStr}-${String(counter.seq).padStart(3, '0')}`;
    const createdAt = new Date(now.getTime() - (1 * 60000) + (i * 1000)); // 1 min ago
    
    const ticket = await prisma.ticket.create({
      data: {
        number,
        status: 'WAITING',
        createdAt,
        priorityType: pType,
        serviceId: service.id
      }
    });
    totalInjected++;
  }
  
  console.log(`Injected a wave of ${totalInjected} tickets (5 aged REGULAR, 30 fresh PRIORITY).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
