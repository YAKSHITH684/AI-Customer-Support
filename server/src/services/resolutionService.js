const Resolution = require('../models/Resolution');
const ResolutionLog = require('../models/ResolutionLog');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { runAgentChain } = require('../agents/orchestrator');
const { emitResolutionUpdate, emitTicketUpdate, emitNotification } = require('../config/socket');
const { logAgentStep } = require('../agents/monitoringAgent');

const getResolutionById = async (resolutionId) => {
  const resolution = await Resolution.findById(resolutionId)
    .populate('ticketId')
    .populate('approvedBy', 'name email');

  if (!resolution) {
    const error = new Error('Resolution not found.');
    error.statusCode = 404;
    throw error;
  }
  return resolution;
};

const getResolutionTimeline = async (resolutionId) => {
  const resolution = await Resolution.findById(resolutionId);
  if (!resolution) {
    const error = new Error('Resolution not found.');
    error.statusCode = 404;
    throw error;
  }

  const logs = await ResolutionLog.find({ resolutionId }).sort({ timestamp: 1 });
  return {
    resolution,
    logs
  };
};

const approveResolution = async (resolutionId, user) => {
  const resolution = await Resolution.findById(resolutionId);
  if (!resolution) {
    const error = new Error('Resolution not found.');
    error.statusCode = 404;
    throw error;
  }

  const ticket = await Ticket.findById(resolution.ticketId);
  if (!ticket) {
    const error = new Error('Associated ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  // Update resolution state
  resolution.status = 'AUTO_SENT';
  resolution.finalOutput = resolution.draftOutput;
  resolution.approvedBy = user.id || user._id;
  await resolution.save();

  // Convert draft message to active agent/ai message or send new message
  const draftMessage = await Message.findOne({ resolutionId: resolution._id, isAIDraft: true });
  if (draftMessage) {
    draftMessage.isAIDraft = false;
    draftMessage.content = resolution.finalOutput;
    draftMessage.sender = 'agent';
    draftMessage.senderUser = user.id || user._id;
    await draftMessage.save();
  } else {
    await Message.create({
      ticketId: ticket._id,
      sender: 'agent',
      senderUser: user.id || user._id,
      content: resolution.finalOutput,
      isAIDraft: false,
      sourceRefs: resolution.retrievedSources,
      resolutionId: resolution._id
    });
  }

  ticket.status = 'resolved';
  ticket.resolvedAt = new Date();
  ticket.assignedAgent = user.id || user._id;
  await ticket.save();

  await logAgentStep({
    resolutionId: resolution._id,
    ticketId: ticket._id,
    agent: 'monitoring',
    level: 'success',
    message: `Human Agent (${user.name || 'Agent'}) approved AI draft without changes. Ticket resolved.`,
    metadata: { approvedBy: user.id || user._id }
  });

  const populatedTicket = await Ticket.findById(ticket._id).populate('customer', 'name email').populate('assignedAgent', 'name email');
  emitResolutionUpdate(ticket._id, resolution);
  emitTicketUpdate(populatedTicket);

  return {
    success: true,
    resolution,
    ticket: populatedTicket
  };
};

const editResolution = async (resolutionId, editedContent, user) => {
  const resolution = await Resolution.findById(resolutionId);
  if (!resolution) {
    const error = new Error('Resolution not found.');
    error.statusCode = 404;
    throw error;
  }

  const ticket = await Ticket.findById(resolution.ticketId);
  if (!ticket) {
    const error = new Error('Associated ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  resolution.status = 'AUTO_SENT';
  resolution.finalOutput = editedContent;
  resolution.approvedBy = user.id || user._id;
  await resolution.save();

  const draftMessage = await Message.findOne({ resolutionId: resolution._id, isAIDraft: true });
  if (draftMessage) {
    draftMessage.isAIDraft = false;
    draftMessage.content = editedContent;
    draftMessage.sender = 'agent';
    draftMessage.senderUser = user.id || user._id;
    await draftMessage.save();
  } else {
    await Message.create({
      ticketId: ticket._id,
      sender: 'agent',
      senderUser: user.id || user._id,
      content: editedContent,
      isAIDraft: false,
      sourceRefs: resolution.retrievedSources,
      resolutionId: resolution._id
    });
  }

  ticket.status = 'resolved';
  ticket.resolvedAt = new Date();
  ticket.assignedAgent = user.id || user._id;
  await ticket.save();

  await logAgentStep({
    resolutionId: resolution._id,
    ticketId: ticket._id,
    agent: 'monitoring',
    level: 'success',
    message: `Human Agent (${user.name || 'Agent'}) edited AI draft and sent resolution.`,
    metadata: { editedBy: user.id || user._id, originalLength: resolution.draftOutput.length, editedLength: editedContent.length }
  });

  const populatedTicket = await Ticket.findById(ticket._id).populate('customer', 'name email').populate('assignedAgent', 'name email');
  emitResolutionUpdate(ticket._id, resolution);
  emitTicketUpdate(populatedTicket);

  return {
    success: true,
    resolution,
    ticket: populatedTicket
  };
};

const retryResolution = async (resolutionId, user) => {
  const resolution = await Resolution.findById(resolutionId);
  if (!resolution) {
    const error = new Error('Resolution not found.');
    error.statusCode = 404;
    throw error;
  }

  const ticket = await Ticket.findById(resolution.ticketId);
  if (!ticket) {
    const error = new Error('Associated ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  resolution.retryCount = (resolution.retryCount || 0) + 1;
  resolution.status = 'RETRYING';
  await resolution.save();

  await logAgentStep({
    resolutionId: resolution._id,
    ticketId: ticket._id,
    agent: 'orchestrator',
    level: 'info',
    message: `Resolution retry triggered (Attempt #${resolution.retryCount}).`,
    metadata: { retriedBy: user.id || user._id }
  });

  // Re-run the agent chain
  setImmediate(async () => {
    try {
      await runAgentChain({
        ticketId: ticket._id,
        messageId: resolution.messageId,
        customerQuery: resolution.customerQuery,
        userId: user.id || user._id
      });
    } catch (err) {
      console.error('Retry failed:', err);
    }
  });

  return {
    success: true,
    message: 'Resolution retry scheduled successfully.'
  };
};

const processResolutionJob = async (jobData) => {
  if (jobData.action === 'retry') {
    await retryResolution(jobData.resolutionId, { id: jobData.userId, name: 'System Worker' });
  }
};

module.exports = {
  getResolutionById,
  getResolutionTimeline,
  approveResolution,
  editResolution,
  retryResolution,
  processResolutionJob
};
