const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/postponed', ticketController.getPostponedTickets);
router.get('/waiting', ticketController.getWaitingTickets);
router.get('/recent-called', ticketController.getRecentCalled);
router.get('/my-serving/:userId', verifyToken, ticketController.getMyServing);
router.post('/', verifyToken, ticketController.createTicket);
router.delete('/:id', verifyToken, ticketController.deleteTicket);
router.put('/:id/call', verifyToken, ticketController.callTicket);
router.put('/:id/status', verifyToken, ticketController.updateTicketStatus);

module.exports = router;
