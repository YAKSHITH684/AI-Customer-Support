import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Zap,
  ArrowRight,
  Search,
  PenTool,
  CheckSquare,
  AlertTriangle,
  Activity,
  Layers,
  Inbox,
  Boxes,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  FileText,
  Clock
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, demoLogin, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('retrieval');

  const handleQuickLaunch = async (role) => {
    await demoLogin(role);
    if (role === 'customer') {
      router.push('/tickets');
    } else {
      router.push('/dashboard');
    }
  };

  const agentSteps = [
    {
      id: 'retrieval',
      name: '1. Retrieval Agent',
      icon: Search,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      desc: 'Performs semantic cosine similarity search across chunked vector embeddings to pull verified company policy & FAQ context.'
    },
    {
      id: 'drafting',
      name: '2. Drafting Agent',
      icon: PenTool,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      desc: 'Synthesizes professional, empathetic customer responses strictly grounded in retrieved documentation with inline [Source: ...] citations.'
    },
    {
      id: 'confidence',
      name: '3. Confidence Agent',
      icon: CheckSquare,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      desc: 'Evaluates factual accuracy, source grounding, and customer sentiment. Generates a normalized 0.0 - 1.0 confidence score.'
    },
    {
      id: 'escalation',
      name: '4. Escalation Agent',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      desc: 'Autonomously dispatches high-confidence resolutions (>=70%) or routes sensitive/low-confidence queries to the Human Agent Priority Queue with Slack alerts.'
    },
    {
      id: 'monitoring',
      name: '5. Monitoring Agent',
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      desc: 'Emits live Socket.IO audit telemetry, logs immutable agent execution context, and updates real-time analytics KPIs.'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-dark-border/60 bg-dark-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              ResolveFlow<span className="text-brand-400">_AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-glow-brand flex items-center gap-2 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-dark-card transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-glow-brand transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-6 overflow-hidden">
        {/* Background glow flares */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/20 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider animate-fade-in shadow-sm">
            <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>Autonomous Multi-Agent RAG Support Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.1]">
            Automate 70%+ of Support with <br className="hidden sm:inline" />
            <span className="gradient-text">Zero-Hallucination AI Agents</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 font-normal leading-relaxed">
            ResolveFlow_AI coordinates five specialized autonomous agents to retrieve verified knowledge base context, draft grounded responses with inline citations, score confidence, and escalate edge cases seamlessly to your team.
          </p>

          {/* Fast Demo Accounts Launcher */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            <button
              onClick={() => handleQuickLaunch('agent')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-glow-brand flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Live Agent Console</span>
            </button>
            <button
              onClick={() => handleQuickLaunch('customer')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Test Customer Ticket Intake</span>
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AGENT CHAIN SHOWCASE */}
      <section className="py-16 md:py-24 px-6 border-y border-dark-border/80 bg-dark-surface/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-white">
              The 5-Step Agentic Resolution Pipeline
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
              Every incoming customer ticket triggers our sequential agent mesh. Click any agent step below to inspect its operational logic:
            </p>
          </div>

          {/* Agent Step Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {agentSteps.map((step) => {
              const Icon = step.icon;
              const isSelected = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className={`
                    p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3
                    ${isSelected
                      ? `${step.bg} ${step.border} shadow-sm ring-1 ring-white/10`
                      : 'bg-dark-card/60 border-dark-border/80 hover:bg-dark-card text-gray-400 hover:text-gray-200'}
                  `}
                >
                  <div className={`p-2 rounded-xl w-fit ${step.bg} ${step.color} border border-white/5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {step.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Container */}
          {(() => {
            const current = agentSteps.find((s) => s.id === activeTab) || agentSteps[0];
            const CurrentIcon = current.icon;
            return (
              <div className="p-6 md:p-8 rounded-3xl glass-panel border border-brand-500/30 shadow-glass space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dark-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${current.bg} ${current.color} border ${current.border}`}>
                      <CurrentIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-white">
                        {current.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Autonomous State Machine Execution
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Execution SLA: &lt; 450ms
                  </span>
                </div>

                <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                  {current.desc}
                </p>

                {/* Visual Architecture Representation */}
                <div className="p-4 rounded-2xl bg-dark-bg/90 border border-dark-border font-mono text-xs text-gray-300 space-y-2">
                  <div className="text-brand-400 font-semibold">// Live Orchestration Event Stream:</div>
                  <div className="text-gray-400">
                    &gt; [TICK-1002] Initiated {current.name} with context payload (tokens: 384)
                  </div>
                  <div className="text-emerald-400">
                    &gt; Status: SUCCESS • Emitting telemetry event to Socket.IO room #ticket_1002
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
            Built for Modern Support Teams & Scale
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Everything your support operation needs from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card border border-dark-border space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              Omnichannel Integrations
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sync tickets seamlessly across Gmail OAuth, Slack escalation channels, embeddable website widget scripts, and Google Sheets analytics export.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-dark-border space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              Human-in-the-Loop Triage
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sensitive policies, negative sentiment, and low-confidence drafts automatically pause for human agent review with 1-click Approve, Edit, or Re-escalate.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-dark-border space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              Knowledge Gap Analytics
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Discover unanswered customer topics before they cause escalations. Track low-confidence queries and vectorize new company manuals instantly.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-dark-border py-8 px-6 bg-dark-surface/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} ResolveFlow_AI. All rights reserved. Enterprise Support Automation.
          </div>
          <div className="flex items-center gap-6 text-gray-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/tickets" className="hover:text-white transition-colors">Support Portal</Link>
            <Link href="/settings" className="hover:text-white transition-colors">System Diagnostics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
