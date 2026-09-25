const { calculateSmartScores } = require('../server/utils/smartQueueEngine');

describe('Smart Queue Engine - Core Sorting Algorithms', () => {
  const mockPriorityGroups = [
    { name: 'PWD', weight: 1, slaThreshold: 10 },
    { name: 'SENIOR', weight: 1, slaThreshold: null } // falls back to global
  ];

  const mockSettings = {
    autoBalanceThreshold: 15,
    zipperRatio: 3,
    agingRate: 0.1,
    skipLimit: 5
  };

  const now = Date.now();
  const minsAgo = (mins) => new Date(now - mins * 60000).toISOString();

  test('1. Slow Burn Test: Older Regular ticket beats new Priority ticket organically', () => {
    const tickets = [
      { id: 1, priorityType: 'REGULAR', createdAt: minsAgo(12), skipCount: 0, serviceId: 1 },
      { id: 2, priorityType: 'PWD', createdAt: minsAgo(0), skipCount: 0, serviceId: 1 }
    ];

    // Regular score = 0 (base) + (12 * 0.1) = 1.2
    // PWD score = 1 (base) + 0 = 1.0
    const sorted = calculateSmartScores([...tickets], mockPriorityGroups, mockSettings, []);
    
    expect(sorted[0].id).toBe(1); // Regular wins
    expect(sorted[0]._smartScore).toBeCloseTo(1.2);
    expect(sorted[1]._smartScore).toBeCloseTo(1.0);
  });

  test('2. SLA Panic Test: Ticket waiting past threshold gets massive boost', () => {
    const tickets = [
      { id: 1, priorityType: 'REGULAR', createdAt: minsAgo(16), skipCount: 0, serviceId: 1 },
      { id: 2, priorityType: 'PWD', createdAt: minsAgo(5), skipCount: 0, serviceId: 1 }
    ];

    // Regular wait 16 > 15 global sla. Score = 0 + 1.6 + 100 = 101.6
    // PWD wait 5. Score = 1 + 0.5 = 1.5
    const sorted = calculateSmartScores([...tickets], mockPriorityGroups, mockSettings, []);
    
    expect(sorted[0].id).toBe(1);
    expect(sorted[0]._smartScore).toBeCloseTo(101.6);
  });

  test('3. Stoplight Test: Regular ticket skipped 5 times gets locked to front', () => {
    const tickets = [
      { id: 1, priorityType: 'REGULAR', createdAt: minsAgo(10), skipCount: 5, serviceId: 1 },
      { id: 2, priorityType: 'PWD', createdAt: minsAgo(10), skipCount: 0, serviceId: 1 }
    ];

    // Regular has 5 skips (limit is 5). Score = 0 + 1.0 + 500 = 501.0
    // PWD Score = 1 + 1.0 = 2.0
    const sorted = calculateSmartScores([...tickets], mockPriorityGroups, mockSettings, []);
    
    expect(sorted[0].id).toBe(1);
    expect(sorted[0]._smartScore).toBeCloseTo(501.0);
  });

  test('4. Zipper Enforcer Test: Force regular ticket if overwhelmed by priority', () => {
    const tickets = [
      { id: 1, priorityType: 'REGULAR', createdAt: minsAgo(10), skipCount: 0, serviceId: 1 },
      { id: 2, priorityType: 'PWD', createdAt: minsAgo(10), skipCount: 0, serviceId: 1 }
    ];

    // Last 3 served tickets for Service 1 were all Priority
    const recentTickets = [
      { id: 101, serviceId: 1, priorityType: 'PWD' },
      { id: 102, serviceId: 1, priorityType: 'SENIOR' },
      { id: 103, serviceId: 1, priorityType: 'PWD' }
    ];

    // Regular score = 0 + 1.0 + 1000 (Zipper) = 1001.0
    const sorted = calculateSmartScores([...tickets], mockPriorityGroups, mockSettings, recentTickets);
    
    expect(sorted[0].id).toBe(1);
    expect(sorted[0]._smartScore).toBeCloseTo(1001.0);
  });

  test('5. Conflict Resolution Test: Zipper beats Stoplight beats Panic', () => {
    const tickets = [
      { id: 1, priorityType: 'REGULAR', createdAt: minsAgo(20), skipCount: 0, serviceId: 1 }, // Hits global SLA panic (+100)
      { id: 2, priorityType: 'REGULAR', createdAt: minsAgo(10), skipCount: 6, serviceId: 2 }, // Hits stoplight limit (+500)
      { id: 3, priorityType: 'REGULAR', createdAt: minsAgo(5), skipCount: 0, serviceId: 3 },  // Hits zipper logic (+1000)
    ];

    const recentTickets = [
      { id: 101, serviceId: 3, priorityType: 'PWD' },
      { id: 102, serviceId: 3, priorityType: 'SENIOR' },
      { id: 103, serviceId: 3, priorityType: 'PWD' }
    ];

    const sorted = calculateSmartScores([...tickets], mockPriorityGroups, mockSettings, recentTickets);
    
    expect(sorted[0].id).toBe(3); // Zipper (+1000) wins
    expect(sorted[1].id).toBe(2); // Stoplight (+500) is second
    expect(sorted[2].id).toBe(1); // Panic SLA (+100) is third
  });

  test('6. Priority Burst Floor Test: Zipper boosts ONLY the oldest regular, fresh regulars cannot nuke a starved priority', () => {
    const tickets = [
      { id: 1, priorityType: 'REGULAR', createdAt: minsAgo(15), skipCount: 0, serviceId: 1 }, // Oldest regular (floor target)
      { id: 2, priorityType: 'REGULAR', createdAt: minsAgo(1), skipCount: 0, serviceId: 1 },  // Fresh regular (must NOT get +1000)
      { id: 3, priorityType: 'PWD', createdAt: minsAgo(20), skipCount: 5, serviceId: 1 },     // Starved priority (stoplight +500, SLA +100)
      { id: 4, priorityType: 'SENIOR', createdAt: minsAgo(0), skipCount: 0, serviceId: 1 }
    ];

    // Last 3 served tickets for Service 1 were all Priority -> zipper ON
    const recentTickets = [
      { id: 101, serviceId: 1, priorityType: 'PWD' },
      { id: 102, serviceId: 1, priorityType: 'SENIOR' },
      { id: 103, serviceId: 1, priorityType: 'PWD' }
    ];

    // id1 = 0 + 1.5 + 1000 (zipper floor) = 1001.5
    // id3 = 1 + 2.0 + 500 (stoplight) + 100 (PWD SLA 10) = 603.0
    // id4 = 1 + 0.0 = 1.0
    // id2 = 0 + 0.1 = 0.1 (NO zipper boost)
    const sorted = calculateSmartScores([...tickets], mockPriorityGroups, mockSettings, recentTickets);

    expect(sorted[0].id).toBe(1); // Oldest regular breaks through
    expect(sorted[1].id).toBe(3); // Starved priority still second (fresh regular did NOT jump it)
    expect(sorted[2].id).toBe(4);
    expect(sorted[3].id).toBe(2);
    expect(sorted[3]._smartScore).toBeCloseTo(0.1); // fresh regular untouched by zipper
  });
});
