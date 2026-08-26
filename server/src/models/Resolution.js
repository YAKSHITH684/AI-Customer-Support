const mongoose = require('mongoose');

const resolutionSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  customerQuery: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: [
      'PENDING',
      'RETRIEVING',
      'DRAFTING',
      'AWAITING_APPROVAL',
      'AUTO_SENT',
      'ESCALATED',
      'FAILED',
      'RETRYING',
      'CANCELLED'
    ],
    default: 'PENDING',
    index: true
  },
  confidenceScore: {
    type: Number,
    default: 0
  },
  escalationReason: {
    type: String,
    enum: [
      null,
      'NO_RELEVANT_CONTEXT',
      'AMBIGUOUS_QUERY',
      'NEGATIVE_SENTIMENT',
      'POLICY_SENSITIVE',
      'LOW_CONFIDENCE',
      'MANUAL_ESCALATION'
    ],
    default: null
  },
  retrievedContextSnapshot: [{
    documentId: mongoose.Schema.Types.ObjectId,
    documentTitle: String,
    chunkId: mongoose.Schema.Types.ObjectId,
    content: String,
    relevanceScore: Number,
    metadata: mongoose.Schema.Types.Mixed
  }],
  retrievedSources: [{
    title: String,
    section: String,
    snippet: String,
    relevanceScore: Number
  }],
  draftOutput: {
    type: String,
    default: ''
  },
  finalOutput: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  error: {
    type: String,
    default: null
  },
  errorCode: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // duration in milliseconds
    default: 0
  },
  retryCount: {
    type: Number,
    default: 0
  },
  ragPipeline: {
    type: String,
    enum: ['available', 'not-installed'],
    default: 'available'
  },
  aiProvider: {
    type: String,
    default: 'deterministic' // 'openrouter' | 'gemini' | 'deterministic'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resolution', resolutionSchema);
