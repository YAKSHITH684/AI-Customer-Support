const authService = require('../services/authService');
const { validationResult } = require('express-validator');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id || req.user._id);
    return res.status(200).json({
      success: true,
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
