const ticketService = require('../services/ticketService');
const { validationResult } = require('express-validator');

const getDashboard = async (req, res, next) => {
  try {
    const data = await ticketService.getDashboardMetrics(req.user);
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const { page, limit, status, priority, category, channel, search } = req.query;
    const result = await ticketService.getTickets({
      page,
      limit,
      status,
      priority,
      category,
      channel,
      search,
      user: req.user
    });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getTicketById = async (req, res, next) => {
  try {
    const result = await ticketService.getTicketById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { subject, description, category, priority, channel, tags } = req.body;
    const ticket = await ticketService.createTicket({
      subject,
      description,
      category,
      priority,
      channel,
      tags,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully and agent chain initiated.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content, attachments } = req.body;
    const message = await ticketService.addMessage({
      ticketId: req.params.id,
      content,
      user: req.user,
      attachments
    });

    return res.status(201).json({
      success: true,
      message: 'Message added successfully.',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.updateTicket(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Ticket updated successfully.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

const escalateTicket = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ticket = await ticketService.escalateTicket(req.params.id, reason, req.user);
    return res.status(200).json({
      success: true,
      message: 'Ticket escalated to human agent queue.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

const resolveTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.resolveTicket(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Ticket marked as resolved.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const result = await ticketService.deleteTicket(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getTickets,
  getTicketById,
  createTicket,
  addMessage,
  updateTicket,
  escalateTicket,
  resolveTicket,
  deleteTicket
};
