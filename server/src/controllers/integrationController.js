const integrationService = require('../services/integrationService');
const Integration = require('../models/Integration');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const widgetIntegration = require('../integrations/widgetIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

const PROVIDER_MAP = {
  gmail: gmailIntegration,
  slack: slackIntegration,
  'website-widget': widgetIntegration,
  'google-sheets': googleSheetsIntegration
};

const getIntegrations = async (req, res, next) => {
  try {
    const integrations = await integrationService.getIntegrations(req.user.id || req.user._id);
    return res.status(200).json({
      success: true,
      integrations
    });
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await integrationService.getIntegrationsStatus(req.user.id || req.user._id);
    return res.status(200).json({
      success: true,
      ...status
    });
  } catch (error) {
    next(error);
  }
};

const startOAuth = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await integrationService.startOAuthFlow(provider, req.user.id || req.user._id);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const handleCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;
    const result = await integrationService.handleOAuthCallback(
      provider,
      code || `mock_code_${Date.now()}`,
      state,
      req.user?.id || req.user?._id
    );

    // If request is from browser navigation, redirect to integrations page
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?connected=${provider}`);
    }

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const oauthError = async (req, res) => {
  return res.status(400).json({
    success: false,
    error: 'OAuth authentication failed or was cancelled by user.'
  });
};

const setupManual = async (req, res, next) => {
  try {
    const { provider, apiKey, accountEmail, accountName, config, isConnected } = req.body;
    const result = await integrationService.setupManualIntegration({
      provider,
      apiKey,
      accountEmail,
      accountName,
      config,
      isConnected,
      userId: req.user.id || req.user._id
    });
    return res.status(200).json({
      success: true,
      message: `Integration "${provider}" updated successfully.`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const executeAction = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { action, payload = {} } = req.body;

    const handler = PROVIDER_MAP[provider];
    if (!handler) {
      return res.status(400).json({ success: false, error: `Unsupported provider: ${provider}` });
    }

    let integrationDoc = await Integration.findOne({ provider });
    if (!integrationDoc) {
      integrationDoc = await Integration.create({
        owner: req.user.id || req.user._id,
        provider,
        isConnected: true
      });
    }

    const result = await handler.execute(action, payload, integrationDoc);
    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};

const disconnect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await integrationService.disconnectIntegration(provider, req.user.id || req.user._id);
    return res.status(200).json({
      success: true,
      message: `Integration "${provider}" disconnected.`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIntegrations,
  getStatus,
  startOAuth,
  handleCallback,
  oauthError,
  setupManual,
  executeAction,
  disconnect
};
