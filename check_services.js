const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({ 
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true
    }
  });
  console.log(JSON.stringify(services, null, 2));
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
