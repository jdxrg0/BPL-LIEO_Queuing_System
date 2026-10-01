const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allTickets = await prisma.ticket.findMany({
    where: { status: 'COMPLETED' },
    select: { id: true, status: true, skipCount: true }
  });

  if (!allTickets.length) return;

  let noShowCount = 0;
  let postponedCount = 0;
  let skippedCount = 0;

  for (const ticket of allTickets) {
    const rand = Math.random();
    
    // ~5% chance to be NO_SHOW
    if (rand < 0.05) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { 
          status: 'NO_SHOW',
          completedAt: null // No shows don't have a completed time, but they have servedAt usually when the counter called them and they didn't appear.
        }
      });
      noShowCount++;
    } 
    // ~3% chance to be POSTPONED
    else if (rand < 0.08) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { 
          status: 'POSTPONED',
          servedAt: null, 
          completedAt: null,
          counterId: null,
          servedByUserId: null
        }
      });
      postponedCount++;
    }
    // For the remaining completed tickets, ~20% chance they got skipped 1-4 times
    else if (rand < 0.28) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { skipCount: Math.floor(Math.random() * 4) + 1 }
      });
      skippedCount++;
    }
  }

  console.log(`Updated stats: ${noShowCount} No-Shows, ${postponedCount} Postponed, ${skippedCount} tickets given skips.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
