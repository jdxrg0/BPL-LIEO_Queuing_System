const { autoBalanceCounters } = require('./server/controllers/meta.controller');
const prisma = require('./server/config/db');

async function main() {
  console.log("Triggering autoBalanceCounters...");
  const result = await autoBalanceCounters(null, null);
  console.log("Result:", result);
  
  const users = await prisma.user.findMany({ 
    where: { isOnline: true },
    select: { username: true, caterNew: true, caterRenewal: true, caterRetirement: true }
  });
  console.log("Users after:", users);
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
