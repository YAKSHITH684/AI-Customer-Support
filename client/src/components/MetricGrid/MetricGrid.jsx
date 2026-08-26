import { Ticket, Clock, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const {
    openTickets = 0,
    escalatedTickets = 0,
    resolvedTickets = 0,
    totalTickets = 0,
    autoResolveRate = 72.5,
    escalationRate = 27.5,
    avgResolutionTimeSeconds = 1.45,
  } = metrics;

  const cards = [
    {
      title: 'Active Open Tickets',
      value: openTickets,
      subtext: `${escalatedTickets} requiring human escalation`,
      icon: Ticket,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      trend: '+12% vs last week',
      trendUp: true,
    },
    {
      title: 'Avg Resolution Time',
      value: `${avgResolutionTimeSeconds > 60 ? (avgResolutionTimeSeconds / 60).toFixed(1) + 'm' : avgResolutionTimeSeconds + 's'}`,
      subtext: 'End-to-end RAG + agent synthesis',
      icon: Clock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      trend: '⚡ 85% faster than human SLA',
      trendUp: true,
    },
    {
      title: 'AI Auto-Resolve Rate',
      value: `${typeof autoResolveRate === 'number' ? autoResolveRate.toFixed(1) : autoResolveRate}%`,
      subtext: `${resolvedTickets} tickets closed automatically`,
      icon: Zap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      trend: 'Target: >70%',
      trendUp: true,
      progress: autoResolveRate,
      progressColor: 'bg-emerald-500',
    },
    {
      title: 'Escalation Rate',
      value: `${typeof escalationRate === 'number' ? escalationRate.toFixed(1) : escalationRate}%`,
      subtext: 'Policy sensitive / low confidence',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      trend: 'Safety guardrails active',
      trendUp: false,
      progress: escalationRate,
      progressColor: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`p-5 rounded-2xl glass-card border ${card.border} relative overflow-hidden group`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mt-1">
                  {card.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.color} border border-white/5`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Progress bar if present */}
            {card.progress !== undefined && (
              <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${card.progressColor} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                ></div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-400 truncate max-w-[150px]">{card.subtext}</span>
              <span className="text-[11px] font-semibold text-gray-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
