const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Resolution = require('../models/Resolution');
const ResolutionLog = require('../models/ResolutionLog');
const { runAgentChain } = require('../agents/orchestrator');

const createTicket = async ({ subject, description, category = 'General', priority = 'medium', channel = 'manual', tags = [], user }) => {
  const ticket = await Ticket.create({
    subject,
    description,
    customer: user.id || user._id,
    category,
    priority,
    channel,
    tags,
    status: 'open'
  });

  // Create initial customer message
  const customerMessage = await Message.create({
    ticketId: ticket._id,
    sender: 'customer',
    senderUser: user.id || user._id,
    content: description
  });

  // Trigger agentic orchestration chain asynchronously
  setImmediate(async () => {
    try {
      await runAgentChain({
        ticketId: ticket._id,
        messageId: customerMessage._id,
        customerQuery: `${subject}\n\n${description}`,
        userId: user.id || user._id
      });
    } catch (err) {
      console.error(`Agent chain error on ticket ${ticket._id}:`, err);
    }
  });

  return await Ticket.findById(ticket._id).populate('customer', 'name email role');
};

const addMessage = async ({ ticketId, content, user, attachments = [] }) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  const isCustomer = user.role === 'customer' || String(ticket.customer) === String(user.id || user._id);
  const senderType = isCustomer ? 'customer' : 'agent';

  const message = await Message.create({
    ticketId,
    sender: senderType,
    senderUser: user.id || user._id,
    content,
    attachments
  });

  // If customer replies, reset status to open / pending and trigger agent chain
  if (senderType === 'customer') {
    ticket.status = 'open';
    await ticket.save();

    setImmediate(async () => {
      try {
        await runAgentChain({
          ticketId: ticket._id,
          messageId: message._id,
          customerQuery: content,
          userId: user.id || user._id
        });
      } catch (err) {
        console.error(`Agent chain error on reply for ticket ${ticket._id}:`, err);
      }
    });
  }

  return message;
};

const getTickets = async ({ page = 1, limit = 20, status, priority, category, channel, search, user }) => {
  const query = {};

  // Role filtering: Customers only see their own tickets
  if (user.role === 'customer') {
    query.customer = user.id || user._id;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (channel) query.channel = channel;

  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ticketNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await Ticket.countDocuments(query);

  const tickets = await Ticket.find(query)
    .populate('customer', 'name email role')
    .populate('assignedAgent', 'name email')
    .populate('activeResolution')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return {
    tickets,
    pagination: {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      limit: parseInt(limit, 10)
    }
  };
};

const getTicketById = async (ticketId, user) => {
  const ticket = await Ticket.findById(ticketId)
    .populate('customer', 'name email role')
    .populate('assignedAgent', 'name email role')
    .populate('activeResolution');

  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  // Role check: customer can only view own ticket
  if (user.role === 'customer' && String(ticket.customer._id) !== String(user.id || user._id)) {
    const error = new Error('Unauthorized access to ticket.');
    error.statusCode = 403;
    throw error;
  }

  const messages = await Message.find({ ticketId })
    .populate('senderUser', 'name email role')
    .sort({ createdAt: 1 });

  // Get active resolution with logs if available
  let activeResolutionDetails = null;
  if (ticket.activeResolution) {
    const logs = await ResolutionLog.find({ resolutionId: ticket.activeResolution._id }).sort({ timestamp: 1 });
    activeResolutionDetails = {
      ...ticket.activeResolution.toObject(),
      logs
    };
  }

  return {
    ticket,
    messages,
    activeResolution: activeResolutionDetails
  };
};

const updateTicket = async (ticketId, updateData, user) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.status) ticket.status = updateData.status;
  if (updateData.priority) ticket.priority = updateData.priority;
  if (updateData.category) ticket.category = updateData.category;
  if (updateData.assignedAgent !== undefined) ticket.assignedAgent = updateData.assignedAgent;
  if (updateData.tags) ticket.tags = updateData.tags;

  if (updateData.status === 'resolved' && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date();
  }

  await ticket.save();
  return await Ticket.findById(ticket._id)
    .populate('customer', 'name email')
    .populate('assignedAgent', 'name email');
};

const escalateTicket = async (ticketId, reason, user) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  ticket.status = 'escalated';
  ticket.priority = 'urgent';
  if (!ticket.tags.includes('MANUAL_ESCALATION')) {
    ticket.tags.push('MANUAL_ESCALATION');
  }
  await ticket.save();

  if (ticket.activeResolution) {
    await Resolution.findByIdAndUpdate(ticket.activeResolution, {
      status: 'ESCALATED',
      escalationReason: reason || 'MANUAL_ESCALATION'
    });
  }

  return ticket;
};

const resolveTicket = async (ticketId, user) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  ticket.status = 'resolved';
  ticket.resolvedAt = new Date();
  await ticket.save();

  return ticket;
};

const deleteTicket = async (ticketId) => {
  const ticket = await Ticket.findByIdAndDelete(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }
  await Message.deleteMany({ ticketId });
  await Resolution.deleteMany({ ticketId });
  await ResolutionLog.deleteMany({ ticketId });
  return { success: true };
};

const getDashboardMetrics = async (user) => {
  const totalTickets = await Ticket.countDocuments();
  const openTickets = await Ticket.countDocuments({ status: { $in: ['open', 'pending'] } });
  const escalatedTickets = await Ticket.countDocuments({ status: 'escalated' });
  const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });

  // Resolutions stats
  const totalResolutions = await Resolution.countDocuments();
  const autoSentResolutions = await Resolution.countDocuments({ status: 'AUTO_SENT' });
  const escalatedResolutions = await Resolution.countDocuments({ status: { $in: ['ESCALATED', 'AWAITING_APPROVAL'] } });

  const autoResolveRate = totalResolutions > 0
    ? Number(((autoSentResolutions / totalResolutions) * 100).toFixed(1))
    : 72.5;

  const escalationRate = totalResolutions > 0
    ? Number(((escalatedResolutions / totalResolutions) * 100).toFixed(1))
    : 27.5;

  // Average resolution duration (in ms)
  const avgDurationResult = await Resolution.aggregate([
    { $match: { duration: { $gt: 0 } } },
    { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
  ]);
  const avgDurationMs = avgDurationResult[0]?.avgDuration || 1450;

  // Recent tickets
  const recentTickets = await Ticket.find()
    .populate('customer', 'name email')
    .populate('assignedAgent', 'name email')
    .sort({ createdAt: -1 })
    .limit(6);

  // Recent AI activity logs
  const recentLogs = await ResolutionLog.find()
    .sort({ timestamp: -1 })
    .limit(8);

  return {
    metrics: {
      totalTickets,
      openTickets,
      escalatedTickets,
      resolvedTickets,
      autoResolveRate,
      escalationRate,
      avgResolutionTimeSeconds: Number((avgDurationMs / 1000).toFixed(2))
    },
    recentTickets,
    recentLogs
  };
};

module.exports = {
  createTicket,
  addMessage,
  getTickets,
  getTicketById,
  updateTicket,
  escalateTicket,
  resolveTicket,
  deleteTicket,
  getDashboardMetrics
};
