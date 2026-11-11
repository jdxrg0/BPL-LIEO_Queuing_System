// @ts-nocheck
export {};
const logger = require('../utils/logger');
const prisma = require('../config/db');
const { buildServiceFlagMap } = require('../utils/serviceFlagMap');

const getStats = async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    const now = new Date();
    
    const queryYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const isHistorical = queryYear !== now.getFullYear();
    
    const startOfYear = new Date(queryYear, 0, 1);
    const endOfYear = new Date(queryYear, 11, 31, 23, 59, 59);

    let trendStart, trendEnd;

    if (startDate && endDate) {
      trendStart = new Date(startDate);
      trendEnd = new Date(endDate);
      if (isNaN(trendStart.getTime()) || isNaN(trendEnd.getTime())) {
        return res.status(400).json({ error: 'Invalid date format provided.' });
      }
    } else {
      trendStart = new Date(now.getFullYear(), now.getMonth(), 1);
      trendEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    trendStart.setHours(0, 0, 0, 0);
    trendEnd.setHours(23, 59, 59, 999);

    const prevYearStart = new Date(trendStart);
    prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
    const prevYearEnd = new Date(trendEnd);
    prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);

    // Parallelize all queries for extreme performance improvement
    const [
      officeGroup,
      services,
      trendTickets,
      noShowTickets,
      postponedTickets,
      users,
      employeeGroup,
      employeeAllTimeGroup,
      priorityGroupsDb,
      prevYearCount
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ['serviceId'],
        where: { status: 'COMPLETED', completedAt: { gte: startOfYear, lte: endOfYear } },
        _count: { id: true }
      }),
      prisma.service.findMany(),
      prisma.ticket.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: trendStart, lte: trendEnd }
        },
        select: { 
          createdAt: true,
          servedAt: true,
          completedAt: true, 
          serviceId: true, 
          skipCount: true, 
          priorityType: true,
          counter: { select: { name: true } }
        }
      }),
      prisma.ticket.findMany({
        where: { status: 'NO_SHOW', servedAt: { gte: trendStart, lte: trendEnd } },
        select: { servedAt: true }
      }),
      prisma.ticket.findMany({
        where: { status: 'POSTPONED', createdAt: { gte: trendStart, lte: trendEnd } },
        select: { createdAt: true }
      }),
      prisma.user.findMany({
        select: { id: true, username: true, name: true, role: true, counter: true, caterNew: true, caterRenewal: true, caterRetirement: true, autoAssign: true, profilePictureBase64: true, isOnline: true }
      }),
      prisma.ticket.groupBy({
        by: ['servedByUserId', 'serviceId'],
        where: { status: 'COMPLETED', servedByUserId: { not: null }, completedAt: { gte: startOfYear, lte: endOfYear } },
        _count: { id: true }
      }),
      prisma.ticket.groupBy({
        by: ['servedByUserId'],
        where: { status: 'COMPLETED', servedByUserId: { not: null } },
        _count: { id: true }
      }),
      prisma.priorityGroup.findMany(),
      prisma.ticket.count({
        where: { status: 'COMPLETED', completedAt: { gte: prevYearStart, lte: prevYearEnd } }
      })
    ]);

    const { slotByServiceId } = buildServiceFlagMap(services);

    let total = 0, newApp = 0, renewal = 0, retirement = 0;
    officeGroup.forEach(g => {
      total += g._count.id;
      const slot = slotByServiceId[g.serviceId];
      if (slot === 0) newApp += g._count.id;
      if (slot === 1) renewal += g._count.id;
      if (slot === 2) retirement += g._count.id;
    });

    const officeStats = { isHistorical, total, newApp, renewal, retirement, year: queryYear };

    const trend = [];
    const dateBuckets = {};
    const sparkBuckets = {};
    
    let current = new Date(trendStart);
    let loopCount = 0;
    while (current <= trendEnd && loopCount < 366) {
      const monthStr = current.toLocaleString('default', { month: 'short' });
      const dateStr = `${monthStr} ${current.getDate()}`;
      dateBuckets[dateStr] = { total: 0, newApp: 0, renewal: 0, retirement: 0, waitTimeMs: 0, waitCount: 0, serviceTimeMs: 0, serviceCount: 0, dropOffs: 0 };
      
      sparkBuckets[current.toDateString()] = { total: 0, newApp: 0, renewal: 0, retirement: 0 };
      
      current.setDate(current.getDate() + 1);
      loopCount++;
    }

    let totalSkip = 0;
    const priorityCounts = {};
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const counterCounts = {};
    
    let totalWaitTimeMs = 0;
    let waitTimeCount = 0;
    let totalServiceTimeMs = 0;
    let serviceTimeCount = 0;
    let slaMetCount = 0;

    trendTickets.forEach(t => {
      if (!t.completedAt) return;
      const d = new Date(t.completedAt);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const dateStr = `${monthStr} ${d.getDate()}`;
      const sparkKey = d.toDateString();
      const slot = slotByServiceId[t.serviceId];

      if (dateBuckets[dateStr] !== undefined) {
        dateBuckets[dateStr].total++;
        if (slot === 0) dateBuckets[dateStr].newApp++;
        if (slot === 1) dateBuckets[dateStr].renewal++;
        if (slot === 2) dateBuckets[dateStr].retirement++;

        if (t.createdAt && t.servedAt) {
          const waitMs = new Date(t.servedAt) - new Date(t.createdAt);
          if (waitMs >= 0) {
            dateBuckets[dateStr].waitTimeMs += waitMs;
            dateBuckets[dateStr].waitCount++;
          }
        }
        
        if (t.servedAt && t.completedAt) {
          const serviceMs = new Date(t.completedAt) - new Date(t.servedAt);
          if (serviceMs >= 0 && serviceMs <= 14400000) { 
            dateBuckets[dateStr].serviceTimeMs += serviceMs;
            dateBuckets[dateStr].serviceCount++;
          }
        }
      }

      if (sparkBuckets[sparkKey] !== undefined) {
        sparkBuckets[sparkKey].total++;
        if (slot === 0) sparkBuckets[sparkKey].newApp++;
        if (slot === 1) sparkBuckets[sparkKey].renewal++;
        if (slot === 2) sparkBuckets[sparkKey].retirement++;
      }

      totalSkip += t.skipCount || 0;
      const p = t.priorityType || 'REGULAR';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
      
      hourCounts[d.getHours()]++;
      dayCounts[d.getDay()]++;
      
      if (t.createdAt && t.servedAt) {
        const waitMs = new Date(t.servedAt) - new Date(t.createdAt);
        if (waitMs >= 0) {
          totalWaitTimeMs += waitMs;
          waitTimeCount++;
          if (waitMs <= 15 * 60000) slaMetCount++;
        }
      }
      
      if (t.servedAt && t.completedAt) {
        const serviceMs = new Date(t.completedAt) - new Date(t.servedAt);
        if (serviceMs >= 0 && serviceMs <= 14400000) {
          totalServiceTimeMs += serviceMs;
          serviceTimeCount++;
        }
      }
      
      if (t.counter && t.counter.name) {
        counterCounts[t.counter.name] = (counterCounts[t.counter.name] || 0) + 1;
      }
    });

    noShowTickets.forEach(t => {
      if (t.servedAt) {
        const d = new Date(t.servedAt);
        const dateStr = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
        if (dateBuckets[dateStr]) dateBuckets[dateStr].dropOffs++;
      }
    });

    postponedTickets.forEach(t => {
      if (t.createdAt) {
        const d = new Date(t.createdAt);
        const dateStr = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
        if (dateBuckets[dateStr]) dateBuckets[dateStr].dropOffs++;
      }
    });

    for (const [date, counts] of Object.entries(dateBuckets)) {
      trend.push({ 
        date, 
        tickets: counts.total,
        newApp: counts.newApp,
        renewal: counts.renewal,
        retirement: counts.retirement,
        avgWaitMins: counts.waitCount > 0 ? Math.round(counts.waitTimeMs / counts.waitCount / 60000) : 0,
        avgServiceMins: counts.serviceCount > 0 ? Math.round(counts.serviceTimeMs / counts.serviceCount / 60000) : 0,
        dropOffs: counts.dropOffs
      });
    }

    const spark = { total: [], newApp: [], renewal: [], retirement: [] };
    for (const counts of Object.values(sparkBuckets)) {
      spark.total.push(counts.total);
      spark.newApp.push(counts.newApp);
      spark.renewal.push(counts.renewal);
      spark.retirement.push(counts.retirement);
    }

    const employeeMap = {};
    users.forEach(u => {
      employeeMap[u.id] = { ...u, servedTotalYear: 0, servedNewYear: 0, servedRenewalYear: 0, servedRetirementYear: 0, servedTotalAllTime: 0 };
    });

    employeeAllTimeGroup.forEach(g => {
      if (employeeMap[g.servedByUserId]) {
        employeeMap[g.servedByUserId].servedTotalAllTime = g._count.id;
      }
    });

    employeeGroup.forEach(g => {
      const userId = g.servedByUserId;
      if (employeeMap[userId]) {
        employeeMap[userId].servedTotalYear += g._count.id;
        const slot = slotByServiceId[g.serviceId];
        if (slot === 0) employeeMap[userId].servedNewYear += g._count.id;
        if (slot === 1) employeeMap[userId].servedRenewalYear += g._count.id;
        if (slot === 2) employeeMap[userId].servedRetirementYear += g._count.id;
      }
    });

    const employeeStats = Object.values(employeeMap);

    const priorityLabelMap = { REGULAR: 'Regular' };
    priorityGroupsDb.forEach(g => { priorityLabelMap[g.name] = g.label; });

    const avgSkipCount = trendTickets.length ? Math.round((totalSkip / trendTickets.length) * 10) / 10 : 0;
    const avgWaitTimeMins = waitTimeCount > 0 ? Math.round(totalWaitTimeMs / waitTimeCount / 60000) : 0;
    const avgServiceTimeMins = serviceTimeCount > 0 ? Math.round(totalServiceTimeMs / serviceTimeCount / 60000) : 0;

    const priorityBreakdown = Object.entries(priorityCounts)
      .map(([type, count]) => ({ type, label: priorityLabelMap[type] || type, count }))
      .sort((a, b) => b.count - a.count);

    const busiestHours = hourCounts.map((count, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count
    }));
    
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiestDays = dayCounts.map((count, index) => ({
      day: dayLabels[index],
      count
    }));
    
    const slaAdherence = waitTimeCount > 0 ? Math.round((slaMetCount / waitTimeCount) * 100) : 100;

    const counterUtilization = Object.entries(counterCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const currentCount = trendTickets.length;
    const pctChange = prevYearCount > 0
      ? Math.round(((currentCount - prevYearCount) / prevYearCount) * 100)
      : (currentCount > 0 ? 100 : 0);

    const advanced = {
      noShow: noShowTickets.length,
      postponed: postponedTickets.length,
      avgSkipCount,
      avgWaitTimeMins,
      avgServiceTimeMins,
      priorityBreakdown,
      busiestHours,
      busiestDays,
      counterUtilization,
      slaAdherence,
      yoy: { current: currentCount, previous: prevYearCount, pctChange }
    };

    res.json({
      office: officeStats,
      trend,
      employees: employeeStats,
      advanced,
      spark
    });
  } catch (error) {
    logger.error("Stats Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};
const getHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const { startDate, endDate, serviceId, status } = req.query;
    const where = {
      status: status || 'COMPLETED'
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        where.completedAt = { gte: start, lte: end };
      }
    }

    if (serviceId) {
      const parsedServiceId = parseInt(serviceId, 10);
      if (!isNaN(parsedServiceId)) {
        where.serviceId = parsedServiceId;
      }
    }

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: {
          service: true,
          counter: true,
          servedByUser: {
            select: { id: true, name: true, username: true }
          },
          createdByUser: {
            select: { id: true, name: true, username: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    logger.error("Get History Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getStats,
  getHistory
};



const getLiveFlow = async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const issuedCount = await prisma.ticket.count({
      where: { createdAt: { gte: oneHourAgo } }
    });
    const servedCount = await prisma.ticket.count({
      where: {
        status: { in: ['COMPLETED', 'SERVING'] },
        servedAt: { gte: oneHourAgo }
      }
    });
    const recentCompleted = await prisma.ticket.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: oneHourAgo },
        servedAt: { not: null }
      },
      select: { servedAt: true, completedAt: true }
    });
    let avgServiceMins = 0;
    const validCompleted = recentCompleted.filter(t => (new Date(t.completedAt) - new Date(t.servedAt)) <= 14400000);
    
    if (validCompleted.length > 0) {
      const totalServiceMs = validCompleted.reduce((acc, t) => acc + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
      avgServiceMins = Math.round(totalServiceMs / validCompleted.length / 60000);
    }
    res.json({
      issuedLastHour: issuedCount,
      servedLastHour: servedCount,
      avgServiceMinsLastHour: avgServiceMins
    });
  } catch (error) {
    logger.error("Live flow error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};
module.exports.getLiveFlow = getLiveFlow;



const getStaffStatus = async (req, res) => {
  try {
    const activeStaff = await prisma.user.count({ where: { isOnline: true } });
    res.json({ activeStaff });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
module.exports.getStaffStatus = getStaffStatus;
