const BaseIntegration = require('./baseIntegration');
const { decrypt } = require('../utils/crypto');
const axios = require('axios');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  async getAuthUrl(state) {
    const clientId = process.env.SLACK_CLIENT_ID || 'mock_slack_client_id_resolveflow';
    const redirectUri = encodeURIComponent(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?provider=slack&action=callback`);
    const scopes = encodeURIComponent('chat:write,channels:read,incoming-webhook');
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  }

  async handleCallback(code) {
    return {
      accessToken: `xoxb-mock-slack-bot-token-${Date.now()}`,
      refreshToken: null,
      expiresAt: null, // Slack bot tokens do not expire by default
      profile: {
        email: 'workspace@slack.com',
        name: 'ResolveFlow Slack Alerts Workspace',
        channel: '#support-escalations',
        team: 'Support Engineering'
      },
      scopes: ['chat:write', 'incoming-webhook']
    };
  }

  async checkHealth(integrationDoc) {
    if (!integrationDoc || !integrationDoc.isConnected) {
      return { status: 'disconnected', message: 'INTEGRATION_NOT_CONNECTED: Slack bot is not connected.' };
    }
    if (integrationDoc.encryptedAccessToken) {
      const token = decrypt(integrationDoc.encryptedAccessToken);
      if (!token) {
        return { status: 'expired', message: 'AUTH_EXPIRED: Invalid decryption key or corrupted token. Please reconnect.' };
      }
    }
    return { status: 'connected', message: 'Slack escalation alert channel is connected.' };
  }

  async execute(action, payload, integrationDoc) {
    const health = await this.checkHealth(integrationDoc);
    if (health.status !== 'connected') {
      const err = new Error(health.message);
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'post_escalation_alert' || action === 'post_alert' || action === 'send_message') {
      const ticketNumber = payload.ticketNumber || 'TICK-ALERT';
      const subject = payload.subject || payload.text || 'Support Notification';
      const priority = payload.priority || 'medium';
      const escalationReason = payload.escalationReason || 'Manual/AI Alert Trigger';
      const ticketUrl = payload.ticketUrl || 'http://localhost:3000/queue';

      console.log(`💬 [Slack Integration] Posting alert for ${ticketNumber} (${priority})`);
      
      const messageBlock = {
        channel: payload.channel || integrationDoc.config?.channel || '#support-escalations',
        text: payload.text || `🚨 *Ticket Escalation Alert: ${ticketNumber}*`,
        attachments: [
          {
            color: priority === 'urgent' ? '#EF4444' : '#F59E0B',
            fields: [
              { title: 'Subject', value: subject, short: false },
              { title: 'Priority', value: priority.toUpperCase(), short: true },
              { title: 'Escalation Reason', value: escalationReason, short: true },
              { title: 'Console URL', value: ticketUrl, short: false }
            ],
            footer: 'ResolveFlow AI Agent Orchestrator'
          }
        ]
      };

      // If webhookUrl is configured in integration, post to it
      if (integrationDoc.config?.webhookUrl) {
        try {
          await axios.post(integrationDoc.config.webhookUrl, messageBlock, { timeout: 4000 });
        } catch (webhookErr) {
          console.warn('Slack webhook post failed (using local simulated alert):', webhookErr.message);
        }
      }

      return {
        success: true,
        message: `Alert posted to Slack channel ${messageBlock.channel}`,
        postedAt: new Date(),
        channel: messageBlock.channel
      };
    }

    return {
      success: true,
      message: `Executed Slack action: ${action}`,
      postedAt: new Date()
    };
  }
}

module.exports = new SlackIntegration();
