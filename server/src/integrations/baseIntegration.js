/**
 * Base Integration Class
 * Interface for all third-party provider integrations
 */
class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  /**
   * Generates the OAuth authorization URL
   * @param {string} state - Random state string or encoded user ID
   * @returns {string} Auth URL
   */
  async getAuthUrl(state) {
    throw new Error(`getAuthUrl() not implemented for ${this.providerName}`);
  }

  /**
   * Exchanges authorization code for tokens
   * @param {string} code 
   * @returns {Promise<{accessToken: string, refreshToken?: string, expiresAt?: Date, profile: object}>}
   */
  async handleCallback(code) {
    throw new Error(`handleCallback() not implemented for ${this.providerName}`);
  }

  /**
   * Health check / token validity verification
   * @param {object} integrationDoc - Integration model document
   * @returns {Promise<{status: 'connected' | 'expired' | 'error', message?: string}>}
   */
  async checkHealth(integrationDoc) {
    throw new Error(`checkHealth() not implemented for ${this.providerName}`);
  }

  /**
   * Executes provider-specific action (e.g. send alert, ingest email, export sheets)
   * @param {string} action 
   * @param {object} payload 
   * @param {object} integrationDoc 
   */
  async execute(action, payload, integrationDoc) {
    throw new Error(`execute() not implemented for ${this.providerName}`);
  }
}

module.exports = BaseIntegration;
