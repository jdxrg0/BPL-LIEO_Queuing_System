const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- Services ---");
  const services = await prisma.service.findMany();
  console.log(services);
  
  console.log("--- Users ---");
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, counterId: true, autoAssign: true }
  });
  console.log(users);
  
  console.log("--- Waiting Tickets ---");
  const tickets = await prisma.ticket.findMany({ where: { status: "WAITING" } });
  
  const waitingByService = {};
  for(const t of tickets) {
    waitingByService[t.serviceId] = (waitingByService[t.serviceId] || 0) + 1;
  }
  console.log(waitingByService);
}

main().finally(() => prisma.$disconnect());
