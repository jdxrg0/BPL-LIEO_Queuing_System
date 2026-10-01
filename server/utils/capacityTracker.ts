// @ts-nocheck
export {};
const logger = require('../utils/logger');
const prisma = require('../config/db');
const { buildServiceFlagMap, getActiveServices } = require('./serviceFlagMap');

/**
 * Gets the profiles of all staff members currently logged in and assigned 
 * to handle a specific service category.
 *
 * @param {string} servicePrefix - The prefix of the service to resolve a cater flag for.
 * @returns {Promise<{ activeCount: number, activeUserIds: number[] }>} activeCount may be 0 when no staff are online.
 */
async function getActiveStaffProfiles(servicePrefix) {
  try {
    const services = await getActiveServices();
    const { flagByPrefix } = buildServiceFlagMap(services);
    const flag = servicePrefix ? flagByPrefix[servicePrefix] : null;
    const filter = flag ? { [flag]: true } : {};

    const activeUsers = await prisma.user.findMany({
      where: {
        counterId: { not: null },
        isOnline: true,
        ...filter
      },
      select: { id: true }
    });

    const activeUserIds = activeUsers.map(u => u.id);
    return {
      activeCount: activeUserIds.length,
      activeUserIds
    };
  } catch (err) {
    logger.error("Error in getActiveStaffProfiles:", err);
    return { activeCount: 0, activeUserIds: [] };
  }
}

async function getDynamicAverageServiceTime(serviceId, activeUserIds) {
  try {
    // If no specific staff are logged in, fallback to global service median
    if (!activeUserIds || activeUserIds.length === 0) {
      const globalTickets = await prisma.ticket.findMany({
        where: { serviceId, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 50
      });
      if (globalTickets.length === 0) return 5;
      
      let timesMins = globalTickets.map(t => (new Date(t.completedAt).getTime() - new Date(t.servedAt).getTime()) / 60000);
      timesMins = timesMins.filter(mins => mins <= 240); // Ignore absurd "forgotten" tickets > 4 hours
      
      if (timesMins.length === 0) return 5;

      timesMins.sort((a, b) => a - b);
      const mid = Math.floor(timesMins.length / 2);
      const medianMins = timesMins.length % 2 !== 0 ? timesMins[mid] : (timesMins[mid - 1] + timesMins[mid]) / 2;
      
      return Math.max(0.5, medianMins);
    }

    // Calculate Combined Team Throughput (tickets per minute) and Median per user
    let teamThroughput = 0;

    const userTicketsPromises = activeUserIds.map(userId => 
      prisma.ticket.findMany({
        where: { serviceId, servedByUserId: userId, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10 // Last 10 tickets per user is enough to gauge their current speed
      })
    );
    const userTicketsResults = await Promise.all(userTicketsPromises);

    for (let i = 0; i < activeUserIds.length; i++) {
      const userTickets = userTicketsResults[i];
      let userMedianMins = 5; // Fallback for new trainees

      if (userTickets.length > 0) {
        let timesMins = userTickets.map(t => (new Date(t.completedAt).getTime() - new Date(t.servedAt).getTime()) / 60000);
        timesMins = timesMins.filter(mins => mins <= 240); // Ignore absurd "forgotten" tickets > 4 hours
        
        if (timesMins.length > 0) {
          timesMins.sort((a, b) => a - b);
          const mid = Math.floor(timesMins.length / 2);
          userMedianMins = timesMins.length % 2 !== 0 ? timesMins[mid] : (timesMins[mid - 1] + timesMins[mid]) / 2;
        }
      }

      // Safeguard against unrealistic 0-minute tickets (e.g. accidental rapid clicking)
      userMedianMins = Math.max(0.5, userMedianMins);

      // Add this user's throughput to the team (1 ticket / median mins)
      teamThroughput += (1 / userMedianMins);
    }

    // Convert team throughput back into an "Effective Service Time" 
    // that fits into the existing formula: WaitTime = (Rank / ActiveCounters) * AvgServiceTime
    // We want WaitTime = Rank / TeamThroughput, so AvgServiceTime = ActiveCounters / TeamThroughput.
    if (teamThroughput === 0) return 5;
    
    const activeCounters = activeUserIds.length;
    const effectiveAvgServiceTime = activeCounters / teamThroughput;

    return Math.max(0.5, effectiveAvgServiceTime);
  } catch (err) {
    logger.error("Error calculating dynamic average:", err);
    return 5;
  }
}

module.exports = { getActiveStaffProfiles, getDynamicAverageServiceTime };


