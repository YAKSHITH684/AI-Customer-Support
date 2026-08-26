const pdfParse = require('pdf-parse');
const fs = require('fs');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const config = require('../config/env');

/**
 * Deterministic local embedding vector generator (128-dimensional semantic hash & bag-of-ngrams)
 * Used when external embedding API is not configured or as instant fallback.
 */
const generateLocalEmbedding = (text) => {
  const dim = 128;
  const vector = new Array(dim).fill(0);
  if (!text) return vector;

  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  words.forEach((word, wordIdx) => {
    // Hash individual words and character 3-grams
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    const weight = 1.0 + (1.0 / (wordIdx + 1));
    vector[idx] += weight;

    // Sub-word ngrams
    if (word.length >= 4) {
      for (let j = 0; j <= word.length - 3; j++) {
        const sub = word.substring(j, j + 3);
        let subHash = 0;
        for (let k = 0; k < sub.length; k++) {
          subHash = (subHash << 5) - subHash + sub.charCodeAt(k);
          subHash |= 0;
        }
        vector[Math.abs(subHash) % dim] += 0.5;
      }
    }
  });

  // L2 Normalization
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = Number((vector[i] / magnitude).toFixed(6));
    }
  }
  return vector;
};

/**
 * Generate embedding using Gemini if key is present, else local semantic vector
 */
const generateEmbedding = async (text) => {
  if (config.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text.slice(0, 2048));
      if (result.embedding?.values) {
        return result.embedding.values;
      }
    } catch (err) {
      console.warn('Gemini embedding failed, using local embedding fallback:', err.message);
    }
  }
  return generateLocalEmbedding(text);
};

/**
 * Cosine similarity between two vector arrays
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  
  // If dimensions match, standard dot product (assuming normalized)
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const minLen = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Number((dotProduct / denominator).toFixed(4));
};

/**
 * Chunk text recursively with overlap
 */
const chunkText = (text, chunkSize = 600, overlap = 100) => {
  const chunks = [];
  if (!text) return chunks;

  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 1 <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // Overlap from end of current chunk
        const words = currentChunk.split(' ');
        const overlapText = words.slice(-Math.floor(overlap / 6)).join(' ');
        currentChunk = overlapText ? `${overlapText}\n\n${trimmed}` : trimmed;
      } else {
        // Single paragraph larger than chunkSize
        let start = 0;
        while (start < trimmed.length) {
          chunks.push(trimmed.slice(start, start + chunkSize));
          start += chunkSize - overlap;
        }
      }
    }
  }

  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Ingest and process document chunking and vector storage
 */
const processDocumentChunking = async (documentId) => {
  const doc = await KnowledgeDocument.findById(documentId);
  if (!doc) {
    console.error(`Document not found: ${documentId}`);
    return;
  }

  try {
    let contentToChunk = doc.rawContent || '';

    // If PDF file exists, extract text
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      const dataBuffer = fs.readFileSync(doc.filePath);
      const pdfData = await pdfParse(dataBuffer);
      contentToChunk = pdfData.text || '';
      doc.rawContent = contentToChunk;
    }

    if (!contentToChunk.trim()) {
      doc.status = 'failed';
      doc.errorMessage = 'No readable text content extracted from document.';
      await doc.save();
      return;
    }

    // Delete any previous chunks for this document
    await KnowledgeChunk.deleteMany({ documentId: doc._id });

    // Chunk text
    const textChunks = chunkText(contentToChunk, 600, 100);
    const chunkDocs = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunkTextContent = textChunks[i];
      const embedding = await generateEmbedding(chunkTextContent);

      chunkDocs.push({
        documentId: doc._id,
        chunkIndex: i,
        content: chunkTextContent,
        embedding,
        tokens: Math.ceil(chunkTextContent.length / 4),
        metadata: {
          title: doc.title,
          section: `Chunk #${i + 1}`,
          sourceType: doc.sourceType,
          category: doc.category
        }
      });
    }

    if (chunkDocs.length > 0) {
      await KnowledgeChunk.insertMany(chunkDocs);
    }

    doc.chunkCount = chunkDocs.length;
    doc.status = 'ready';
    doc.errorMessage = null;
    await doc.save();

    console.log(`✅ Processed knowledge document "${doc.title}": ${chunkDocs.length} chunks indexed.`);
  } catch (error) {
    console.error(`❌ Error chunking document ${doc.title}:`, error);
    doc.status = 'failed';
    doc.errorMessage = error.message;
    await doc.save();
  }
};

/**
 * Vector similarity search against all knowledge chunks
 */
const searchSimilarChunks = async (queryText, topK = 4) => {
  const queryEmbedding = await generateEmbedding(queryText);
  const chunks = await KnowledgeChunk.find().populate('documentId', 'title sourceType category');

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // Compute similarity score for each chunk
  const scoredChunks = chunks.map((chunk) => {
    let score = 0;
    if (chunk.embedding && chunk.embedding.length > 0) {
      score = cosineSimilarity(queryEmbedding, chunk.embedding);
    }

    // Keyword boost: direct term matches in chunk text
    const queryTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const chunkLower = chunk.content.toLowerCase();
    let termMatchCount = 0;
    queryTerms.forEach(term => {
      if (chunkLower.includes(term)) termMatchCount++;
    });

    const keywordBoost = queryTerms.length > 0 ? (termMatchCount / queryTerms.length) * 0.3 : 0;
    const finalScore = Math.min(1.0, score + keywordBoost);

    return {
      chunkId: chunk._id,
      documentId: chunk.documentId?._id,
      documentTitle: chunk.documentId?.title || chunk.metadata?.title || 'Knowledge Base Doc',
      sourceType: chunk.documentId?.sourceType || chunk.metadata?.sourceType || 'faq',
      section: chunk.metadata?.section || `Chunk #${chunk.chunkIndex + 1}`,
      content: chunk.content,
      relevanceScore: Number(finalScore.toFixed(3)),
      metadata: chunk.metadata
    };
  });

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredChunks.slice(0, topK);
};

module.exports = {
  generateEmbedding,
  generateLocalEmbedding,
  cosineSimilarity,
  chunkText,
  processDocumentChunking,
  searchSimilarChunks
};
