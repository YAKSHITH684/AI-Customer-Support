const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  resolutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resolution',
    default: null
  },
  agentId: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  confidenceScore: {
    type: Number,
    default: 1.0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
