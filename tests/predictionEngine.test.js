const { calculatePredictiveWaitTime } = require('../server/utils/smartQueueEngine');

describe('Predictive Wait Time Engine - Stress Tests', () => {
  const priorityGroups = [
    { name: 'PWD', weight: 1, slaThreshold: 10 },
    { name: 'SENIOR', weight: 1, slaThreshold: null }
  ];

  const settings = {
    autoBalanceThreshold: 15,
    zipperRatio: 3,
    agingRate: 0.1,
    skipLimit: 5
  };

  const now = Date.now();
  const minsAgo = (mins) => new Date(now - mins * 60000).toISOString();

  test('1. Empty Queue, 1 Counter: Wait time should be 5', () => {
    const existingQueue = [];
    const waitMins = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, [], 1, 5);
    expect(waitMins).toBe(5);
  });

  test('2. 10 Regulars in queue, 1 Counter (5 min avg): Wait time for 11th person should be 55', () => {
    const existingQueue = Array.from({ length: 10 }).map((_, i) => ({
      id: i, priorityType: 'REGULAR', createdAt: minsAgo(10 - i), serviceId: 1, skipCount: 0
    }));

    const waitMins = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, [], 1, 5);
    expect(waitMins).toBe(55);
  });

  test('3. VIP jumps the line: Wait time for VIP should be much lower than Regular', () => {
    const existingQueue = Array.from({ length: 10 }).map((_, i) => ({
      id: i, priorityType: 'REGULAR', createdAt: minsAgo(10 - i), serviceId: 1, skipCount: 0
    }));

    const regularWait = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, [], 1, 5);
    const vipWait = calculatePredictiveWaitTime(1, 'PWD', existingQueue, priorityGroups, settings, [], 1, 5);
    
    // VIP wait: trueRank should be 2. (The oldest regular has aged 10 mins -> score 1.0, 
    // which ties VIP's base score of 1.0. The tie-breaker goes to the older ticket!)
    // So rank 2. (2 / 1) * 5 = 10.
    expect(regularWait).toBe(55);
    expect(vipWait).toBe(10);
  });

  test('4. Increased Capacity: 10 Regulars, 5 Counters (5 min avg): Wait time drops significantly', () => {
    const existingQueue = Array.from({ length: 10 }).map((_, i) => ({
      id: i, priorityType: 'REGULAR', createdAt: minsAgo(10 - i), serviceId: 1, skipCount: 0
    }));

    const waitMins = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, [], 5, 5);
    expect(waitMins).toBe(11);
  });

  test('5. Dynamic Team Speed: 5 Counters but they are very slow (15 min avg)', () => {
    const existingQueue = Array.from({ length: 10 }).map((_, i) => ({
      id: i, priorityType: 'REGULAR', createdAt: minsAgo(10 - i), serviceId: 1, skipCount: 0
    }));

    const waitMins = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, [], 5, 15);
    expect(waitMins).toBe(33);
  });

  test('6. Zipper Trigger: Regular ticket wait time drops due to Zipper Force', () => {
    const existingQueue = Array.from({ length: 10 }).map((_, i) => ({
      id: i, priorityType: 'PWD', createdAt: minsAgo(10 - i), serviceId: 1, skipCount: 0
    }));

    const normalWait = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, [], 1, 5);
    expect(normalWait).toBe(55); // Rank 11

    const recentTickets = [
      { id: 901, priorityType: 'PWD', serviceId: 1 },
      { id: 902, priorityType: 'PWD', serviceId: 1 },
      { id: 903, priorityType: 'PWD', serviceId: 1 }
    ];

    const zipperWait = calculatePredictiveWaitTime(1, 'REGULAR', existingQueue, priorityGroups, settings, recentTickets, 1, 5);
    expect(zipperWait).toBe(5);
  });
});
