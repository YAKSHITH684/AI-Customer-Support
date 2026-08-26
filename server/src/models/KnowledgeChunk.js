const mongoose = require('mongoose');

const knowledgeChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeDocument',
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    default: [],
    select: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  metadata: {
    title: String,
    section: String,
    pageNumber: Number,
    sourceType: String,
    category: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
