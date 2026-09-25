const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticket.findMany({
    include: { service: true }
  });

  const counters = {};
  for (const t of tickets) {
    const parts = t.number.split('-');
    if (parts.length < 3) continue;
    const dateStr = parts[parts.length - 2];
    const seq = parseInt(parts[parts.length - 1], 10);
    if (isNaN(seq)) continue;
    const key = `${t.serviceId}_${dateStr}`;
    if (!counters[key] || seq > counters[key].seq) {
      counters[key] = { serviceId: t.serviceId, date: dateStr, seq };
    }
  }

  let created = 0;
  for (const key of Object.keys(counters)) {
    const { serviceId, date, seq } = counters[key];
    await prisma.ticketCounter.upsert({
      where: { serviceId_date: { serviceId, date } },
      update: { seq },
      create: { serviceId, date, seq }
    });
    created++;
  }
  console.log(`Backfilled ${created} ticket counter row(s)`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());