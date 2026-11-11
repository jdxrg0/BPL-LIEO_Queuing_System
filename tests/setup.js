jest.mock('../server/services/cloudSync.service', () => ({ syncTicket: jest.fn(), syncSettings: jest.fn(), catchUpSync: jest.fn(), removeTicket: jest.fn(), syncQueueState: jest.fn(), clearCloudDatabase: jest.fn(), autoCleanupOldCloudTickets: jest.fn() }));
jest.mock('firebase-admin/app', () => ({ getApps: jest.fn(() => [{}]), initializeApp: jest.fn(), cert: jest.fn() }));
jest.mock('firebase-admin/firestore', () => { const collectionMock = { doc: jest.fn().mockReturnThis(), set: jest.fn(), delete: jest.fn(), where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ empty: true, forEach: jest.fn() }) }; return { getFirestore: jest.fn(() => ({ collection: jest.fn(() => collectionMock) })), Timestamp: { fromDate: jest.fn() } }; });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

beforeAll(async () => {
  await prisma.queueAudit.deleteMany();
  await prisma.ticket.deleteMany();
  // Only delete users created during tests
  await prisma.user.deleteMany({
    where: { username: { startsWith: 'testuser_' } }
  });
});

afterAll(async () => {
  await prisma.queueAudit.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany({
    where: { username: { startsWith: 'testuser_' } }
  });
  await prisma.$disconnect();
});

const createTestUser = async (role) => {
  const username = `testuser_${role.toLowerCase()}_${Date.now()}`;
  const password = 'password123';
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      name: `Test ${role}`,
      role: role
    }
  });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token, username, password };
};

module.exports = {
  prisma,
  createTestUser
};


