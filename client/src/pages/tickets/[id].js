import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import TicketThread from '../../components/TicketThread/TicketThread';
import DraftReviewPanel from '../../components/DraftReviewPanel/DraftReviewPanel';
import AgentTimeline from '../../components/AgentTimeline/AgentTimeline';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';
import { joinTicketRoom, leaveTicketRoom } from '../../services/socket';
import api from '../../services/api';
import {
  ArrowLeft,
  Ticket,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  Radio,
  Loader2
} from 'lucide-react';

export default function TicketWorkspacePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const {
    activeTicket,
    messages,
    activeResolution,
    fetchTicketById,
    sendMessage,
    approveResolution,
    editResolution,
    retryResolution,
    isTicketLoading
  } = useTicketStore();

  const [isSending, setIsSending] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketById(id);
      joinTicketRoom(id);

      return () => {
        leaveTicketRoom(id);
      };
    }
  }, [id]);

  const handleSendMessage = async (content) => {
    if (!id || !content.trim()) return;
    setIsSending(true);
    await sendMessage(id, content);
    setIsSending(false);
  };

  const handleApprove = async (resolutionId) => {
    setIsActionLoading(true);
    await approveResolution(resolutionId);
    setIsActionLoading(false);
  };

  const handleEditAndSend = async (content) => {
    if (!activeResolution?._id) return;
    setIsActionLoading(true);
    await editResolution(activeResolution._id, content);
    setIsActionLoading(false);
  };

  const handleRetry = async (resolutionId) => {
    setIsActionLoading(true);
    await retryResolution(resolutionId);
    setIsActionLoading(false);
    fetchTicketById(id);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!id) return;
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      fetchTicketById(id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleUpdatePriority = async (newPriority) => {
    if (!id) return;
    try {
      await api.put(`/tickets/${id}`, { priority: newPriority });
      fetchTicketById(id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update priority');
    }
  };

  const handleClaimTicket = async () => {
    if (!id || !user) return;
    try {
      await api.put(`/tickets/${id}`, { assignedAgent: user.id || user._id });
      fetchTicketById(id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim ticket');
    }
  };

  if (isTicketLoading && !activeTicket) {
    return (
      <ProtectedRoute>
        <AppShell title="Loading Ticket...">
          <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <span className="text-sm font-medium">Loading ticket workspace and agent context...</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!activeTicket && !isTicketLoading) {
    return (
      <ProtectedRoute>
        <AppShell title="Ticket Not Found">
          <div className="py-24 text-center text-gray-400 space-y-4">
            <Ticket className="w-12 h-12 mx-auto text-gray-600" />
            <h3 className="text-lg font-semibold text-white">Ticket Not Found</h3>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tickets Desk</span>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isResolved = activeTicket.status === 'resolved';
  const isEscalated = activeTicket.status === 'escalated';

  return (
    <ProtectedRoute>
      <AppShell title={`#${activeTicket.ticketNumber} — ${activeTicket.subject}`}>
        <div className="space-y-6">
          {/* Back button & Ticket Workspace Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-dark-border pb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/tickets"
                className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-400 hover:text-white transition-colors"
                title="Back to Tickets Desk"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base text-brand-400 font-bold">
                    #{activeTicket.ticketNumber}
                  </span>
                  <span
                    className={`
                      text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1
                      ${isResolved ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : isEscalated ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-brand-500/15 text-brand-300 border-brand-500/30'}
                    `}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isEscalated ? (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-brand-400" />
                    )}
                    <span>{activeTicket.status}</span>
                  </span>

                  <span className="text-xs text-gray-400 px-2 py-0.5 rounded-md bg-dark-card border border-dark-border">
                    {activeTicket.category || 'General'}
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-display font-bold text-white mt-1">
                  {activeTicket.subject}
                </h2>
              </div>
            </div>

            {/* Quick Action Controls */}
            {user?.role !== 'customer' && (
              <div className="flex items-center gap-2.5">
                {!activeTicket.assignedAgent && (
                  <button
                    onClick={handleClaimTicket}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Claim Ticket</span>
                  </button>
                )}

                {/* Status Toggle Button */}
                {activeTicket.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-emerald flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Resolved</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('open')}
                    className="px-4 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-open Ticket</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* TWO COLUMN GRID: Left = Conversation & Draft / Right = Agent Timeline & Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Review Panel & Thread */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Draft Review Panel (For Agents if Awaiting Approval) */}
              {user?.role !== 'customer' && activeResolution && (
                <DraftReviewPanel
                  resolution={activeResolution}
                  onApprove={handleApprove}
                  onEditAndSend={handleEditAndSend}
                  onRetry={handleRetry}
                  isLoading={isActionLoading}
                />
              )}

              {/* Conversation Messages Thread */}
              <div className="h-[600px]">
                <TicketThread
                  ticket={activeTicket}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                />
              </div>
            </div>

            {/* Right 1 Column: Agent Reasoning Timeline & Metadata Card */}
            <div className="space-y-6">
              {/* Ticket Metadata Card */}
              <div className="p-5 rounded-2xl glass-panel border border-dark-border space-y-4">
                <h3 className="font-display font-semibold text-white text-sm border-b border-dark-border pb-3">
                  Ticket Metadata
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="font-medium text-white">
                      {activeTicket.customer?.name || 'Alex Rivera (Customer)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Customer Email:</span>
                    <span className="font-mono text-gray-300">
                      {activeTicket.customer?.email || 'customer@acme.com'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Channel:</span>
                    <span className="uppercase font-mono font-semibold text-brand-300">
                      {activeTicket.channel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Priority:</span>
                    {user?.role !== 'customer' ? (
                      <select
                        value={activeTicket.priority}
                        onChange={(e) => handleUpdatePriority(e.target.value)}
                        className="p-1 rounded-lg glass-input text-xs font-semibold text-gray-200"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : (
                      <span className="uppercase font-bold text-gray-300 font-mono">
                        {activeTicket.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Assigned Agent:</span>
                    <span className="font-medium text-indigo-300">
                      {activeTicket.assignedAgent?.name || 'Unassigned (AI Queue)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="font-mono text-gray-300">
                      {new Date(activeTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Agent Reasoning Timeline Sidebar */}
              <div className="h-[480px]">
                <AgentTimeline
                  logs={activeResolution?.logs || []}
                  resolution={activeResolution}
                />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
