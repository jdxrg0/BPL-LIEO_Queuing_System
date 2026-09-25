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
    console.error("Error in getActiveStaffProfiles:", err);
    return { activeCount: 0, activeUserIds: [] };
  }
}

/**
 * Calculates the Team's Average Processing Time dynamically based on the specific 
 * staff members currently logged in.
 *
 * @param {number} serviceId - The ID of the service
 * @param {number[]} activeUserIds - Array of user IDs currently handling the service
 * @returns {Promise<number>} - The team's average service time in minutes
 */
async function getDynamicAverageServiceTime(serviceId, activeUserIds) {
  try {
    // If no specific staff are logged in, fallback to global service average
    if (!activeUserIds || activeUserIds.length === 0) {
      const globalTickets = await prisma.ticket.findMany({
        where: { serviceId, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 50
      });
      if (globalTickets.length === 0) return 5;
      const totalMs = globalTickets.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
      return Math.max(1, Math.round((totalMs / globalTickets.length) / 60000));
    }

    // Calculate specific average for EACH active user
    const userAverages = [];
    for (const userId of activeUserIds) {
      const userTickets = await prisma.ticket.findMany({
        where: { serviceId, servedByUserId: userId, status: 'COMPLETED', servedAt: { not: null }, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10 // Last 10 tickets per user is enough to gauge their current speed
      });

      if (userTickets.length === 0) {
        // Fallback for new trainees: Assume 5 minutes
        userAverages.push(5);
      } else {
        const totalMs = userTickets.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
        const userAvgMins = (totalMs / userTickets.length) / 60000;
        userAverages.push(userAvgMins);
      }
    }

    // Combine individual speeds into a "Team Average" (Average of Averages)
    const teamAverage = userAverages.reduce((a, b) => a + b, 0) / userAverages.length;
    return Math.max(1, Math.round(teamAverage));
  } catch (err) {
    console.error("Error calculating dynamic average:", err);
    return 5;
  }
}

module.exports = { getActiveStaffProfiles, getDynamicAverageServiceTime };
