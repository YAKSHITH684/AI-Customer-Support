import { useState } from 'react';
import {
  Radio,
  Search,
  PenTool,
  CheckSquare,
  AlertOctagon,
  Activity,
  Layers,
  Clock,
  ChevronRight,
  Code,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';

const AGENT_CONFIG = {
  orchestrator: { label: 'Orchestrator', icon: Radio, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  retrieval: { label: 'Retrieval Agent', icon: Search, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  drafting: { label: 'Drafting Agent', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  confidence: { label: 'Confidence Agent', icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  escalation: { label: 'Escalation Agent', icon: AlertOctagon, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  monitoring: { label: 'Monitoring Agent', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

export default function AgentTimeline({ logs = [], resolution = null }) {
  const [inspectLog, setInspectLog] = useState(null);

  return (
    <div className="rounded-2xl glass-panel border border-dark-border p-4 md:p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <h3 className="font-display font-semibold text-white text-sm">
            Agent Reasoning Timeline
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
          Live Telemetry
        </span>
      </div>

      {/* Timeline Steps Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <Radio className="w-8 h-8 mx-auto text-gray-600 mb-2 animate-pulse" />
            <span>Agent chain awaiting trigger or processing...</span>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-brand-500/60 before:via-purple-500/40 before:to-transparent">
            {logs.map((log, index) => {
              const agentKey = log.agent || 'orchestrator';
              const config = AGENT_CONFIG[agentKey] || AGENT_CONFIG.orchestrator;
              const Icon = config.icon;

              const isSuccess = log.level === 'success' || log.status === 'success';
              const isWarning = log.level === 'warning' || log.level === 'warn';
              const isError = log.level === 'error' || log.status === 'failed';

              return (
                <div key={log._id || index} className="relative group">
                  {/* Step Pin on Line */}
                  <div
                    className={`
                      absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shadow-sm transition-transform group-hover:scale-110
                      ${isSuccess ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : isWarning ? 'bg-amber-950 border-amber-500 text-amber-300' : isError ? 'bg-rose-950 border-rose-500 text-rose-300' : 'bg-brand-950 border-brand-500 text-brand-300'}
                    `}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>

                  {/* Step Card */}
                  <div className="p-3 rounded-xl bg-dark-card/80 border border-dark-border/80 hover:border-brand-500/30 transition-all space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${config.color}`}>
                          {config.label}
                        </span>
                        {log.durationMs && (
                          <span className="text-[10px] text-gray-500 font-mono">
                            ({log.durationMs}ms)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      {log.message}
                    </p>

                    {/* Metadata / Details trigger */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <button
                        onClick={() => setInspectLog(log)}
                        className="mt-1 flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Code className="w-3 h-3" />
                        <span>Inspect Context Snapshot</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspect Metadata Drawer / Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full glass-panel rounded-2xl p-6 border border-brand-500/30 shadow-glass space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-brand-400" />
                <h4 className="font-display font-semibold text-white">
                  Agent Telemetry Payload ({inspectLog.agent})
                </h4>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-dark-card"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-300">{inspectLog.message}</div>
              <pre className="p-3 rounded-xl bg-dark-bg text-[11px] text-gray-300 font-mono max-h-72 overflow-y-auto border border-dark-border">
                {JSON.stringify(inspectLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
