const BaseIntegration = require('./baseIntegration');
const { decrypt } = require('../utils/crypto');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  async getAuthUrl(state) {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id_resolveflow';
    const redirectUri = encodeURIComponent(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?provider=google-sheets&action=callback`);
    const scopes = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${state}`;
  }

  async handleCallback(code) {
    return {
      accessToken: `ya29.sheets_access_token_${Date.now()}_mock`,
      refreshToken: `1//sheets_refresh_token_${Date.now()}_mock`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      profile: {
        email: 'analytics@resolveflow.ai',
        name: 'ResolveFlow Analytics Sheet',
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        sheetName: 'Ticket Resolutions & CSAT'
      },
      scopes: ['spreadsheets']
    };
  }

  async checkHealth(integrationDoc) {
    if (!integrationDoc || !integrationDoc.isConnected) {
      return { status: 'disconnected', message: 'INTEGRATION_NOT_CONNECTED: Google Sheets export is not connected.' };
    }
    if (integrationDoc.expiresAt && new Date(integrationDoc.expiresAt) < new Date()) {
      return { status: 'expired', message: 'AUTH_EXPIRED: Google Sheets token expired. Please re-authenticate.' };
    }
    return { status: 'connected', message: 'Google Sheets sync is connected and ready.' };
  }

  async execute(action, payload, integrationDoc) {
    const health = await this.checkHealth(integrationDoc);
    if (health.status !== 'connected') {
      const err = new Error(health.message);
      err.code = health.status === 'expired' ? 'AUTH_EXPIRED' : 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'export_tickets') {
      const { tickets } = payload;
      console.log(`📊 [Google Sheets Integration] Exporting ${tickets?.length || 0} tickets to Spreadsheet`);
      return {
        success: true,
        rowsExported: tickets ? tickets.length : 0,
        exportedAt: new Date(),
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${integrationDoc.config?.spreadsheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'}`
      };
    }

    throw new Error(`Unknown Google Sheets action: ${action}`);
  }
}

module.exports = new GoogleSheetsIntegration();
