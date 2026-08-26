const mongoose = require('mongoose');

const resolutionLogSchema = new mongoose.Schema({
  resolutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resolution',
    required: true,
    index: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  agent: {
    type: String,
    enum: ['retrieval', 'drafting', 'confidence', 'escalation', 'monitoring', 'orchestrator'],
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResolutionLog', resolutionLogSchema);
