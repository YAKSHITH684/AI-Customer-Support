const express = require('express');
const integrationController = require('../controllers/integrationController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// List all integrations
router.get('/', authenticate, integrationController.getIntegrations);

// Status and health of all providers
router.get('/status', authenticate, integrationController.getStatus);

// Start OAuth flow
router.get('/oauth/:provider/start', authenticate, integrationController.startOAuth);

// OAuth callback endpoint
router.get('/oauth/:provider/callback', integrationController.handleCallback);

// OAuth error endpoint
router.get('/oauth/error', integrationController.oauthError);

// Manual credentials configuration
router.post('/', authenticate, requireRole('admin'), integrationController.setupManual);

// Provider test execution (Slack alerts, Google Sheets export, Chat Widget script snippet)
router.post('/:provider/execute', authenticate, requireRole('admin', 'agent'), integrationController.executeAction);

// Disconnect integration
router.post('/:provider/disconnect', authenticate, requireRole('admin'), integrationController.disconnect);

module.exports = router;
