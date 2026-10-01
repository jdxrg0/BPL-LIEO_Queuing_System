const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ 
    where: { isOnline: true },
    select: {
      id: true,
      username: true,
      caterNew: true,
      caterRenewal: true,
      caterRetirement: true,
      autoAssign: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
