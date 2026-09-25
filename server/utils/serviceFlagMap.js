const prisma = require('../config/db');

const FLAG_ORDER = ['caterNew', 'caterRenewal', 'caterRetirement'];

function buildServiceFlagMap(services) {
  const sorted = [...services].sort((a, b) => a.id - b.id);
  const flagByPrefix = {};
  const slotByPrefix = {};
  const flagByServiceId = {};
  const slotByServiceId = {};
  sorted.forEach((service, index) => {
    slotByPrefix[service.prefix] = index;
    slotByServiceId[service.id] = index;
    if (FLAG_ORDER[index]) {
      flagByPrefix[service.prefix] = FLAG_ORDER[index];
      flagByServiceId[service.id] = FLAG_ORDER[index];
    }
  });
  return { flagByPrefix, slotByPrefix, flagByServiceId, slotByServiceId };
}

async function getActiveServices() {
  return prisma.service.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
}

function getUnallocatableServices(services) {
  return [...services]
    .sort((a, b) => a.id - b.id)
    .filter((_, index) => index >= FLAG_ORDER.length);
}

module.exports = { FLAG_ORDER, buildServiceFlagMap, getActiveServices, getUnallocatableServices };