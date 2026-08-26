const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const config = require('../config/env');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');

let embeddingQueue = null;
let isUsingRedis = false;

// Initialize BullMQ Queue if Redis URL is configured
if (config.REDIS_URL) {
  try {
    const connection = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true
    });

    connection.connect().then(() => {
      isUsingRedis = true;
      embeddingQueue = new Queue('embeddingQueue', { connection });
      console.log('✅ BullMQ Embedding Queue connected to Redis.');

      // Worker for Redis queue
      new Worker('embeddingQueue', async (job) => {
        const { processDocumentChunking } = require('../services/embeddingService');
        await processDocumentChunking(job.data.documentId);
      }, { connection });
    }).catch(err => {
      console.warn('⚠️  Redis connection failed, using in-memory embedding queue:', err.message);
    });
  } catch (err) {
    console.warn('⚠️  Failed to setup BullMQ embedding queue, using in-memory fallback:', err.message);
  }
}

/**
 * Add document embedding job
 * @param {string} documentId 
 */
const addEmbeddingJob = async (documentId) => {
  if (isUsingRedis && embeddingQueue) {
    await embeddingQueue.add('processDocument', { documentId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  } else {
    // In-memory async job execution
    setImmediate(async () => {
      try {
        const { processDocumentChunking } = require('../services/embeddingService');
        await processDocumentChunking(documentId);
      } catch (err) {
        console.error(`❌ In-memory embedding job failed for doc ${documentId}:`, err);
      }
    });
  }
};

module.exports = {
  addEmbeddingJob
};
