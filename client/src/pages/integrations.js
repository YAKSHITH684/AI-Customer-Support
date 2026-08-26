import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../services/api';
import {
  Boxes,
  Mail,
  MessageSquare,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  ExternalLink,
  Code,
  Copy,
  Check,
  Send,
  Loader2
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [embedCodeOpen, setEmbedCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/integrations');
      if (res.data?.success) {
        setIntegrations(res.data.integrations || []);
      }
      setIsLoading(false);
    } catch (err) {
      console.warn('Failed to fetch integrations:', err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestExecution = async (provider, action, payload = {}) => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await api.post(`/integrations/${provider}/execute`, { action, payload });
      if (res.data?.success) {
        setTestResult({
          provider,
          message: `Success: Action "${action}" executed successfully!`,
          data: res.data.result
        });
      }
    } catch (err) {
      setTestResult({
        provider,
        error: err.response?.data?.error || err.message || 'Action failed'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleToggleConnection = async (provider, currentStatus) => {
    try {
      if (currentStatus) {
        await api.post(`/integrations/${provider}/disconnect`);
      } else {
        await api.post('/integrations', {
          provider,
          isConnected: true,
          accountName: `${provider.toUpperCase()} Integration`,
        });
      }
      fetchIntegrations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle connection');
    }
  };

  const widgetSnippet = `<script src="${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'}/widget.js" async></script>`;

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const providers = [
    {
      id: 'gmail',
      name: 'Gmail Support Inbox',
      icon: Mail,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      desc: 'Ingest customer support emails automatically and dispatch AI or agent resolutions via Gmail API.',
      testAction: 'send_email',
      testPayload: { to: 'customer@acme.com', subject: 'ResolveFlow AI Verification', body: 'Test automated dispatch' },
      testLabel: 'Send Test Email Dispatch',
    },
    {
      id: 'slack',
      name: 'Slack Alerts & Escalations',
      icon: MessageSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      desc: 'Post real-time escalation alerts and high-urgency notifications directly into your team #support channel.',
      testAction: 'post_alert',
      testPayload: { channel: '#support-escalations', text: '🚨 Priority Ticket Escalated by AI: Refund Policy Threshold Exceeded.' },
      testLabel: 'Trigger Test Slack Alert',
    },
    {
      id: 'website-widget',
      name: 'Embeddable Web Chat Widget',
      icon: Globe,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      desc: 'Add real-time customer support chat to any website or web application with a single script tag.',
      hasSnippet: true,
      testLabel: 'View Embed Snippet',
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets Ticket Export',
      icon: FileSpreadsheet,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      desc: 'Automatically append resolved tickets, resolution times, and CSAT scores to a Google Spreadsheet for analytics.',
      testAction: 'append_row',
      testPayload: { rowData: ['TICK-1002', 'Refund Policy', '0.58', 'ESCALATED', new Date().toISOString()] },
      testLabel: 'Export Test Ticket Row',
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <AppShell title="Integrations & Omnichannel Hub">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                <span>Third-Party Integrations</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Omnichannel Mesh
                </span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                Connect external communications, alerts, chat widgets, and spreadsheet analytics
              </p>
            </div>

            <button
              onClick={fetchIntegrations}
              className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-300 hover:text-white transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>

          {/* Test Action Status Output */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fade-in ${
                testResult.error
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>{testResult.message || testResult.error}</span>
                <button onClick={() => setTestResult(null)} className="underline opacity-75 hover:opacity-100">
                  Dismiss
                </button>
              </div>
              {testResult.data && (
                <pre className="p-2.5 rounded-xl bg-dark-bg/80 border border-dark-border font-mono text-[11px] text-gray-300 max-h-36 overflow-y-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* INTEGRATIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((p) => {
              const Icon = p.icon;
              const savedDoc = integrations.find((i) => i.provider === p.id);
              const isConnected = savedDoc ? savedDoc.isConnected : true;

              return (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl glass-panel border border-dark-border hover:border-brand-500/30 transition-all flex flex-col justify-between gap-5 space-y-2"
                >
                  <div className="space-y-4">
                    {/* Top Row: Provider Icon & Status Toggle */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${p.bg} ${p.color} border ${p.border}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-white text-base">
                            {p.name}
                          </h3>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {savedDoc?.accountEmail || savedDoc?.accountName || 'Connected'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`
                          text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1
                          ${isConnected ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-gray-700/20 text-gray-400 border-gray-600/30'}
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span>{isConnected ? 'Active' : 'Offline'}</span>
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="pt-4 border-t border-dark-border flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleToggleConnection(p.id, isConnected)}
                      className={`
                        px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors
                        ${isConnected
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}
                      `}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
                    </button>

                    {p.hasSnippet ? (
                      <button
                        onClick={() => setEmbedCodeOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-1.5 transition-all"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>{p.testLabel}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTestExecution(p.id, p.testAction, p.testPayload)}
                        disabled={testingProvider === p.id}
                        className="px-3.5 py-1.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-xs text-brand-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                      >
                        {testingProvider === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{p.testLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* EMBED CODE MODAL */}
          {embedCodeOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-lg w-full glass-panel rounded-3xl p-6 border border-brand-500/30 shadow-glass space-y-4">
                <div className="flex items-center justify-between border-b border-dark-border pb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-brand-400" />
                    <h3 className="font-display font-semibold text-white">
                      Embed Live Support Widget
                    </h3>
                  </div>
                  <button
                    onClick={() => setEmbedCodeOpen(false)}
                    className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-dark-card"
                  >
                    Close
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Paste this script tag before the closing <code className="text-brand-300 font-mono">&lt;/body&gt;</code> tag on any website to embed the ResolveFlow support chat widget.
                </p>

                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-dark-bg text-xs font-mono text-cyan-300 border border-dark-border overflow-x-auto">
                    {widgetSnippet}
                  </pre>
                  <button
                    onClick={copyWidgetCode}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-dark-card hover:bg-brand-600 text-gray-300 hover:text-white transition-colors"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
