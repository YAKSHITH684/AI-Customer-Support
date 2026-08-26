const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

const register = async ({ name, email, password, role = 'customer' }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Validate allowed role assignment
  const allowedRoles = ['customer', 'agent', 'admin'];
  const assignedRole = allowedRoles.includes(role) ? role : 'customer';

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: assignedRole
  });

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password credentials.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password credentials.');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.lastLogin
    }
  };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };
};

module.exports = {
  register,
  login,
  getProfile,
  generateToken
};
