const logger = require('../utils/logger');
const prisma = require('../config/db');

/**
 * Records an immutable audit entry for a ticket state transition.
 */
async function logAudit({ ticketId, fromStatus, toStatus, performedBy = null, windowNumber = null, note = null }) {
  try {
    const tid = typeof ticketId === 'number' ? ticketId : parseInt(ticketId, 10);
    const actor = performedBy !== null && performedBy !== undefined ? String(performedBy) : null;
    const win = windowNumber !== null && windowNumber !== undefined && !Number.isNaN(parseInt(windowNumber, 10))
      ? parseInt(windowNumber, 10)
      : null;

    await prisma.queueAudit.create({
      data: {
        ticketId: tid,
        fromStatus: fromStatus ?? null,
        toStatus,
        performedBy: actor,
        windowNumber: win,
        note: note ?? null
      }
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to write audit entry:', err.message);
  }
}

module.exports = { logAudit };

