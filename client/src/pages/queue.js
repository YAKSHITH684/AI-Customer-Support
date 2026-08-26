import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function AgentQueuePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tickets, fetchTickets, approveResolution, isLoading } = useTicketStore();
  const [approvingId, setApprovingId] = useState(null);

  const loadQueue = () => {
    fetchTickets({ status: 'escalated', limit: 20 });
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleQuickApprove = async (e, resolutionId, ticketId) => {
    e.stopPropagation();
    if (!resolutionId) return;
    setApprovingId(resolutionId);
    await approveResolution(resolutionId);
    setApprovingId(null);
    loadQueue();
  };

  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <AppShell title="Human-in-the-Loop Triage Queue">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                <span>Priority Escalation & Review Queue</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tickets.length} awaiting review
                </span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                Tickets paused by the confidence or escalation agent requiring human agent review
              </p>
            </div>

            <button
              onClick={loadQueue}
              className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-300 hover:text-white transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>

          {/* SLA Alert Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Standard Escalation SLA Target: <strong>&lt; 15 Minutes</strong>. Review AI drafts below or claim tickets directly.
              </span>
            </div>
            <span className="font-mono text-amber-300 uppercase font-bold hidden sm:inline">
              SLA Policy Active
            </span>
          </div>

          {/* QUEUE CARDS LIST */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400 mb-2" />
                <span className="text-sm">Fetching escalation queue...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400 glass-panel rounded-2xl border border-dark-border space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                <h3 className="font-display font-semibold text-base text-white">
                  Queue is completely clear!
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  All customer tickets have either been autonomously resolved by our AI agents or resolved by your team.
                </p>
              </div>
            ) : (
              tickets.map((t) => {
                const resolution = t.activeResolution;
                const confidence = resolution ? Math.round((resolution.confidenceScore || 0.6) * 100) : 60;

                return (
                  <div
                    key={t._id}
                    onClick={() => router.push(`/tickets/${t._id}`)}
                    className="p-5 rounded-2xl glass-card border border-amber-500/25 hover:border-brand-500/40 transition-all cursor-pointer space-y-4 group"
                  >
                    {/* Top Row: Ticket ID, Subject, Urgency Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-brand-400">
                          #{t.ticketNumber}
                        </span>
                        <span className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                          {t.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t.tags?.find((tg) => tg.includes('POLICY') || tg.includes('CONFIDENCE')) || 'Awaiting Review'}</span>
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-dark-card border border-dark-border text-gray-300 font-bold">
                          {confidence}% Confidence
                        </span>
                      </div>
                    </div>

                    {/* Customer Issue Snippet */}
                    <div className="text-xs text-gray-300 bg-dark-bg/60 p-3 rounded-xl border border-dark-border leading-relaxed">
                      <div className="text-[11px] text-gray-400 font-semibold mb-1">
                        Customer Query ({t.customer?.name || 'Alex Rivera'}):
                      </div>
                      "{t.description}"
                    </div>

                    {/* AI Draft Preview if available */}
                    {resolution?.draftOutput && (
                      <div className="text-xs text-indigo-200 bg-brand-950/20 p-3 rounded-xl border border-brand-500/20 leading-relaxed space-y-1">
                        <div className="text-[11px] text-brand-300 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          <span>AI Generated Draft:</span>
                        </div>
                        <p className="line-clamp-2">{resolution.draftOutput}</p>
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span>Category: {t.category}</span>
                        <span>•</span>
                        <span>Channel: {t.channel}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {resolution && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprove(e, resolution._id, t._id)}
                            disabled={approvingId === resolution._id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Quick Approve</span>
                          </button>
                        )}

                        <span className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-1.5 transition-all">
                          <span>Open Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
