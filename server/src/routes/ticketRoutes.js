const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Dashboard aggregated metrics
router.get('/dashboard', authenticate, ticketController.getDashboard);

// Ticket list & filters
router.get('/', authenticate, ticketController.getTickets);

// Create new ticket
router.post(
  '/',
  authenticate,
  [
    body('subject').trim().notEmpty().withMessage('Ticket subject is required'),
    body('description').trim().notEmpty().withMessage('Ticket description is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
  ],
  ticketController.createTicket
);

// Get single ticket thread
router.get('/:id', authenticate, ticketController.getTicketById);

// Add message to ticket thread (triggers agent chain on customer message)
router.post(
  '/:id/messages',
  authenticate,
  [
    body('content').trim().notEmpty().withMessage('Message content is required')
  ],
  ticketController.addMessage
);

// Update ticket status/priority/assignment
router.put('/:id', authenticate, ticketController.updateTicket);

// Escalate ticket to human agent
router.post('/:id/escalate', authenticate, ticketController.escalateTicket);

// Mark ticket as resolved
router.post('/:id/resolve', authenticate, ticketController.resolveTicket);

// Admin only: Delete ticket
router.delete('/:id', authenticate, requireRole('admin'), ticketController.deleteTicket);

module.exports = router;
