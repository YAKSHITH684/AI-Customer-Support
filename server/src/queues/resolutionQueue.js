const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const config = require('../config/env');

let resolutionQueue = null;
let isUsingRedis = false;

if (config.REDIS_URL) {
  try {
    const connection = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true
    });

    connection.connect().then(() => {
      isUsingRedis = true;
      resolutionQueue = new Queue('resolutionQueue', { connection });
      console.log('✅ BullMQ Resolution Queue connected to Redis.');

      new Worker('resolutionQueue', async (job) => {
        const { processResolutionJob } = require('../services/resolutionService');
        await processResolutionJob(job.data);
      }, { connection });
    }).catch(err => {
      console.warn('⚠️  Redis connection failed, using in-memory resolution queue:', err.message);
    });
  } catch (err) {
    console.warn('⚠️  Failed to setup BullMQ resolution queue, using in-memory fallback:', err.message);
  }
}

/**
 * Queue a background resolution retry or agent execution
 * @param {object} payload 
 */
const addResolutionJob = async (payload) => {
  if (isUsingRedis && resolutionQueue) {
    await resolutionQueue.add('executeResolution', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  } else {
    // In-memory async fallback
    setImmediate(async () => {
      try {
        const { processResolutionJob } = require('../services/resolutionService');
        await processResolutionJob(payload);
      } catch (err) {
        console.error('❌ In-memory resolution job error:', err);
      }
    });
  }
};

module.exports = {
  addResolutionJob
};
