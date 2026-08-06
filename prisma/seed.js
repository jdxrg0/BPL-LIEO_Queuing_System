const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Default Services
  const services = [
    { name: 'New Application', prefix: 'NW', description: 'Applying for a new business permit' },
    { name: 'Renewal', prefix: 'RNW', description: 'Annual renewal of business permit' },
    { name: 'Retirement', prefix: 'R', description: 'Retirement or closure of a business' },
  ];

  for (const s of services) {
    await prisma.service.create({
      data: s,
    });
  }

  // 2. Create Default Counter
  await prisma.counter.create({
    data: {
      name: 'Window 1',
      isActive: true,
    }
  });

  // 3. Create Default Admin User
  // Note: In production, password should be hashed (e.g. bcrypt). Keeping it simple for seed.
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: 'admin123', 
      name: 'System Administrator',
      role: 'ADMIN'
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
