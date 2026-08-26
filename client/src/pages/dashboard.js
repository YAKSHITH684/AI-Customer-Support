import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  Inbox,
  Ticket,
  Clock,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    metrics,
    tickets,
    recentLogs,
    fetchDashboardMetrics,
    fetchTickets,
    isLoading
  } = useTicketStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardMetrics(),
      fetchTickets({ limit: 8, status: 'all' }),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Visual resolution distribution chart data
  const resolutionData = [
    { name: 'Auto-Resolved (AI)', value: metrics.resolvedTickets || 14, color: '#10B981' },
    { name: 'Human Escalated', value: metrics.escalatedTickets || 4, color: '#F59E0B' },
    { name: 'Pending Review', value: metrics.openTickets || 2, color: '#6366F1' },
  ];

  const trendData = [
    { time: '09:00', aiResolved: 4, escalated: 1 },
    { time: '11:00', aiResolved: 8, escalated: 2 },
    { time: '13:00', aiResolved: 15, escalated: 3 },
    { time: '15:00', aiResolved: 22, escalated: 5 },
    { time: '17:00', aiResolved: 31, escalated: 7 },
  ];

  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <AppShell title="Agent Command Center">
        <div className="space-y-6">
          {/* Welcome & Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                <span>Welcome back, {user?.name?.split(' ')[0] || 'Agent'}</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {user?.role?.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                Live multi-agent orchestration telemetry and triage queue
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadData}
                disabled={refreshing}
                className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-300 hover:text-white transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
              </button>
              <Link
                href="/queue"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-glow-brand flex items-center gap-2 transition-all"
              >
                <Inbox className="w-4 h-4" />
                <span>Open Triage Queue</span>
              </Link>
            </div>
          </div>

          {/* Metric Grid KPIs */}
          <MetricGrid metrics={metrics} />

          {/* TWO COLUMN WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Resolution Analytics & Triage Queue (2 Columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Analytics Chart Panel */}
              <div className="p-5 rounded-2xl glass-panel border border-dark-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-400" />
                    <h3 className="font-display font-semibold text-white text-sm">
                      Autonomous AI Resolution Velocity
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">Today's Throughput</span>
                </div>

                <div className="h-52 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="escGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#4B5563" fontSize={11} />
                      <YAxis stroke="#4B5563" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="aiResolved"
                        name="AI Auto-Resolved"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#aiGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="escalated"
                        name="Escalated to Agent"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#escGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Triage Queue Table */}
              <div className="rounded-2xl glass-panel border border-dark-border overflow-hidden">
                <div className="p-4 bg-dark-card/40 border-b border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-brand-400" />
                    <h3 className="font-display font-semibold text-white text-sm">
                      Recent Tickets & Triage Desk
                    </h3>
                  </div>
                  <Link
                    href="/tickets"
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                  >
                    <span>View All Tickets</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-dark-border/60 overflow-x-auto">
                  {tickets.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs">
                      No active tickets in queue.
                    </div>
                  ) : (
                    tickets.slice(0, 5).map((t) => (
                      <div
                        key={t._id}
                        onClick={() => router.push(`/tickets/${t._id}`)}
                        className="p-4 hover:bg-dark-hover/40 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-brand-400 font-bold">
                              #{t.ticketNumber}
                            </span>
                            <span
                              className={`
                                text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border
                                ${t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : t.status === 'escalated' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-brand-500/15 text-brand-300 border-brand-500/30'}
                              `}
                            >
                              {t.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {t.category}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-200 truncate group-hover:text-brand-300 transition-colors">
                            {t.subject}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
                            {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="p-1.5 rounded-lg bg-dark-card text-gray-400 group-hover:text-white group-hover:bg-brand-600 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Live AI Event Stream & Distribution (1 Column) */}
            <div className="space-y-6">
              {/* Distribution Donut */}
              <div className="p-5 rounded-2xl glass-panel border border-dark-border space-y-4">
                <h3 className="font-display font-semibold text-white text-sm">
                  Resolution Breakdown
                </h3>
                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionData}
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {resolutionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-2 border-t border-dark-border/60 text-xs">
                  {resolutionData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live AI Reasoning Telemetry Stream */}
              <div className="p-5 rounded-2xl glass-panel border border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-brand-400 animate-pulse" />
                    <h3 className="font-display font-semibold text-white text-sm">
                      Live Agent Telemetry
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active Stream
                  </span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {recentLogs.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs">
                      Awaiting live agent events...
                    </div>
                  ) : (
                    recentLogs.slice(0, 6).map((log, index) => (
                      <div
                        key={log._id || index}
                        className="p-2.5 rounded-xl bg-dark-card/60 border border-dark-border/80 text-xs space-y-1 hover:border-brand-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="font-semibold text-brand-300 uppercase tracking-wider">
                            {log.agent}
                          </span>
                          <span className="font-mono text-gray-500">
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
