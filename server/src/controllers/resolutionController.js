const resolutionService = require('../services/resolutionService');
const { validationResult } = require('express-validator');

const getResolutionById = async (req, res, next) => {
  try {
    const resolution = await resolutionService.getResolutionById(req.params.id);
    return res.status(200).json({
      success: true,
      resolution
    });
  } catch (error) {
    next(error);
  }
};

const getResolutionTimeline = async (req, res, next) => {
  try {
    const data = await resolutionService.getResolutionTimeline(req.params.id);
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

const approveResolution = async (req, res, next) => {
  try {
    const result = await resolutionService.approveResolution(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'AI Draft approved and sent to customer.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const editResolution = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content } = req.body;
    const result = await resolutionService.editResolution(req.params.id, content, req.user);
    return res.status(200).json({
      success: true,
      message: 'Edited response sent to customer and ticket resolved.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const retryResolution = async (req, res, next) => {
  try {
    const result = await resolutionService.retryResolution(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResolutionById,
  getResolutionTimeline,
  approveResolution,
  editResolution,
  retryResolution
};
