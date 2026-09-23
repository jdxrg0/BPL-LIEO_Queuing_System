const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const prisma = require('../config/db');

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
      // Trigger a full catch-up sync in the background to push any missed tickets
      catchUpSync().catch(err => console.error("Offline recovery sync failed:", err.message));
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
const catchUpSync = async (prismaInstance = prisma) => {
  if (!db) return;
  
  console.log('Cloud Sync: Performing catch-up sync...');
  try {
    const activeTickets = await prismaInstance.ticket.findMany({
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
    
    // Run automated cleanup of tickets older than 24h
    await autoCleanupOldCloudTickets();
  } catch (error) {
    console.warn('Cloud Sync: Catch-up failed (possibly offline).', error.message);
  }
};

/**
 * Automatically clean up Firebase tickets that are older than 24 hours.
 * This ensures the free database never gets full, without the user having to do anything.
 */
const autoCleanupOldCloudTickets = async () => {
  if (!db) return;
  try {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    // Convert to Firestore Timestamp
    const firestoreTimestamp = require('firebase-admin/firestore').Timestamp.fromDate(yesterday);

    const snapshot = await db.collection('live_tickets')
      .where('updatedAt', '<', firestoreTimestamp)
      .get();
      
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cloud Sync: Automatically cleaned up ${snapshot.docs.length} old tickets from Firebase.`);
  } catch (error) {
    console.warn('Cloud Sync Error: Auto-cleanup failed', error.message);
  }
};

/**
 * Clear the entire live_tickets collection from Firebase.
 * Called when the Admin clicks "Reset All Data".
 */
const clearCloudDatabase = async () => {
  if (!db) return;

  try {
    const snapshot = await db.collection('live_tickets').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cloud Sync: Cleared ${snapshot.docs.length} tickets from Firebase.`);
  } catch (error) {
    console.error('Cloud Sync Error: Failed to clear database', error.message);
  }
};

/**
 * Sync branding settings (logo, website name) to Firebase.
 * Stored in `live_tickets/__settings__` so it shares the same security rules
 * as the ticket data (which already allows public reads from Vercel).
 */
const syncSettings = async (settings) => {
  if (!db) return;

  try {
    await db.collection('live_tickets').doc('__settings__').set({
      logoBase64: settings.logoBase64 || '',
      websiteName: settings.websiteName || 'BPLO Queuing System',
      _type: 'settings', // marker to distinguish from real tickets
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Cloud Sync: Synced branding settings to Firebase.');
  } catch (error) {
    console.warn('Cloud Sync Error: Could not sync settings', error.message);
  }
};

module.exports = {
  syncTicket,
  removeTicket,
  catchUpSync,
  clearCloudDatabase,
  syncSettings
};
