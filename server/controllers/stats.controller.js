const prisma = require('../config/db');

const getStats = async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    const now = new Date();
    
    const queryYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const isHistorical = queryYear !== now.getFullYear();
    
    const startOfYear = new Date(queryYear, 0, 1);
    const endOfYear = new Date(queryYear, 11, 31, 23, 59, 59);

    // Office Stats - Grouped aggregation for performance
    const officeGroup = await prisma.ticket.groupBy({
      by: ['serviceId'],
      where: { status: 'COMPLETED', completedAt: { gte: startOfYear, lte: endOfYear } },
      _count: { id: true }
    });
    
    const services = await prisma.service.findMany();
    const servicePrefixMap = {};
    services.forEach(s => servicePrefixMap[s.id] = s.prefix);

    let total = 0, newApp = 0, renewal = 0, retirement = 0;
    officeGroup.forEach(g => {
      total += g._count.id;
      const prefix = servicePrefixMap[g.serviceId];
      if (prefix === 'NW') newApp += g._count.id;
      if (prefix === 'RNW') renewal += g._count.id;
      if (prefix === 'R') retirement += g._count.id;
    });

    const officeStats = { isHistorical, total, newApp, renewal, retirement, year: queryYear };

    // Trend Stats
    const trend = [];
    let trendStart, trendEnd;

    if (startDate && endDate) {
      trendStart = new Date(startDate);
      trendEnd = new Date(endDate);
      // Validate dates to prevent server crash on setHours
      if (isNaN(trendStart.getTime()) || isNaN(trendEnd.getTime())) {
        return res.status(400).json({ error: 'Invalid date format provided.' });
      }
    } else {
      trendStart = new Date(now.getFullYear(), now.getMonth(), 1);
      trendEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    trendStart.setHours(0, 0, 0, 0);
    trendEnd.setHours(23, 59, 59, 999);

    // Fetching only minimal fields to prevent memory leaks over large datasets
    const trendTickets = await prisma.ticket.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: trendStart, lte: trendEnd }
      },
      select: { completedAt: true, serviceId: true, skipCount: true, priorityType: true }
    });

    const dateBuckets = {};
    let current = new Date(trendStart);
    let loopCount = 0;
    // Cap at 366 days to prevent infinite loops from bad date inputs
    while (current <= trendEnd && loopCount < 366) {
      const monthStr = current.toLocaleString('default', { month: 'short' });
      const dateStr = `${monthStr} ${current.getDate()}`;
      dateBuckets[dateStr] = { total: 0, newApp: 0, renewal: 0, retirement: 0 };
      
      current.setDate(current.getDate() + 1);
      loopCount++;
    }

    trendTickets.forEach(t => {
      if (!t.completedAt) return;
      const d = new Date(t.completedAt);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const dateStr = `${monthStr} ${d.getDate()}`;
      if (dateBuckets[dateStr] !== undefined) {
        dateBuckets[dateStr].total++;
        const prefix = servicePrefixMap[t.serviceId];
        if (prefix === 'NW') dateBuckets[dateStr].newApp++;
        if (prefix === 'RNW') dateBuckets[dateStr].renewal++;
        if (prefix === 'R') dateBuckets[dateStr].retirement++;
      }
    });

    for (const [date, counts] of Object.entries(dateBuckets)) {
      trend.push({ 
        date, 
        tickets: counts.total,
        newApp: counts.newApp,
        renewal: counts.renewal,
        retirement: counts.retirement
      });
    }

    // Employee Stats - Fixed N+1 Problem
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, counter: true, caterNew: true, caterRenewal: true, caterRetirement: true, profilePictureBase64: true }
    });

    const employeeGroup = await prisma.ticket.groupBy({
      by: ['servedByUserId', 'serviceId'],
      where: { status: 'COMPLETED', servedByUserId: { not: null }, completedAt: { gte: startOfYear, lte: endOfYear } },
      _count: { id: true }
    });

    const employeeAllTimeGroup = await prisma.ticket.groupBy({
      by: ['servedByUserId'],
      where: { status: 'COMPLETED', servedByUserId: { not: null } },
      _count: { id: true }
    });

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
        const prefix = servicePrefixMap[g.serviceId];
        if (prefix === 'NW') employeeMap[userId].servedNewYear += g._count.id;
        if (prefix === 'RNW') employeeMap[userId].servedRenewalYear += g._count.id;
        if (prefix === 'R') employeeMap[userId].servedRetirementYear += g._count.id;
      }
    });

    const employeeStats = Object.values(employeeMap);

    // ======================== ADVANCED ANALYTICS (period = trend date range) ========================

    const [noShowCount, postponedCount] = await Promise.all([
      prisma.ticket.count({
        where: { status: 'NO_SHOW', servedAt: { gte: trendStart, lte: trendEnd } }
      }),
      prisma.ticket.count({
        where: { status: 'POSTPONED', createdAt: { gte: trendStart, lte: trendEnd } }
      })
    ]);

    const priorityGroupsDb = await prisma.priorityGroup.findMany();
    const priorityLabelMap = { REGULAR: 'Regular' };
    priorityGroupsDb.forEach(g => { priorityLabelMap[g.name] = g.label; });

    let totalSkip = 0;
    const priorityCounts = {};
    const hourCounts = new Array(24).fill(0);

    trendTickets.forEach(t => {
      totalSkip += t.skipCount || 0;
      const p = t.priorityType || 'REGULAR';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
      if (t.completedAt) {
        hourCounts[new Date(t.completedAt).getHours()]++;
      }
    });

    const avgSkipCount = trendTickets.length ? Math.round((totalSkip / trendTickets.length) * 10) / 10 : 0;
    const priorityBreakdown = Object.entries(priorityCounts)
      .map(([type, count]) => ({ type, label: priorityLabelMap[type] || type, count }))
      .sort((a, b) => b.count - a.count);

    const busiestHours = hourCounts.map((count, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count
    }));

    // Year-over-Year: same date range shifted back one year
    const prevYearStart = new Date(trendStart);
    prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
    const prevYearEnd = new Date(trendEnd);
    prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);

    const prevYearCount = await prisma.ticket.count({
      where: { status: 'COMPLETED', completedAt: { gte: prevYearStart, lte: prevYearEnd } }
    });

    const currentCount = trendTickets.length;
    const pctChange = prevYearCount > 0
      ? Math.round(((currentCount - prevYearCount) / prevYearCount) * 100)
      : (currentCount > 0 ? 100 : 0);

    const advanced = {
      noShow: noShowCount,
      postponed: postponedCount,
      avgSkipCount,
      priorityBreakdown,
      busiestHours,
      yoy: { current: currentCount, previous: prevYearCount, pctChange }
    };

    res.json({
      office: officeStats,
      trend,
      employees: employeeStats,
      advanced
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getStats
};
