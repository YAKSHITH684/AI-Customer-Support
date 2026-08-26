const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['gmail', 'slack', 'website-widget', 'google-sheets', 'openrouter', 'gemini'],
    required: true,
    index: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  accountEmail: {
    type: String,
    default: ''
  },
  accountName: {
    type: String,
    default: ''
  },
  scopes: [{
    type: String
  }],
  encryptedAccessToken: {
    type: String,
    default: null
  },
  encryptedRefreshToken: {
    type: String,
    default: null
  },
  encryptedApiKey: {
    type: String,
    default: null
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  errorStatus: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Integration', integrationSchema);
