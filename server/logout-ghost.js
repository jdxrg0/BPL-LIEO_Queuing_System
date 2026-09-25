const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { id: 8 },
    data: { counterId: null }
  });
  console.log("Logged out Ghost User (Trainee, ID 8) from Window 2.");
}

main().finally(() => prisma.$disconnect());
