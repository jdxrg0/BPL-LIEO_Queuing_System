const logger = require('../utils/logger');
export {};
const prisma = require('../config/db');
const socketConfig = require('../config/socket');
const { scheduleAutoBalance } = require('./meta.controller');
const { syncTicket, removeTicket, getDb } = require('../services/cloudSync.service');
const { buildServiceFlagMap, getActiveServices } = require('../utils/serviceFlagMap');
const { logAudit } = require('../utils/auditLog');

const getPostponedTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: 'POSTPONED' },
      include: { service: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const webpush = require('web-push');
const { sendSMS } = require('../utils/sms');

// Configure Web Push
webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const { calculateSmartScores, calculatePredictiveWaitTime } = require('../utils/smartQueueEngine');
const { getActiveStaffProfiles, getDynamicAverageServiceTime } = require('../utils/capacityTracker');

const notifyApproachingTickets = async (serviceId) => {
  try {
    const fullQueue = await prisma.ticket.findMany({
      where: { serviceId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' }
    });

    if (fullQueue.length === 0) return;

    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, serviceId, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    const scoredQueue = calculateSmartScores(fullQueue, priorityGroups, settings, recentTickets);

    const db = getDb();

    for (const ticket of fullQueue) {
      const rankIndex = scoredQueue.findIndex(t => t.id === ticket.id);
      const trueRank = rankIndex !== -1 ? rankIndex + 1 : scoredQueue.length;

      if (trueRank <= 2) {
        try {
          let pushSub = null;
          
          // First check local SQLite database (if subscribed locally)
          if (ticket.pushSubscription) {
            pushSub = ticket.pushSubscription;
          } 
          // Then check Firebase for mobile Vercel users!
          else if (db) {
            const docRef = await db.collection('live_tickets').doc(ticket.id.toString()).get();
            if (docRef.exists && docRef.data().pushSubscription) {
              pushSub = docRef.data().pushSubscription;
            }
          }

          if (pushSub) {
            const sub = typeof pushSub === 'string' ? JSON.parse(pushSub) : pushSub;
            await webpush.sendNotification(sub, JSON.stringify({
              title: 'Your turn is approaching!',
              body: `You are exactly ${trueRank} spot(s) away from being called. Please proceed to the waiting area.`,
              ticketNumber: ticket.number
            }));
            
            // Clear subscription from both local DB and Firebase to prevent spam
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { pushSubscription: null }
            });
            if (db) {
              await db.collection('live_tickets').doc(ticket.id.toString()).set({ pushSubscription: null }, { merge: true });
            }
          }
          
          if (ticket.phoneNumber) {
            await sendSMS(ticket.phoneNumber, `BPLO Rosario: You are ${trueRank} spot(s) away from being called for ticket ${ticket.number}. Please proceed to the waiting area.`);
            // Only send the approaching SMS once to prevent spam
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { phoneNumber: null }
            });
          }
        } catch (err) {
          logger.error(`Push failed for ticket ${ticket.number}:`, err);
        }
      }
    }
  } catch (error) {
    logger.error('Error notifying approaching tickets:', error);
  }
};

const getWaitingTickets = async (req, res) => {
  try {
    let tickets = await prisma.ticket.findMany({
      where: { status: 'WAITING' },
      include: { service: true },
      orderBy: { createdAt: 'asc' }
    });
    
    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 100
    });

    const { calculateSmartScores } = require('../utils/smartQueueEngine');
    tickets = calculateSmartScores(tickets, priorityGroups, settings, recentTickets);

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getRecentCalled = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: 'SERVING' },
      include: { service: true, counter: true },
      orderBy: { servedAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getDisplayTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['WAITING', 'SERVING'] }
      },
      select: {
        id: true,
        number: true,
        status: true,
        priorityType: true,
        estimatedWaitMins: true,
        createdAt: true,
        servedAt: true,
        service: {
          select: {
            id: true,
            name: true,
            prefix: true
          }
        },
        counter: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { servedAt: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    const waitingTickets = tickets.filter(t => t.status === 'WAITING');
    const servingTickets = tickets.filter(t => t.status === 'SERVING');

    if (waitingTickets.length > 0) {
      const priorityGroups = await prisma.priorityGroup.findMany();
      const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
        autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
      };
      const recentTickets = await prisma.ticket.findMany({
        where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
        orderBy: { servedAt: 'desc' },
        take: 100
      });

      const { calculateSmartScores } = require('../utils/smartQueueEngine');
      const { getActiveStaffProfiles, getDynamicAverageServiceTime } = require('../utils/capacityTracker');

      const scoredWaiting = calculateSmartScores(waitingTickets, priorityGroups, settings, recentTickets);
      
      const serviceStats = {};
      for (const t of scoredWaiting) {
        if (!serviceStats[t.service.id]) {
          const { activeCount, activeUserIds } = await getActiveStaffProfiles(t.service.prefix);
          const avgServiceTimeMins = await getDynamicAverageServiceTime(t.service.id, activeUserIds);
          serviceStats[t.service.id] = { activeCount, avgServiceTimeMins, rankMap: {} };
          
          // Pre-compute ranks for this service
          const serviceQueue = scoredWaiting.filter(st => st.service.id === t.service.id);
          serviceQueue.forEach((st, idx) => {
             serviceStats[t.service.id].rankMap[st.id] = idx + 1;
          });
        }
        
        const stats = serviceStats[t.service.id];
        const trueRank = stats.rankMap[t.id];
        
        let abandonmentDiscount = 0;
        if (trueRank > 10) {
          const tiers = Math.floor((trueRank - 1) / 10);
          abandonmentDiscount = Math.min(0.30, tiers * 0.05);
        }
        const effectiveRank = trueRank * (1 - abandonmentDiscount);
        
        t.estimatedWaitMins = stats.activeCount > 0 
          ? Math.max(1, Math.round((effectiveRank / stats.activeCount) * stats.avgServiceTimeMins)) 
          : null;
      }
      
      // Merge back in the EXACT sorted order + serving tickets
      res.json([...servingTickets, ...scoredWaiting]);
    } else {
      res.json(tickets);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyServing = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });
    
    const tickets = await prisma.ticket.findMany({
      where: { 
        status: 'SERVING',
        servedByUserId: userId
      },
      include: { service: true, counter: true },
      orderBy: { servedAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createTicket = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'STAFF') {
      return res.status(403).json({ error: 'Staff members are not allowed to create tickets' });
    }
    
    const { serviceId, createdByUserId, priorityType } = req.body;
    
    const service = await prisma.service.findUnique({ where: { id: serviceId } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Atomically allocate the next sequence number per service/day.
    // Prevents duplicate ticket numbers when tickets are created concurrently.
    const dateStr = String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0') + 
                    String(today.getFullYear()).slice(-2);

    const counter = await prisma.ticketCounter.upsert({
      where: {
        serviceId_date: { serviceId, date: dateStr }
      },
      update: {
        seq: { increment: 1 }
      },
      create: {
        serviceId,
        date: dateStr,
        seq: 1
      }
    });

    const nextSeq = counter.seq;
    const number = `${service.prefix}-${dateStr}-${String(nextSeq).padStart(3, '0')}`;
    
    // 1. Get Active Staff Profiles
    const { activeCount, activeUserIds } = await getActiveStaffProfiles(service.prefix);

    // 2. Calculate Team Dynamic Average Service Time
    const avgServiceTimeMins = await getDynamicAverageServiceTime(serviceId, activeUserIds);

    // 3. Simulate Smart Queue Engine to find True Rank
    const existingQueue = await prisma.ticket.findMany({
      where: { serviceId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' }
    });

    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    const estimatedWaitMins = calculatePredictiveWaitTime(
      serviceId, 
      priorityType, 
      existingQueue, 
      priorityGroups, 
      settings, 
      recentTickets, 
      activeCount, 
      avgServiceTimeMins
    );

    const existingUnissued = await prisma.ticket.findFirst({
      where: { number, status: 'UNISSUED' }
    });

    let ticket;
    if (existingUnissued) {
      ticket = await prisma.ticket.update({
        where: { id: existingUnissued.id },
        data: {
          serviceId,
          createdByUserId: createdByUserId || null,
          status: 'WAITING',
          priorityType: priorityType || 'REGULAR',
          estimatedWaitMins,
          createdAt: new Date() // Reset createdAt so wait time calculation starts now
        },
        include: { service: true }
      });
    } else {
      ticket = await prisma.ticket.create({
        data: {
          number,
          serviceId,
          createdByUserId: createdByUserId || null,
          status: 'WAITING',
          priorityType: priorityType || 'REGULAR',
          estimatedWaitMins
        },
        include: { service: true }
      });
    }

    await logAudit({
      ticketId: ticket.id,
      fromStatus: null,
      toStatus: 'WAITING',
      performedBy: req.user ? req.user.id : (createdByUserId || null),
      note: 'ticket-created'
    });

    socketConfig.getIo().emit('ticketCreated', ticket);

    if (settings?.autoAdaptive) {
      scheduleAutoBalance();
    }

    // Sync to Cloud for Live Tracker (Non-blocking)
    syncTicket(ticket);

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

const deleteTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.ticket.delete({ where: { id: parseInt(id) } });
    socketConfig.getIo().emit('ticketDeleted', { id: parseInt(id) });
    notifyApproachingTickets(ticket.serviceId);
    
    // Remove from Cloud (Non-blocking)
    removeTicket(parseInt(id));
    
    res.json({ success: true });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

const callTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { counterId, servedByUserId } = req.body;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { service: true }
    });
    if (!existingTicket) return res.status(404).json({ error: 'Ticket not found' });

    const caller = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, role: true, caterNew: true, caterRenewal: true, caterRetirement: true }
    });
    if (!caller) return res.status(401).json({ error: 'User not found' });

    const isRecall = existingTicket.status === 'SERVING';

    // Enforce the auto-allocation server-side: non-admins may only start serving
    // tickets from queues they are allocated to (via their cater flag). Recalls of
    // an already-serving ticket and admin override are exempt.
    if (!isRecall && caller.role !== 'ADMIN') {
      if (servedByUserId !== undefined && servedByUserId !== null && Number(servedByUserId) !== caller.id) {
        return res.status(403).json({ error: 'You can only call tickets for yourself.' });
      }
      const prefix = existingTicket.service?.prefix;
      const activeServices = await getActiveServices();
      const { flagByPrefix } = buildServiceFlagMap(activeServices);
      const flag = prefix ? flagByPrefix[prefix] : null;
      if (!flag || !caller[flag]) {
        return res.status(403).json({ error: 'You are not allocated to this service queue.' });
      }
    }

    let ticket;

    if (isRecall) {
      // For a recall, we just read the ticket data and skip ALL SQLite writes.
      // This completely prevents database locks when spamming the recall button.
      ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(id) },
        include: { counter: true, service: true }
      });
    } else {
      // Normal call: Perform updates
      ticket = await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: {
          status: 'SERVING',
          counterId,
          servedByUserId,
          servedAt: new Date()
        },
        include: { counter: true, service: true }
      });

      await logAudit({
        ticketId: ticket.id,
        fromStatus: existingTicket.status || 'WAITING',
        toStatus: 'SERVING',
        performedBy: req.user ? req.user.id : (servedByUserId || null),
        windowNumber: counterId
      });

      // Smart Queue: Increment skipCount ONLY on the first call, not on recalls
      await prisma.ticket.updateMany({
        where: {
          status: 'WAITING',
          serviceId: ticket.serviceId,
          createdAt: { lt: ticket.createdAt }
        },
        data: {
          skipCount: { increment: 1 }
        }
      });
      
      socketConfig.getIo().emit('queueUpdated');

      
      const settings = await prisma.settings.findUnique({ where: { id: 1 } });
      if (settings?.autoAdaptive) {
        scheduleAutoBalance();
      }
    }

    socketConfig.getIo().emit('ticketCalled', ticket);

    // Send Push Notification on initial call AND on recall
    try {
      let pushSub = existingTicket.pushSubscription;
      const db = getDb();
      if (!pushSub && db) {
        const docRef = await db.collection('live_tickets').doc(ticket.id.toString()).get();
        if (docRef.exists && docRef.data().pushSubscription) {
          pushSub = docRef.data().pushSubscription;
        }
      }
      
      if (pushSub) {
        const sub = typeof pushSub === 'string' ? JSON.parse(pushSub) : pushSub;
        const prefix = isRecall ? 'Reminder: ' : '';
        await webpush.sendNotification(sub, JSON.stringify({
          title: 'It is your turn!',
          body: `${prefix}Your ticket ${ticket.number} has been called. Please proceed to Counter ${counterId}.`,
          url: `/?ticket=${ticket.number}`,
          ticketNumber: ticket.number
        }));
        
        // We no longer delete the pushSubscription here so that we can keep sending notifications on Recall.
      }
      
      if (existingTicket.phoneNumber) {
        const prefix = isRecall ? 'Reminder: ' : '';
        await sendSMS(existingTicket.phoneNumber, `BPLO Rosario: ${prefix}Your ticket ${ticket.number} has been called. Please proceed to Counter ${counterId}.`);
      }
    } catch (err) {
      logger.error(`Push/SMS failed for called ticket ${ticket.number}:`, err);
    }

    // Sync to Cloud (Non-blocking) - this updates Firebase's updatedAt timestamp
    // so Vercel trackers will detect the recall and play the beep.
    syncTicket(ticket);

    res.json(ticket);
    
    notifyApproachingTickets(ticket.serviceId);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      select: { status: true, counterId: true }
    });

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        ...(status === 'WAITING' || status === 'POSTPONED' ? { servedByUserId: null, counterId: null, servedAt: null } : {})
      }
    });

    const oldStatus = existingTicket ? existingTicket.status : null;
    await logAudit({
      ticketId: ticket.id,
      fromStatus: oldStatus,
      toStatus: status,
      performedBy: req.user ? req.user.id : null,
      windowNumber: existingTicket?.counterId || ticket.counterId || null
    });

    socketConfig.getIo().emit('queueUpdated');

    
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.autoAdaptive) {
      scheduleAutoBalance();
    }

    // Cloud Sync Logic
    // We now sync terminal states to Firebase so the Live Tracker can display "NO SHOW" or "COMPLETED"
    syncTicket(ticket);

    res.json(ticket);

    notifyApproachingTickets(ticket.serviceId);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const trackTicket = async (req, res) => {
  const { number } = req.params;
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { number },
      include: { service: true, counter: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'WAITING') {
      return res.json({ ticket, trueRank: 0, estimatedWaitMins: 0 });
    }

    // It is waiting, let's calculate its live position
    const existingQueue = await prisma.ticket.findMany({
      where: { serviceId: ticket.serviceId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' }
    });

    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, serviceId: ticket.serviceId, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    // Score the entire queue
    const scoredQueue = calculateSmartScores(existingQueue, priorityGroups, settings, recentTickets);

    // Find this ticket's true rank
    const rankIndex = scoredQueue.findIndex(t => t.id === ticket.id);
    const trueRank = rankIndex !== -1 ? rankIndex + 1 : scoredQueue.length;

    // Get Active Capacity and Team Average
    const { activeCount, activeUserIds } = await getActiveStaffProfiles(ticket.service.prefix);
    const avgServiceTimeMins = await getDynamicAverageServiceTime(ticket.serviceId, activeUserIds);

    // 3. Abandonment Rate (No-Show Discount) matching smartQueueEngine.js
    let abandonmentDiscount = 0;
    if (trueRank > 10) {
      const tiers = Math.floor((trueRank - 1) / 10);
      abandonmentDiscount = Math.min(0.30, tiers * 0.05);
    }
    const effectiveRank = trueRank * (1 - abandonmentDiscount);

    const estimatedWaitMins = activeCount > 0 ? Math.max(1, Math.round((effectiveRank / activeCount) * avgServiceTimeMins)) : null;

    res.json({ ticket, trueRank, estimatedWaitMins });
  } catch (error) {
    logger.error('Error tracking ticket:', error);
    res.status(500).json({ error: 'Failed to track ticket' });
  }
};

const subscribeToPush = async (req, res) => {
  const { number } = req.params;
  const { subscription } = req.body;

  try {
    // SECURITY PATCH: Validate the subscription payload to prevent DoS database bloat injections
    if (!subscription || typeof subscription !== 'object') {
      return res.status(400).json({ error: 'Invalid subscription payload' });
    }
    
    // Web-Push subscriptions must contain an endpoint URL and security keys
    if (typeof subscription.endpoint !== 'string' || !subscription.keys || typeof subscription.keys.p256dh !== 'string' || typeof subscription.keys.auth !== 'string') {
      return res.status(400).json({ error: 'Malformed push subscription object' });
    }

    // Limit endpoint string length to prevent massive string injections
    if (subscription.endpoint.length > 2000) {
      return res.status(400).json({ error: 'Subscription endpoint too long' });
    }

    const ticket = await prisma.ticket.findFirst({ where: { number } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const subJson = JSON.stringify(subscription);

    // Save the subscription object as a JSON string to local SQLite
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { pushSubscription: subJson }
    });

    // Also sync to Firebase so the notification sender can find it
    const db = getDb();
    if (db) {
      try {
        await db.collection('live_tickets').doc(ticket.id.toString()).set(
          { pushSubscription: subJson },
          { merge: true }
        );
      } catch (err: any) {
        console.warn('Could not sync push subscription to Firebase:', err.message);
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
};

const subscribeToSMS = async (req, res) => {
  const { number } = req.params;
  const { phoneNumber } = req.body;

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { number }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Basic validation
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { phoneNumber }
    });
    
    // Welcome SMS
    await sendSMS(phoneNumber, `BPLO Rosario: You will receive SMS alerts for ticket ${ticket.number}. We'll text you when it's your turn.`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving SMS subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const autoAssignNext = async (req, res) => {
  try {
    const { counterId, servedByUserId } = req.body;
    
    // Fallback to req.user.id if servedByUserId is not provided
    const userId = servedByUserId ? Number(servedByUserId) : (req.user ? req.user.id : null);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not found' });
    }

    const caller = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, caterNew: true, caterRenewal: true, caterRetirement: true }
    });
    if (!caller) return res.status(401).json({ error: 'User not found' });

    // Build the list of allowed service prefixes for this staff member
    const activeServices = await getActiveServices();
    const { flagByPrefix } = buildServiceFlagMap(activeServices);
    
    const allowedPrefixes: string[] = [];
    if (caller.role === 'ADMIN') {
      allowedPrefixes.push(...Object.keys(flagByPrefix));
    } else {
      for (const prefix in flagByPrefix) {
        if (caller[flagByPrefix[prefix]]) {
          allowedPrefixes.push(prefix);
        }
      }
    }

    // 1. Fetch ALL waiting tickets that match the staff's capabilities
    const waitingTickets = await prisma.ticket.findMany({
      where: {
        status: 'WAITING',
        service: {
          prefix: { in: allowedPrefixes }
        }
      },
      include: { service: true }
    });

    if (!waitingTickets || waitingTickets.length === 0) {
      return res.status(404).json({ error: 'No tickets available for your capabilities.' });
    }

    // 2. Pass them through the Smart Queue Engine to pick the best one
    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, slaThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 100
    });

    const { calculateSmartScores } = require('../utils/smartQueueEngine');
    const scoredTickets = calculateSmartScores(waitingTickets, priorityGroups, settings, recentTickets);
    const bestTicket = scoredTickets.length > 0 ? scoredTickets[0] : null;

    if (!bestTicket) {
      return res.status(404).json({ error: 'No valid tickets found.' });
    }

    // 3. Use the returned ticket for assignment
    const ticket = await prisma.ticket.update({
      where: { id: bestTicket.id },
      data: {
        status: 'SERVING',
        counterId,
        servedByUserId: userId,
        servedAt: new Date()
      },
      include: { counter: true, service: true }
    });

    await logAudit({
      ticketId: ticket.id,
      fromStatus: 'WAITING',
      toStatus: 'SERVING',
      performedBy: null,
      windowNumber: counterId,
      note: 'auto-assigned'
    });

    // Update skip counts for older tickets in the same service
    await prisma.ticket.updateMany({
      where: {
        status: 'WAITING',
        serviceId: ticket.serviceId,
        createdAt: { lt: ticket.createdAt }
      },
      data: {
        skipCount: { increment: 1 }
      }
    });

    socketConfig.getIo().emit('queueUpdated');
    socketConfig.getIo().emit('ticketCalled', ticket);

    
    if (settings?.autoAdaptive) {
      scheduleAutoBalance();
    }

    syncTicket(ticket);
    notifyApproachingTickets(ticket.serviceId);

    // Send push notification
    try {
      let pushSub = bestTicket.pushSubscription;
      const db = getDb();
      if (!pushSub && db) {
        const docRef = await db.collection('live_tickets').doc(ticket.id.toString()).get();
        if (docRef.exists && docRef.data().pushSubscription) {
          pushSub = docRef.data().pushSubscription;
        }
      }
      
      if (pushSub) {
        const sub = typeof pushSub === 'string' ? JSON.parse(pushSub) : pushSub;
        await webpush.sendNotification(sub, JSON.stringify({
          title: 'It is your turn!',
          body: `Your ticket ${ticket.number} has been called via Auto-Assign. Please proceed to Counter ${counterId}.`,
          url: `/tracker?ticket=${ticket.number}`,
          ticketNumber: ticket.number
        }));
      }
      
      if (bestTicket.phoneNumber) {
        await sendSMS(bestTicket.phoneNumber, `BPLO Rosario: Your ticket ${ticket.number} has been called. Please proceed to Counter ${counterId}.`);
      }
    } catch (err) {
      logger.error(`Push/SMS failed for auto-assigned ticket ${ticket.number}:`, err);
    }

    res.json(ticket);
  } catch (error) {
    logger.error('Error in autoAssignNext:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTickets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const skip = (page - 1) * limit;

    const { status, serviceId, priorityType } = req.query;
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (serviceId) {
      const parsedServiceId = parseInt(serviceId, 10);
      if (!isNaN(parsedServiceId)) {
        where.serviceId = parsedServiceId;
      }
    }
    if (priorityType) {
      where.priorityType = priorityType;
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
        orderBy: { createdAt: 'desc' },
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
    logger.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const bulkCreateTickets = async (req, res) => {
  try {
    if (req.user && req.user.role === 'STAFF') {
      return res.status(403).json({ error: 'Staff members are not allowed to bulk create tickets' });
    }
    
    const { tickets } = req.body; // Array of objects { number, serviceId }
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ error: 'Tickets array is required' });
    }

    // Filter out tickets that already exist
    const numbers = tickets.map(t => t.number);
    const existing = await prisma.ticket.findMany({
      where: { number: { in: numbers } },
      select: { number: true }
    });
    const existingNumbers = new Set(existing.map(t => t.number));

    const toInsert = tickets
      .filter(t => !existingNumbers.has(t.number))
      .map(t => ({
        number: t.number,
        serviceId: t.serviceId,
        status: 'UNISSUED',
        priorityType: 'REGULAR',
        createdByUserId: req.user ? req.user.id : null
      }));

    if (toInsert.length > 0) {
      await prisma.ticket.createMany({
        data: toInsert
      });
    }

    res.status(201).json({ 
      success: true, 
      created: toInsert.length,
      skipped: tickets.length - toInsert.length
    });
  } catch (error) {
    logger.error('Error in bulkCreateTickets:', error);
    res.status(500).json({ error: 'Server error bulk creating tickets' });
  }
};

const checkInTicket = async (req, res) => {
  try {
    const { number } = req.params;
    
    // Find the unissued ticket
    const ticket = await prisma.ticket.findFirst({
      where: { number, status: 'UNISSUED' }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'UNISSUED ticket not found or already checked in' });
    }

    // Update to WAITING and reset createdAt so wait time starts *now*
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'WAITING',
        createdAt: new Date()
      },
      include: { service: true }
    });

    const io = require('../config/socket').getIo();
    if (io) {
      io.emit('queueUpdated');
      io.emit('ticketCreated', updated);
    }

    // Sync to Firebase
    syncTicket(updated).catch(err => logger.error('Firebase sync failed on check-in:', err));
    syncQueueState(updated.serviceId).catch(err => logger.error('Firebase queue state sync failed:', err));

    res.json(updated);
  } catch (error) {
    logger.error('Error in checkInTicket:', error);
    res.status(500).json({ error: 'Server error checking in ticket' });
  }
};

const { getHistory } = require('./stats.controller');

exports.exportTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        service: true,
        // Note: priorityType is a plain string on Ticket, not a relation.
        createdByUser: { select: { id: true, name: true, role: true } },
        servedByUser: { select: { id: true, name: true, role: true } },
        counter: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Build CSV
    const headers = [
      'Ticket Number', 'Status', 'Service', 'Priority Type', 
      'Created At', 'Called At', 'Completed At', 
      'Created By', 'Served By', 'Counter', 'Wait Time (mins)', 'Service Time (mins)'
    ];

    const rows = tickets.map(t => {
      // servedAt = when the ticket was called (SERVING), completedAt = when finished
      const waitTime = t.servedAt ? Math.round((new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime()) / 60000) : '';
      const serviceTime = (t.servedAt && t.completedAt) ? Math.round((new Date(t.completedAt).getTime() - new Date(t.servedAt).getTime()) / 60000) : '';
      return [
        t.number,
        t.status,
        t.service?.name || '',
        t.priorityType || 'REGULAR',
        new Date(t.createdAt).toLocaleString(),
        t.servedAt ? new Date(t.servedAt).toLocaleString() : '',
        t.completedAt ? new Date(t.completedAt).toLocaleString() : '',
        t.createdByUser?.name || '',
        t.servedByUser?.name || '',
        t.counter?.name || '',
        waitTime,
        serviceTime
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','); // Escape quotes
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tickets_export.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Failed to export tickets:', error);
    res.status(500).json({ error: 'Failed to export tickets' });
  }
};


module.exports = {
  getTickets,
  getHistory,
  getPostponedTickets,
  getWaitingTickets,
  getRecentCalled,
  getDisplayTickets,
  getMyServing,
  createTicket,
  bulkCreateTickets,
  deleteTicket,
  callTicket,
  updateTicketStatus,
  trackTicket,
  subscribeToPush,
  subscribeToSMS,
  autoAssignNext,
  checkInTicket,
  exportTickets: exports.exportTickets
};

