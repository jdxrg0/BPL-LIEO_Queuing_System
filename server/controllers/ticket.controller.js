const prisma = require('../config/db');
const socketConfig = require('../config/socket');
const { autoBalanceCounters } = require('./meta.controller');
const { syncTicket, removeTicket, getDb } = require('../services/cloudSync.service');

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
      autoBalanceThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, serviceId, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    const scoredQueue = calculateSmartScores(fullQueue, priorityGroups, settings, recentTickets);
    scoredQueue.sort((a, b) => b.score - a.score);

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
        } catch (err) {
          console.error(`Push failed for ticket ${ticket.number}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('Error notifying approaching tickets:', error);
  }
};

const getWaitingTickets = async (req, res) => {
  try {
    let tickets = await prisma.ticket.findMany({
      where: { status: 'WAITING' },
      include: { service: true },
      orderBy: { createdAt: 'asc' }
    });
    
    // 1. Fetch Config
    const priorityGroups = await prisma.priorityGroup.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } }) || {
      autoBalanceThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    
    // 2. Fetch Recent Tickets for Zipper Engine
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    // 3. Delegate to the Pure Utility Engine
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

const createTicket = async (req, res) => {
  try {
    if (req.user && req.user.role === 'STAFF') {
      return res.status(403).json({ error: 'Staff members are not allowed to create tickets' });
    }
    
    const { serviceId, createdByUserId, priorityType } = req.body;
    
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastTicket = await prisma.ticket.findFirst({
      where: { serviceId, createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' }
    });
    
    let nextSeq = 1;
    if (lastTicket && lastTicket.number) {
      const parts = lastTicket.number.split('-');
      if (parts.length >= 2) {
        nextSeq = parseInt(parts[parts.length - 1], 10) + 1;
      }
    }
    
    const dateStr = String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0') + 
                    String(today.getFullYear()).slice(-2);
    
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
      autoBalanceThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
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

    const ticket = await prisma.ticket.create({
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

    socketConfig.getIo().emit('ticketCreated', ticket);

    if (settings?.autoAdaptive) {
      await autoBalanceCounters(null, null);
    }

    // Sync to Cloud for Live Tracker (Non-blocking)
    syncTicket(ticket);

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

const callTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { counterId, servedByUserId } = req.body;

    const existingTicket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!existingTicket) return res.status(404).json({ error: 'Ticket not found' });

    const isRecall = existingTicket.status === 'SERVING';
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
        await autoBalanceCounters(null, null);
      }
    }

    socketConfig.getIo().emit('ticketCalled', ticket);

    // Send Push Notification if they are subscribed!
    if (!isRecall) {
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
          await webpush.sendNotification(sub, JSON.stringify({
            title: 'It is your turn!',
            body: `Your ticket ${ticket.number} has been called. Please proceed to Counter ${counterId}.`,
            url: `/?ticket=${ticket.number}`,
            ticketNumber: ticket.number
          }));
          
          await prisma.ticket.update({ where: { id: ticket.id }, data: { pushSubscription: null } });
          if (db) await db.collection('live_tickets').doc(ticket.id.toString()).set({ pushSubscription: null }, { merge: true });
        }
      } catch (err) {
        console.error(`Push failed for called ticket ${ticket.number}:`, err);
      }
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

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        ...(status === 'WAITING' || status === 'POSTPONED' ? { servedByUserId: null, counterId: null, servedAt: null } : {})
      }
    });

    socketConfig.getIo().emit('queueUpdated');

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.autoAdaptive) {
      await autoBalanceCounters(null, null);
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
      autoBalanceThreshold: 15, zipperRatio: 3, agingRate: 0.1, skipLimit: 5
    };
    const recentTickets = await prisma.ticket.findMany({
      where: { status: { in: ['COMPLETED', 'SERVING'] }, serviceId: ticket.serviceId, servedAt: { not: null } },
      orderBy: { servedAt: 'desc' },
      take: 50
    });

    // Score the entire queue
    const scoredQueue = calculateSmartScores(existingQueue, priorityGroups, settings, recentTickets);
    // Sort descending by score
    scoredQueue.sort((a, b) => b.score - a.score);

    // Find this ticket's true rank
    const rankIndex = scoredQueue.findIndex(t => t.id === ticket.id);
    const trueRank = rankIndex !== -1 ? rankIndex + 1 : scoredQueue.length;

    // Get Active Capacity and Team Average
    const { activeCount, activeUserIds } = await getActiveStaffProfiles(ticket.service.prefix);
    const avgServiceTimeMins = await getDynamicAverageServiceTime(ticket.serviceId, activeUserIds);

    const estimatedWaitMins = Math.round((trueRank / activeCount) * avgServiceTimeMins);

    res.json({ ticket, trueRank, estimatedWaitMins });
  } catch (error) {
    console.error('Error tracking ticket:', error);
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
      } catch (err) {
        console.warn('Could not sync push subscription to Firebase:', err.message);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
};

module.exports = {
  getPostponedTickets,
  getWaitingTickets,
  getRecentCalled,
  getMyServing,
  createTicket,
  deleteTicket,
  callTicket,
  updateTicketStatus,
  trackTicket,
  subscribeToPush
};
