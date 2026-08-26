const ResolutionLog = require('../models/ResolutionLog');
const { emitAgentEvent } = require('../config/socket');

/**
 * Monitoring Agent
 * Records persistent audit logs for agent steps and broadcasts real-time telemetry over Socket.IO
 */
const logAgentStep = async ({ resolutionId, ticketId, agent, level = 'info', message, metadata = {} }) => {
  try {
    const logDoc = await ResolutionLog.create({
      resolutionId,
      ticketId,
      agent,
      level,
      message,
      metadata
    });

    // Real-time event broadcast to connected frontend subscribers
    emitAgentEvent(ticketId, {
      id: logDoc._id,
      resolutionId,
      ticketId,
      agent,
      level,
      message,
      metadata,
      timestamp: logDoc.timestamp
    });

    return logDoc;
  } catch (error) {
    console.error('Monitoring Agent failed to write log:', error.message);
    return null;
  }
};

module.exports = {
  logAgentStep
};
