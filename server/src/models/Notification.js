const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  },
  resolutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resolution',
    default: null
  },
  type: {
    type: String,
    enum: ['ESCALATION', 'AUTO_RESOLVED', 'SLA_WARNING', 'CUSTOMER_REPLY', 'INTEGRATION_ALERT', 'SYSTEM'],
    default: 'SYSTEM',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
