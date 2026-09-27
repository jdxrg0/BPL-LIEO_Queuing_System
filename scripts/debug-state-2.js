const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- Services ---");
  console.log(await prisma.service.findMany());
  
  console.log("--- Users ---");
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, counterId: true, autoAssign: true, caterNew: true, caterRenewal: true, caterRetirement: true }
  });
  console.log(users);
}

main().finally(() => prisma.$disconnect());
