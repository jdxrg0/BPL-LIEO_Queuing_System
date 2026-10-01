const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data? The user might have some real tickets, but probably not since they are asking for fake ones.
  // Actually, we'll just append. Let's get existing counters to know sequence numbers.

  const services = await prisma.service.findMany();
  const users = await prisma.user.findMany({ where: { role: 'STAFF' } });
  
  if (!services.length || !users.length) {
    console.error('No services or staff users found.');
    return;
  }

  const priorityTypes = ['REGULAR', 'PWD', 'SENIOR', 'PREGNANT'];
  // Ensure priority groups exist
  const pGroups = await prisma.priorityGroup.findMany();
  const pTypeNames = pGroups.length > 0 ? pGroups.map(p => p.name) : priorityTypes;

  const startDay = 1;
  const endDay = 31;
  let totalTickets = 0;

  for (let d = startDay; d <= endDay; d++) {
    const isToday = d === 1; // Since current time is Oct 1, 2026
    const dateStr = `10${String(d).padStart(2, '0')}26`; // MMDDYY for Oct 2026
    
    // Generate 15-25 tickets per day
    const numTickets = Math.floor(Math.random() * 10) + 15;
    
    for (let i = 1; i <= numTickets; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const staffUser = users[Math.floor(Math.random() * users.length)];
      const pType = pTypeNames[Math.floor(Math.random() * pTypeNames.length)];
      
      // Update/create TicketCounter
      const counter = await prisma.ticketCounter.upsert({
        where: { serviceId_date: { serviceId: service.id, date: dateStr } },
        update: { seq: { increment: 1 } },
        create: { serviceId: service.id, date: dateStr, seq: 1 }
      });
      
      const number = `${service.prefix}-${dateStr}-${String(counter.seq).padStart(3, '0')}`;
      
      // Random time between 8:00 and 16:00
      const hour = Math.floor(Math.random() * 8) + 8;
      const min = Math.floor(Math.random() * 60);
      const createdAt = new Date(`2026-10-${String(d).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`);
      
      let status = 'COMPLETED';
      let servedAt = null;
      let completedAt = null;
      let estimatedWaitMins = Math.floor(Math.random() * 20) + 5;
      
      if (isToday) {
        // For today, leave the last few tickets as WAITING and SERVING
        if (i > numTickets - 10) {
          status = 'WAITING';
        } else if (i === numTickets - 10) {
          status = 'SERVING';
        }
      }
      
      if (status === 'COMPLETED' || status === 'SERVING') {
        const waitTimeMins = Math.floor(Math.random() * 30) + 5; // Wait 5-35 mins
        servedAt = new Date(createdAt.getTime() + waitTimeMins * 60000);
        
        if (status === 'COMPLETED') {
          const serviceTimeMins = Math.floor(Math.random() * 15) + 3; // Service 3-18 mins
          completedAt = new Date(servedAt.getTime() + serviceTimeMins * 60000);
        }
      }
      
      const ticket = await prisma.ticket.create({
        data: {
          number,
          status,
          createdAt,
          servedAt,
          completedAt,
          estimatedWaitMins,
          priorityType: pType,
          serviceId: service.id,
          counterId: (status === 'SERVING' || status === 'COMPLETED') ? (Math.floor(Math.random() * 5) + 11) : null, // Random counter ID between 11-15 approx
          servedByUserId: (status === 'SERVING' || status === 'COMPLETED') ? staffUser.id : null,
        }
      });
      totalTickets++;
      
      if (status === 'WAITING' || status === 'SERVING') {
         await prisma.queueAudit.create({
            data: {
              ticketId: ticket.id,
              fromStatus: null,
              toStatus: status,
              createdAt: createdAt
            }
         });
      }
    }
  }
  
  console.log(`Successfully injected ${totalTickets} fake tickets spanning Oct 1 to Oct 31.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
