const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const services = await prisma.service.findMany();
  const counters = await prisma.counter.findMany();
  
  console.log('Users:', users.map(u => ({ id: u.id, username: u.username })));
  console.log('Services:', services.map(s => ({ id: s.id, prefix: s.prefix })));
  console.log('Counters:', counters.map(c => ({ id: c.id, name: c.name })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
