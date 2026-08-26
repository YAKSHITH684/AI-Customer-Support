const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  sourceType: {
    type: String,
    enum: ['pdf', 'faq', 'policy', 'macro'],
    default: 'faq'
  },
  category: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
    index: true
  },
  rawContent: {
    type: String,
    default: ''
  },
  filePath: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  chunkCount: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
