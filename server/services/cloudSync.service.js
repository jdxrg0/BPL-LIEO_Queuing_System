const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

let db = null;
let isOffline = false;

// Initialize Firebase Admin
try {
  const serviceAccount = require(path.join(__dirname, '../config/serviceAccountKey.json'));
  
  const app = initializeApp({
    credential: cert(serviceAccount)
  });
  
  db = getFirestore(app);
  console.log('Firebase Admin initialized successfully.');
} catch (error) {
  console.warn('Firebase Admin failed to initialize. Cloud Sync will be disabled.', error.message);
}

/**
 * Synchronize a ticket to the cloud (Firestore).
 * Called when a ticket is created or its status updates to WAITING or SERVING.
 * @param {Object} ticket - The ticket object from Prisma
 */
const syncTicket = async (ticket) => {
  if (!db) return; // Skip if Firebase is not configured

  try {
    // Only sync essential data for the public tracker
    const syncData = {
      id: ticket.id,
      number: ticket.number,
      status: ticket.status,
      priorityType: ticket.priorityType,
      serviceId: ticket.serviceId,
      counterId: ticket.counterId || null,
      updatedAt: FieldValue.serverTimestamp()
    };

    // Use ticket.id as the document ID for easy reference
    await db.collection('live_tickets').doc(ticket.id.toString()).set(syncData, { merge: true });
    
    if (isOffline) {
      console.log('Cloud Sync: Reconnected and synced ticket', ticket.number);
      isOffline = false;
    }
  } catch (error) {
    if (!isOffline) {
      console.warn('Cloud Sync Error: Could not sync ticket (possibly offline)', error.message);
      isOffline = true;
    }
    // We swallow the error so it doesn't crash the local LAN system
  }
};

/**
 * Remove a ticket from the cloud.
 * Called when a ticket is COMPLETED or NO_SHOW to keep the cloud db small.
 * @param {number} ticketId - The ID of the ticket
 */
const removeTicket = async (ticketId) => {
  if (!db) return;

  try {
    await db.collection('live_tickets').doc(ticketId.toString()).delete();
  } catch (error) {
    console.warn(`Cloud Sync Error: Could not remove ticket ${ticketId}`, error.message);
  }
};

/**
 * Perform an initial catch-up sync of all active tickets on server startup.
 */
const catchUpSync = async (prisma) => {
  if (!db) return;
  
  console.log('Cloud Sync: Performing catch-up sync...');
  try {
    const activeTickets = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['WAITING', 'SERVING']
        }
      }
    });

    for (const ticket of activeTickets) {
      await syncTicket(ticket);
    }
    
    console.log(`Cloud Sync: Catch-up complete. Synced ${activeTickets.length} active tickets.`);
  } catch (error) {
    console.warn('Cloud Sync: Catch-up failed (possibly offline).', error.message);
  }
};

module.exports = {
  syncTicket,
  removeTicket,
  catchUpSync
};
