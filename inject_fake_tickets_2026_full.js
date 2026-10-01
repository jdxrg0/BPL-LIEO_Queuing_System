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

  let totalTickets = 0;

  for (let m = 1; m <= 12; m++) {
    if (m === 10) {
      console.log('Skipping October (already injected)...');
      continue;
    }
    
    const daysInMonth = new Date(2026, m, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}26`; // MMDDYY
      
      // Random volume per day, simulating busy/slow days (10 to 30 tickets)
      const numTickets = Math.floor(Math.random() * 20) + 10;
      
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
        
        const hour = Math.floor(Math.random() * 8) + 8; // 8 AM to 4 PM
        const min = Math.floor(Math.random() * 60);
        const createdAt = new Date(`2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`);
        
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
    console.log(`Finished injecting month ${m} of 2026...`);
  }
  
  console.log(`Successfully injected ${totalTickets} fake tickets for the remainder of 2026.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
