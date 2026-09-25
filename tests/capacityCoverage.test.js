const { ensureMinimumCoverage } = require('../server/utils/capacityCoverage');

describe('Capacity Coverage - Minimum 1 Staff per Window', () => {
  const services = [
    { id: 1, prefix: 'NW' },
    { id: 2, prefix: 'RNW' },
    { id: 3, prefix: 'R' }
  ];

  const flagByPrefix = { NW: 'caterNew', RNW: 'caterRenewal', R: 'caterRetirement' };

  const blank = (id) => ({ id, caterNew: false, caterRenewal: false, caterRetirement: false });

  test('1. Already fully covered: no changes made', () => {
    const assignments = [
      { ...blank(1), caterNew: true, caterRenewal: true },
      { ...blank(2), caterNew: true, caterRetirement: true }
    ];

    const touched = ensureMinimumCoverage(assignments, services, flagByPrefix);

    expect(touched).toBe(0);
    expect(assignments[0].caterNew).toBe(true);
    expect(assignments[0].caterRenewal).toBe(true);
    expect(assignments[0].caterRetirement).toBe(false);
    expect(assignments[1].caterNew).toBe(true);
    expect(assignments[1].caterRetirement).toBe(true);
  });

  test('2. Empty-window trap: an uncovered window still gets one staff member', () => {
    // Only NW and RNW have waiting tickets; R was empty when the run started.
    const assignments = [
      { ...blank(1), caterNew: true },
      { ...blank(2), caterNew: true, caterRenewal: true }
    ];

    const touched = ensureMinimumCoverage(assignments, services, flagByPrefix);

    expect(touched).toBe(1); // Only R was uncovered
    expect(assignments.some(a => a.caterRetirement)).toBe(true); // R now covered
    expect(assignments[0].caterNew).toBe(true); // existing staff never removed
    expect(assignments[1].caterNew).toBe(true);
    expect(assignments[1].caterRenewal).toBe(true);
  });

  test('3. Fewer staff than windows: every window covered (multi-tasking)', () => {
    const assignments = [blank(1)];

    const touched = ensureMinimumCoverage(assignments, services, flagByPrefix);

    expect(touched).toBe(3);
    expect(assignments[0].caterNew).toBe(true);
    expect(assignments[0].caterRenewal).toBe(true);
    expect(assignments[0].caterRetirement).toBe(true);
  });

  test('4. Unallocatable service (no flag slot) is skipped, never crashes', () => {
    const assignments = [blank(1)];
    const servicesWithSlotless = [
      { id: 1, prefix: 'NW' },
      { id: 4, prefix: 'OTHER' } // not present in flagByPrefix
    ];

    const touched = ensureMinimumCoverage(assignments, servicesWithSlotless, flagByPrefix);

    expect(touched).toBe(1); // only NW got covered
    expect(assignments[0].caterNew).toBe(true);
    expect(assignments[0].caterRetirement).toBe(false);
  });

  test('5. Uncovered window goes to the least-loaded user (busy windows keep staff)', () => {
    const assignments = [
      { ...blank(1), caterNew: true, caterRenewal: true }, // 2 flags (heavily loaded)
      { ...blank(2), caterNew: true }                       // 1 flag (least loaded)
    ];

    const touched = ensureMinimumCoverage(assignments, services, flagByPrefix);

    expect(touched).toBe(1); // R uncovered
    expect(assignments[1].caterRetirement).toBe(true); // least-loaded user 2 takes it
    expect(assignments[0].caterRetirement).toBe(false); // heavily-loaded user not given more
  });

  test('6. Empty assignment list: no-op (never crashes)', () => {
    const touched = ensureMinimumCoverage([], services, flagByPrefix);
    expect(touched).toBe(0);
  });
});