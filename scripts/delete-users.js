const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userIds = [7, 8];

  // Disconnect related tickets first to prevent foreign key constraint errors
  await prisma.ticket.updateMany({
    where: { createdByUserId: { in: userIds } },
    data: { createdByUserId: null }
  });

  await prisma.ticket.updateMany({
    where: { servedByUserId: { in: userIds } },
    data: { servedByUserId: null }
  });

  // Delete the users
  const deleted = await prisma.user.deleteMany({
    where: { id: { in: userIds } }
  });
  
  console.log(`Deleted ${deleted.count} users successfully.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
