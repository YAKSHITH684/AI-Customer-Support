import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  Sparkles,
  Loader2,
  ChevronLeft
} from 'lucide-react';

export default function TicketsDeskPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tickets, pagination, fetchTickets, createTicket, isLoading } = useTicketStore();

  const [search, setSearch] = useState(router.query.search || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New ticket modal
  const [isCreateOpen, setIsCreateOpen] = useState(Boolean(router.query.new));
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('medium');
  const [channel, setChannel] = useState('widget');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = (page = 1) => {
    const params = { page, limit: 15 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (search.trim()) params.search = search.trim();
    fetchTickets(params);
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTickets(1);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const res = await createTicket({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      channel
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsCreateOpen(false);
      setSubject('');
      setDescription('');
      // Navigate straight to the newly created ticket to watch the live agent chain!
      router.push(`/tickets/${res.ticket._id}`);
    } else {
      alert(res.error || 'Failed to create ticket');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title={user?.role === 'customer' ? 'My Support Tickets' : 'Tickets Desk & Triage'}>
        <div className="space-y-6">
          {/* Header & New Ticket Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
                <span>{user?.role === 'customer' ? 'Customer Support Requests' : 'Support Tickets'}</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {pagination.total || tickets.length} total
                </span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                {user?.role === 'customer'
                  ? 'Track your tickets, view AI-assisted solutions, and communicate with agents'
                  : 'Manage incoming customer inquiries, reviews, and autonomous agent resolutions'}
              </p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-brand flex items-center gap-2 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Ticket</span>
            </button>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="p-4 rounded-2xl glass-panel border border-dark-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket #ID, subject, keyword..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
              />
            </form>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs rounded-xl glass-input text-gray-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="escalated">Escalated / In Review</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="p-2 text-xs rounded-xl glass-input text-gray-300 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 text-xs rounded-xl glass-input text-gray-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Authentication">Authentication</option>
                <option value="Billing">Billing</option>
                <option value="Logistics">Logistics</option>
                <option value="Developer">Developer</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* TICKETS LIST TABLE */}
          <div className="rounded-2xl glass-panel border border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-card/60 border-b border-dark-border text-gray-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Created</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60 text-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                        <span>Loading tickets...</span>
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-500">
                        <Ticket className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                        <span>No matching tickets found.</span>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => {
                      const isResolved = t.status === 'resolved';
                      const isEscalated = t.status === 'escalated';

                      return (
                        <tr
                          key={t._id}
                          onClick={() => router.push(`/tickets/${t._id}`)}
                          className="hover:bg-dark-hover/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-brand-400 font-bold">
                                #{t.ticketNumber}
                              </span>
                            </div>
                            <div className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors mt-0.5">
                              {t.subject}
                            </div>
                            <div className="text-[11px] text-gray-400 line-clamp-1 max-w-md">
                              {t.description}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-dark-card border border-dark-border font-medium text-gray-300">
                              {t.category || 'General'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`
                                text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border
                                ${t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : t.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : t.priority === 'medium' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-gray-700/20 text-gray-400 border-gray-600/40'}
                              `}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`
                                text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 w-fit
                                ${isResolved ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : isEscalated ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-brand-500/15 text-brand-300 border-brand-500/30'}
                              `}
                            >
                              {isResolved ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : isEscalated ? (
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Bot className="w-3 h-3 text-brand-400" />
                              )}
                              <span>{t.status}</span>
                            </span>
                          </td>
                          <td className="p-4 uppercase font-mono text-[10px] text-gray-400">
                            {t.channel}
                          </td>
                          <td className="p-4 text-gray-400 font-mono">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <span className="p-1.5 rounded-lg bg-dark-card group-hover:bg-brand-600 text-gray-400 group-hover:text-white transition-all inline-flex items-center justify-center">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-dark-border bg-dark-card/40 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => loadTickets(pagination.page - 1)}
                    className="p-1.5 rounded-lg bg-dark-card hover:bg-dark-hover disabled:opacity-40 text-gray-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => loadTickets(pagination.page + 1)}
                    className="p-1.5 rounded-lg bg-dark-card hover:bg-dark-hover disabled:opacity-40 text-gray-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CREATE TICKET MODAL */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-xl w-full glass-panel rounded-3xl p-6 border border-brand-500/30 shadow-glass space-y-4">
                <div className="flex items-center justify-between border-b border-dark-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-400" />
                    <h3 className="font-display font-semibold text-white">
                      Create Support Ticket
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-dark-card"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Ticket Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. How do I upgrade my team subscription?"
                      className="w-full p-2.5 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl glass-input text-gray-200 focus:outline-none"
                      >
                        <option value="General">General</option>
                        <option value="Authentication">Authentication</option>
                        <option value="Billing">Billing</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Developer">Developer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl glass-input text-gray-200 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Intake Channel
                      </label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl glass-input text-gray-200 focus:outline-none"
                      >
                        <option value="widget">Chat Widget</option>
                        <option value="email">Gmail / Email</option>
                        <option value="slack">Slack Bot</option>
                        <option value="manual">Manual Portal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Detailed Issue Description *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your issue or question in detail. The AI agent mesh will review documentation and draft a response..."
                      className="w-full p-3 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="px-4 py-2 rounded-xl bg-dark-card hover:bg-dark-hover text-gray-300 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !subject.trim() || !description.trim()}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-glow-brand flex items-center gap-2 transition-all"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>Submit & Trigger AI Chain</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
