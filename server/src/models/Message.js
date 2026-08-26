const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['customer', 'agent', 'ai'],
    required: true
  },
  senderUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  isAIDraft: {
    type: Boolean,
    default: false
  },
  sourceRefs: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument'
    },
    title: String,
    section: String,
    snippet: String,
    relevanceScore: Number
  }],
  confidenceScore: {
    type: Number,
    default: null
  },
  resolutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resolution',
    default: null
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
