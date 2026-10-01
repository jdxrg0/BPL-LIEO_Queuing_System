export {};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Generating historical fake data...');

  // 1. Get services
  const services = await prisma.service.findMany();
  if (services.length === 0) {
    console.error('No services found. Please run "npm run seed" first.');
    return;
  }

  // 2. Create additional counters
  const counters: any[] = [];
  const existingCounter1 = await prisma.counter.findFirst({ where: { name: 'Window 1' } });
  if (existingCounter1) counters.push(existingCounter1);
  
  for (let i = 2; i <= 5; i++) {
    const counter = await prisma.counter.upsert({
      where: { id: i }, // Ensure we don't duplicate on multiple runs if possible, but upsert on name is safer if we had unique constraint.
      update: {},
      create: { name: `Window ${i}`, isActive: true }
    });
    counters.push(counter);
  }
  
  // Actually, since there's no unique constraint on name, we might just fetch them
  const allCounters = await prisma.counter.findMany();

  // 3. Create additional users
  const passwordHash = await bcrypt.hash('staff123', 10);
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { username: `staff${i}` },
      update: {},
      create: {
        username: `staff${i}`,
        passwordHash,
        name: `Staff Member ${i}`,
        role: 'STAFF',
        counterId: allCounters[i] ? allCounters[i].id : null
      }
    });
  }

  // 4. Create Priority Groups
  const priorityGroups = [
    { name: 'PWD', label: 'Person with Disability', shortLabel: 'PWD', weight: 3 },
    { name: 'SENIOR', label: 'Senior Citizen', shortLabel: 'SC', weight: 2 },
    { name: 'PREGNANT', label: 'Pregnant', shortLabel: 'PG', weight: 2 },
    { name: 'RETURNING', label: 'Returning', shortLabel: 'RET', weight: 1 },
  ];
  for (const pg of priorityGroups) {
    await prisma.priorityGroup.upsert({
      where: { name: pg.name },
      update: pg,
      create: pg
    });
  }

  // 5. Create Tickets over the last 30 days
  const priorities = ['REGULAR', 'PWD', 'SENIOR', 'PREGNANT'];
  let ticketsCreatedCount = 0;

  for (let d = 30; d >= 0; d--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - d);
    
    // Formatting date as MMDDYY
    const dateStr = [
      String(targetDate.getMonth() + 1).padStart(2, '0'),
      String(targetDate.getDate()).padStart(2, '0'),
      String(targetDate.getFullYear()).slice(-2)
    ].join('');

    // Generate between 40 and 120 tickets per day
    const ticketsToday = Math.floor(Math.random() * 80) + 40;
    
    for (let i = 1; i <= ticketsToday; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      
      // Real-world priority distribution: ~70% REGULAR, ~30% priority
      const priorityRand = Math.random();
      let priority = 'REGULAR';
      if (priorityRand > 0.9) priority = 'PREGNANT';
      else if (priorityRand > 0.8) priority = 'SENIOR';
      else if (priorityRand > 0.7) priority = 'PWD';

      // Past tickets are completed/no-show. Today's tickets can be waiting/serving.
      let status = 'COMPLETED';
      if (d === 0) { // Today
        const statusRand = Math.random();
        if (statusRand > 0.8) status = 'NO_SHOW';
        else if (statusRand > 0.4) status = 'COMPLETED';
        else if (statusRand > 0.2) status = 'SERVING';
        else status = 'WAITING';
      } else {
        if (Math.random() > 0.9) status = 'NO_SHOW';
      }
      
      const seq = await prisma.ticketCounter.upsert({
        where: { serviceId_date: { serviceId: service.id, date: dateStr } },
        update: { seq: { increment: 1 } },
        create: { serviceId: service.id, date: dateStr, seq: 1 }
      });
      
      const numPadded = String(seq.seq).padStart(3, '0');
      let pfx = service.prefix;
      if (priority !== 'REGULAR') pfx += 'P';
      const number = `${pfx}-${dateStr}-${numPadded}`;
      
      // Random time between 8 AM and 5 PM (9 hours)
      const workHoursStart = new Date(targetDate);
      workHoursStart.setHours(8, 0, 0, 0);
      const randomOffset = Math.random() * 9 * 60 * 60 * 1000;
      const createdAt = new Date(workHoursStart.getTime() + randomOffset);
      
      const ticketData: any = {
        number,
        status,
        priorityType: priority,
        serviceId: service.id,
        createdAt,
      };
      
      if (status !== 'WAITING') {
        const randomCounter = allCounters[Math.floor(Math.random() * allCounters.length)];
        ticketData.counterId = randomCounter ? randomCounter.id : null;
        // Served 1 to 45 minutes after creation
        ticketData.servedAt = new Date(createdAt.getTime() + (Math.random() * 45 * 60000) + 60000);
      }
      if (status === 'COMPLETED' || status === 'NO_SHOW') {
        // Completed 5 to 45 minutes after being served
        ticketData.completedAt = new Date(ticketData.servedAt.getTime() + (Math.random() * 40 * 60000) + 300000);
      }
      
      await prisma.ticket.create({ data: ticketData });
      ticketsCreatedCount++;
    }
  }

  console.log('Fake historical data generated successfully!');
  console.log(`Added a total of ${ticketsCreatedCount} tickets spread across the last 30 days.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
