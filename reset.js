const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.ticket.deleteMany({
    where: { status: 'WAITING' }
  });
  console.log(`Deleted ${result.count} waiting tickets`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
