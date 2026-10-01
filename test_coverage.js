const { ensureMinimumCoverage } = require('./server/utils/capacityCoverage');
const { buildServiceFlagMap } = require('./server/utils/serviceFlagMap');

const services = [
  { id: 22, name: 'New Application', prefix: 'NW', isActive: true },
  { id: 23, name: 'Renewal', prefix: 'RNW', isActive: true },
  { id: 24, name: 'Retirement', prefix: 'R', isActive: true }
];

const { flagByPrefix } = buildServiceFlagMap(services);

const userAssignments = [
  { id: 68, caterNew: true, caterRenewal: false, caterRetirement: false }
];

console.log("Before:", userAssignments);
ensureMinimumCoverage(userAssignments, services, flagByPrefix);
console.log("After:", userAssignments);
