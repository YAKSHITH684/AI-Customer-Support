const Integration = require('../models/Integration');
const Notification = require('../models/Notification');
const { encrypt, decrypt } = require('../utils/crypto');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const widgetIntegration = require('../integrations/widgetIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

const PROVIDERS = {
  gmail: gmailIntegration,
  slack: slackIntegration,
  'website-widget': widgetIntegration,
  'google-sheets': googleSheetsIntegration
};

const getIntegrations = async (userId) => {
  const providers = ['gmail', 'slack', 'website-widget', 'google-sheets'];
  const results = [];

  for (const provider of providers) {
    let integration = await Integration.findOne({ provider });
    if (!integration) {
      integration = await Integration.create({
        owner: userId,
        provider,
        isConnected: false,
        scopes: []
      });
    }

    const providerHandler = PROVIDERS[provider];
    let health = { status: integration.isConnected ? 'connected' : 'disconnected', message: '' };
    if (providerHandler) {
      try {
        health = await providerHandler.checkHealth(integration);
      } catch (err) {
        health = { status: 'error', message: err.message };
      }
    }

    results.push({
      id: integration._id,
      provider: integration.provider,
      isConnected: integration.isConnected,
      accountEmail: integration.accountEmail,
      accountName: integration.accountName,
      scopes: integration.scopes,
      expiresAt: integration.expiresAt,
      lastSyncedAt: integration.lastSyncedAt,
      healthStatus: health.status,
      healthMessage: health.message,
      config: integration.config
    });
  }

  return results;
};

const getIntegrationsStatus = async (userId) => {
  const integrations = await getIntegrations(userId);
  const total = integrations.length;
  const connected = integrations.filter(i => i.isConnected).length;
  return {
    total,
    connected,
    integrations
  };
};

const startOAuthFlow = async (provider, userId) => {
  const providerHandler = PROVIDERS[provider];
  if (!providerHandler) {
    const error = new Error(`Unsupported OAuth provider: ${provider}`);
    error.statusCode = 400;
    throw error;
  }

  const state = Buffer.from(JSON.stringify({ provider, userId, timestamp: Date.now() })).toString('base64');
  const authUrl = await providerHandler.getAuthUrl(state);
  return { authUrl, state };
};

const handleOAuthCallback = async (provider, code, state, userId) => {
  const providerHandler = PROVIDERS[provider];
  if (!providerHandler) {
    const error = new Error(`Unsupported OAuth provider: ${provider}`);
    error.statusCode = 400;
    throw error;
  }

  const tokenData = await providerHandler.handleCallback(code);

  let integration = await Integration.findOne({ provider });
  if (!integration) {
    integration = new Integration({ owner: userId, provider });
  }

  integration.isConnected = true;
  integration.encryptedAccessToken = encrypt(tokenData.accessToken);
  if (tokenData.refreshToken) {
    integration.encryptedRefreshToken = encrypt(tokenData.refreshToken);
  }
  integration.expiresAt = tokenData.expiresAt || null;
  integration.scopes = tokenData.scopes || [];
  integration.accountEmail = tokenData.profile?.email || '';
  integration.accountName = tokenData.profile?.name || '';
  integration.config = tokenData.profile || {};
  integration.lastSyncedAt = new Date();
  integration.errorStatus = null;

  await integration.save();

  return {
    success: true,
    provider,
    accountName: integration.accountName,
    accountEmail: integration.accountEmail
  };
};

const setupManualIntegration = async ({ provider, apiKey, accountEmail, accountName, config = {}, isConnected = true, userId }) => {
  let integration = await Integration.findOne({ provider });
  if (!integration) {
    integration = new Integration({ owner: userId, provider });
  }

  integration.isConnected = isConnected;
  if (apiKey) {
    integration.encryptedApiKey = encrypt(apiKey);
  }
  if (accountEmail) integration.accountEmail = accountEmail;
  if (accountName) integration.accountName = accountName;
  integration.config = { ...integration.config, ...config };
  integration.lastSyncedAt = new Date();

  await integration.save();

  return {
    success: true,
    integration: {
      id: integration._id,
      provider: integration.provider,
      isConnected: integration.isConnected,
      accountEmail: integration.accountEmail,
      accountName: integration.accountName,
      config: integration.config
    }
  };
};

const disconnectIntegration = async (provider, userId) => {
  const integration = await Integration.findOne({ provider });
  if (integration) {
    integration.isConnected = false;
    integration.encryptedAccessToken = null;
    integration.encryptedRefreshToken = null;
    integration.encryptedApiKey = null;
    integration.lastSyncedAt = new Date();
    await integration.save();
  }
  return { success: true, provider };
};

module.exports = {
  getIntegrations,
  getIntegrationsStatus,
  startOAuthFlow,
  handleOAuthCallback,
  setupManualIntegration,
  disconnectIntegration
};
