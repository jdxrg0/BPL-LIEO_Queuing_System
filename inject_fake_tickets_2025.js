const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  const users = await prisma.user.findMany({ where: { role: 'STAFF' } });
  
  if (!services.length || !users.length) {
    console.error('No services or staff users found.');
    return;
  }

  const priorityTypes = ['REGULAR', 'PWD', 'SENIOR', 'PREGNANT'];
  const pGroups = await prisma.priorityGroup.findMany();
  const pTypeNames = pGroups.length > 0 ? pGroups.map(p => p.name) : priorityTypes;

  const startDay = 1;
  const endDay = 30; // Sept has 30 days
  let totalTickets = 0;

  for (let d = startDay; d <= endDay; d++) {
    // Generates dates for September 2025
    const dateStr = `09${String(d).padStart(2, '0')}25`; // MMDDYY for Sept 2025
    
    // Generate 15-25 tickets per day (similar to Oct 2026 to see YOY comparisons)
    // We'll generate slightly fewer maybe, 10-20 to show an increase in 2026?
    // Let's do 10-20 to give a positive YOY growth in the UI.
    const numTickets = Math.floor(Math.random() * 10) + 10;
    
    for (let i = 1; i <= numTickets; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const staffUser = users[Math.floor(Math.random() * users.length)];
      const pType = pTypeNames[Math.floor(Math.random() * pTypeNames.length)];
      
      const counter = await prisma.ticketCounter.upsert({
        where: { serviceId_date: { serviceId: service.id, date: dateStr } },
        update: { seq: { increment: 1 } },
        create: { serviceId: service.id, date: dateStr, seq: 1 }
      });
      
      const number = `${service.prefix}-${dateStr}-${String(counter.seq).padStart(3, '0')}`;
      
      // Random time between 8:00 and 16:00
      const hour = Math.floor(Math.random() * 8) + 8;
      const min = Math.floor(Math.random() * 60);
      const createdAt = new Date(`2025-09-${String(d).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`);
      
      const estimatedWaitMins = Math.floor(Math.random() * 20) + 5;
      const waitTimeMins = Math.floor(Math.random() * 30) + 5;
      const servedAt = new Date(createdAt.getTime() + waitTimeMins * 60000);
      const serviceTimeMins = Math.floor(Math.random() * 15) + 3;
      const completedAt = new Date(servedAt.getTime() + serviceTimeMins * 60000);
      
      await prisma.ticket.create({
        data: {
          number,
          status: 'COMPLETED',
          createdAt,
          servedAt,
          completedAt,
          estimatedWaitMins,
          priorityType: pType,
          serviceId: service.id,
          counterId: (Math.floor(Math.random() * 5) + 11),
          servedByUserId: staffUser.id,
        }
      });
      totalTickets++;
    }
  }
  
  console.log(`Successfully injected ${totalTickets} fake tickets spanning Sept 1 to Sept 30, 2025.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
