const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const Resolution = require('../models/Resolution');
const { addEmbeddingJob } = require('../queues/embeddingQueue');
const { searchSimilarChunks } = require('../services/embeddingService');
const { validationResult } = require('express-validator');

const getDocuments = async (req, res, next) => {
  try {
    const { search, category, sourceType, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (sourceType) query.sourceType = sourceType;
    if (status) query.status = status;

    const documents = await KnowledgeDocument.find(query)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });

    const totalDocuments = await KnowledgeDocument.countDocuments();
    const totalChunks = await KnowledgeChunk.countDocuments();
    const readyDocuments = await KnowledgeDocument.countDocuments({ status: 'ready' });

    return res.status(200).json({
      success: true,
      stats: {
        totalDocuments,
        readyDocuments,
        totalChunks
      },
      documents
    });
  } catch (error) {
    next(error);
  }
};

const createDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, sourceType = 'faq', category = 'General', rawContent } = req.body;
    let filePath = null;
    let fileSize = 0;
    let content = rawContent || '';

    if (req.file) {
      filePath = req.file.path;
      fileSize = req.file.size;
    }

    const document = await KnowledgeDocument.create({
      owner: req.user.id || req.user._id,
      title,
      description,
      sourceType,
      category,
      rawContent: content,
      filePath,
      fileSize,
      status: 'processing'
    });

    // Queue chunking and embedding job
    await addEmbeddingJob(document._id);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded. Chunking and vector indexing job queued.',
      document
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentStatus = async (req, res, next) => {
  try {
    const document = await KnowledgeDocument.findById(req.params.id).populate('owner', 'name email');
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const chunks = await KnowledgeChunk.find({ documentId: document._id })
      .select('chunkIndex tokens metadata content')
      .sort({ chunkIndex: 1 });

    return res.status(200).json({
      success: true,
      document,
      chunksCount: chunks.length,
      chunks
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const document = await KnowledgeDocument.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    await KnowledgeChunk.deleteMany({ documentId: document._id });

    return res.status(200).json({
      success: true,
      message: `Document "${document.title}" and its ${document.chunkCount} vector chunks deleted.`
    });
  } catch (error) {
    next(error);
  }
};

const searchKnowledgeBase = async (req, res, next) => {
  try {
    const { query, limit = 4 } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query string is required.' });
    }

    const results = await searchSimilarChunks(query, parseInt(limit, 10));
    return res.status(200).json({
      success: true,
      query,
      resultsCount: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

const getKnowledgeGaps = async (req, res, next) => {
  try {
    // Aggregate resolutions with low confidence or no relevant context
    const gaps = await Resolution.find({
      $or: [
        { escalationReason: 'NO_RELEVANT_CONTEXT' },
        { confidenceScore: { $lt: 0.60 } }
      ]
    })
      .populate('ticketId', 'subject ticketNumber priority createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      count: gaps.length,
      gaps: gaps.map(g => ({
        id: g._id,
        ticketId: g.ticketId?._id,
        ticketNumber: g.ticketId?.ticketNumber || 'N/A',
        subject: g.ticketId?.subject || 'Direct Query',
        customerQuery: g.customerQuery,
        confidenceScore: g.confidenceScore,
        escalationReason: g.escalationReason || 'LOW_CONFIDENCE',
        createdAt: g.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocuments,
  createDocument,
  getDocumentStatus,
  deleteDocument,
  searchKnowledgeBase,
  getKnowledgeGaps
};
