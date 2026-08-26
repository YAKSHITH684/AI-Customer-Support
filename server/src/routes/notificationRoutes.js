const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// List notifications
router.get('/', authenticate, notificationController.getNotifications);

// Mark single notification as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router;
