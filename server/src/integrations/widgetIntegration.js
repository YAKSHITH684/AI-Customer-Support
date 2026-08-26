const BaseIntegration = require('./baseIntegration');

class WidgetIntegration extends BaseIntegration {
  constructor() {
    super('website-widget');
  }

  async getAuthUrl(state) {
    return null; // Widget uses API Keys & generated script tag rather than OAuth
  }

  async handleCallback(code) {
    return null;
  }

  async checkHealth(integrationDoc) {
    if (!integrationDoc || !integrationDoc.isConnected) {
      return { status: 'disconnected', message: 'Website Widget is disabled.' };
    }
    return { status: 'connected', message: 'Website Chat Widget script is active and receiving inquiries.' };
  }

  getEmbedScript(serverUrl, widgetKey) {
    return `<!-- ResolveFlow AI Support Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ResolveFlowWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','rf','${serverUrl || 'http://localhost:5000'}/widget.js'));
  rf('init', { widgetKey: '${widgetKey || 'rf_live_widget_key_default'}' });
</script>`;
  }

  async execute(action, payload, integrationDoc) {
    if (action === 'get_snippet') {
      const serverUrl = payload.serverUrl || process.env.SERVER_URL || 'http://localhost:5000';
      const widgetKey = integrationDoc.config?.widgetKey || 'rf_live_default_key';
      return {
        snippet: this.getEmbedScript(serverUrl, widgetKey),
        widgetKey,
        theme: integrationDoc.config?.theme || 'dark'
      };
    }
    throw new Error(`Unknown Widget action: ${action}`);
  }
}

module.exports = new WidgetIntegration();
