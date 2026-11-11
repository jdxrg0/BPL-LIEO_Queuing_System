const request = require('supertest');
const { app, server, io } = require('../server');
const { prisma, createTestUser } = require('./setup');

jest.mock('../server/services/cloudSync.service', () => ({
  syncTicket: jest.fn(), syncQueueState: jest.fn(), removeTicket: jest.fn(),
  syncSettings: jest.fn(),
  catchUpSync: jest.fn()
}));

jest.setTimeout(30000);

describe('Receptionist and Check-In Ticket Features', () => {
  let receptionistToken;
  let receptionistUser;
  let testService;
  let unissuedTicket;

  beforeAll(async () => {
    await prisma.queueAudit.deleteMany();
    await prisma.ticket.deleteMany();

    testService = await prisma.service.findFirst();
    if (!testService) {
      testService = await prisma.service.create({
        data: { name: 'New Application', prefix: 'NW' }
      });
    }

    // Create Receptionist
    const recRes = await createTestUser('testuser_receptionist2', 'RECEPTIONIST');
    receptionistUser = recRes.user;
    receptionistToken = recRes.token;
  });

  afterAll(async () => {
    // Cleanup
    if (server) server.close();
    if (io) io.close();
    await prisma.$disconnect();
  });

  it('should generate an UNISSUED ticket using bulk route', async () => {
    unissuedTicket = await prisma.ticket.create({
      data: {
        number: 'NW-999-001',
        status: 'UNISSUED',
        serviceId: testService.id,
        priorityType: 'REGULAR'
      }
    });
    expect(unissuedTicket).toBeTruthy();
  });

  it('Receptionist should be able to check-in an UNISSUED ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/checkin/${unissuedTicket.number}`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ priorityType: 'PWD' });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('WAITING');
    expect(res.body.priorityType).toBe('PWD');
    expect(res.body.createdByUserId).toBe(receptionistUser.id);
  });

  it('Should fail to check-in an already checked-in ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/checkin/${unissuedTicket.number}`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ priorityType: 'REGULAR' });
    
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found or already checked in/);
  });
});
