const express = require('express');
const { body } = require('express-validator');
const resolutionController = require('../controllers/resolutionController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Fetch single resolution
router.get('/:id', authenticate, resolutionController.getResolutionById);

// Fetch resolution timeline logs
router.get('/:id/timeline', authenticate, resolutionController.getResolutionTimeline);

// Approve AI draft as-is
router.post('/:id/approve', authenticate, requireRole('admin', 'agent'), resolutionController.approveResolution);

// Edit AI draft and send
router.post(
  '/:id/edit',
  authenticate,
  requireRole('admin', 'agent'),
  [
    body('content').trim().notEmpty().withMessage('Response content cannot be empty')
  ],
  resolutionController.editResolution
);

// Retry resolution agent chain
router.post('/:id/retry', authenticate, requireRole('admin', 'agent'), resolutionController.retryResolution);

module.exports = router;
