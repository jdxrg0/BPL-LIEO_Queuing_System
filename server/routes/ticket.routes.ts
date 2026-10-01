// @ts-nocheck
export {};
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createTicketSchema, callTicketSchema } = require('../validations/ticket.schema');

router.get('/', verifyToken, ticketController.getTickets);
router.get('/history', verifyToken, ticketController.getHistory);
router.get('/display', ticketController.getDisplayTickets);
router.get('/postponed', ticketController.getPostponedTickets);
router.get('/waiting', ticketController.getWaitingTickets);
router.get('/recent-called', ticketController.getRecentCalled);
router.get('/my-serving/:userId', verifyToken, ticketController.getMyServing);

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new queue ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: The ID of the service (e.g., 1 for New Business)
 *               priorityType:
 *                 type: string
 *                 enum: [REGULAR, PWD, SENIOR, PREGNANT, RETURNING]
 *                 description: Priority classification
 *     responses:
 *       200:
 *         description: Successfully created the ticket
 *       400:
 *         description: Validation error or Database error
 */
// Zod validates the body BEFORE it reaches the controller!
router.post('/', verifyToken, validate(createTicketSchema), ticketController.createTicket);
router.post('/bulk', verifyToken, ticketController.bulkCreateTickets);
router.post('/checkin/:number', verifyToken, ticketController.checkInTicket);
router.delete('/:id', verifyToken, ticketController.deleteTicket);

// Validates the params (id) and body (counterId)
router.put('/:id/call', verifyToken, validate(callTicketSchema), ticketController.callTicket);
router.put('/:id/status', verifyToken, ticketController.updateTicketStatus);
router.get('/track/:number', ticketController.trackTicket);
router.post('/track/:number/subscribe', ticketController.subscribeToPush);
router.post('/track/:number/sms', ticketController.subscribeToSMS);
router.get('/export', verifyToken, ticketController.exportTickets);

// Auto-assign: SmartQueueEngine picks the best waiting ticket for the caller's window
router.post('/auto-assign', verifyToken, ticketController.autoAssignNext);

module.exports = router;


