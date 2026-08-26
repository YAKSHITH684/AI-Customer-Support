const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'escalated', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    default: 'General Support',
    trim: true
  },
  channel: {
    type: String,
    enum: ['email', 'widget', 'manual'],
    default: 'manual'
  },
  tags: [{
    type: String,
    trim: true
  }],
  slaMinutes: {
    type: Number,
    default: 120 // 2 hours default SLA
  },
  slaDueAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000)
  },
  activeResolution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resolution',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Auto-generate ticket number if not provided
ticketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `RF-${1000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
