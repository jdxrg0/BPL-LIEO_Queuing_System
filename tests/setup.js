const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

beforeAll(async () => {
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
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
    process.env.JWT_SECRET || 'bpl-lieo-super-secret-key',
    { expiresIn: '24h' }
  );

  return { user, token, username, password };
};

module.exports = {
  prisma,
  createTestUser
};
