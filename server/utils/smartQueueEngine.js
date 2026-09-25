/**
 * Smart Queue Engine
 * Decoupled, pure-math utility for sorting queue tickets based on fairness algorithms.
 */

function calculateSmartScores(tickets, priorityGroups, settings, recentTickets) {
  const weightMap = {};
  const slaMap = {};
  priorityGroups.forEach(pg => {
    weightMap[pg.name] = pg.weight;
    slaMap[pg.name] = pg.slaThreshold;
  });

  // Calculate Zipper Boosts per Service
  const zipperBoosts = {}; // serviceId -> boolean
  // Group recent tickets by service
  const recentByService = {};
  recentTickets.forEach(t => {
    if (!recentByService[t.serviceId]) recentByService[t.serviceId] = [];
    recentByService[t.serviceId].push(t);
  });

  const zipperRatio = settings.zipperRatio || 0;
  for (const [serviceId, ticketsForService] of Object.entries(recentByService)) {
    const recentN = ticketsForService.slice(0, zipperRatio);
    if (zipperRatio > 0 && recentN.length === zipperRatio && recentN.every(t => t.priorityType !== 'REGULAR')) {
      zipperBoosts[serviceId] = true;
    }
  }

  const now = Date.now();
  const agingRate = settings.agingRate || 0;
  const skipLimit = settings.skipLimit || 5;
  const globalSla = settings.slaThreshold || settings.autoBalanceThreshold || 15;

  // Zipper Force targets ONLY the oldest REGULAR ticket in each zippered
  // service. Boosting every regular at once lets a priority burst carpet-bomb
  // the whole queue (even fresh regulars leapfrog +500 stoplight tickets), then
  // collapse on the next recompute. Granting the +1000 to a single ticket keeps
  // the floor precise: exactly the next-in-line regular breaks through.
  const oldestRegularByService = {};
  tickets.forEach(t => {
    if (t.priorityType === 'REGULAR' && zipperBoosts[String(t.serviceId)]) {
      const key = String(t.serviceId);
      const existing = oldestRegularByService[key];
      if (!existing || new Date(t.createdAt) < new Date(existing.createdAt)) {
        oldestRegularByService[key] = t;
      }
    }
  });

  tickets.forEach(t => {
    const isRegular = t.priorityType === 'REGULAR';
    const basePri = weightMap[t.priorityType] || 0;
    
    // In tests, createdAt might be a Date object or an ISO string.
    const createdTime = new Date(t.createdAt).getTime();
    const waitMins = (now - createdTime) / 60000;
    
    const slaThreshold = (slaMap[t.priorityType] !== undefined && slaMap[t.priorityType] !== null) 
                          ? slaMap[t.priorityType] 
                          : globalSla;

    let score = basePri;
    
    // Dynamic Aging (+ weight per minute)
    score += (waitMins * agingRate);
    
    // Tiered SLA Panic (+100)
    if (waitMins >= slaThreshold) {
      score += 100;
    }

    // Stoplight Skip Limit (+500)
    if (t.skipCount >= skipLimit) {
      score += 500;
    }

    // Zipper Force (+1000 to the oldest regular ticket if zipper triggered)
    if (isRegular && zipperBoosts[String(t.serviceId)] && oldestRegularByService[String(t.serviceId)] === t) {
      score += 1000;
    }

    t._smartScore = score;
  });

  // Sort by Smart Score
  tickets.sort((a, b) => {
    if (Math.abs(a._smartScore - b._smartScore) > 0.001) {
      return b._smartScore - a._smartScore; // Highest score first
    }
    return new Date(a.createdAt) - new Date(b.createdAt); // Break ties by oldest
  });

  // Clean up temporary property unless we need it for tests
  if (process.env.NODE_ENV !== 'test') {
    tickets.forEach(t => delete t._smartScore);
  }

  return tickets;
}

/**
 * Predicts the wait time for a new ticket using the Phantom Queue simulation.
 */
function calculatePredictiveWaitTime(
  serviceId, 
  priorityType, 
  existingQueue, 
  priorityGroups, 
  settings, 
  recentTickets, 
  activeCounters, 
  avgServiceTimeMins
) {
  const mockNewTicket = {
    id: -1,
    priorityType: priorityType || 'REGULAR',
    createdAt: new Date(),
    serviceId: parseInt(serviceId),
    skipCount: 0
  };

  const phantomQueue = [...existingQueue, mockNewTicket];
  const sortedPhantomQueue = calculateSmartScores(phantomQueue, priorityGroups, settings, recentTickets);
  
  // Find rank (1-indexed)
  const trueRank = sortedPhantomQueue.findIndex(t => t.id === -1) + 1;

  // No active staff for the service -> wait time is undetermined. Return null
  // instead of pretending a single clerk exists (the old max(1, ...) floor made a
  // staffless queue look like a 1-clerk queue with a finite, optimistic ETA).
  if (activeCounters <= 0) {
    return null;
  }

  // Calculate Final Predictive Wait Time
  return Math.round((trueRank / activeCounters) * avgServiceTimeMins);
}

module.exports = { calculateSmartScores, calculatePredictiveWaitTime };
