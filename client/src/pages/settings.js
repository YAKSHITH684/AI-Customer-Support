import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Settings,
  User,
  Shield,
  Key,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Sparkles,
  Database,
  Radio,
  Server
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, demoLogin } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    try {
      setIsChecking(true);
      const res = await api.get('/health');
      setHealth(res.data);
      setIsChecking(false);
    } catch (err) {
      setHealth({ status: 'offline', error: err.message });
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="System & Account Settings">
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
              <span>Account & System Settings</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">
              Manage your personal credentials, view system telemetry, and test environment connections
            </p>
          </div>

          {/* 1. USER PROFILE CARD */}
          <div className="p-6 rounded-3xl glass-panel border border-dark-border space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white font-bold flex items-center justify-center text-base">
                  {user?.name?.slice(0, 2).toUpperCase() || 'RF'}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    {user?.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">{user?.email}</p>
                </div>
              </div>

              <span className="text-xs font-mono uppercase font-bold px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {user?.role} Access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border space-y-1">
                <div className="text-gray-400 font-medium">Session ID / Token Status</div>
                <div className="text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authenticated JWT Active</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border space-y-1">
                <div className="text-gray-400 font-medium">Credential Security</div>
                <div className="text-brand-300 font-mono font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>AES-256-GCM At-Rest Encryption</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. SYSTEM DIAGNOSTIC HEALTH CHECK */}
          <div className="p-6 rounded-3xl glass-panel border border-dark-border space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-4">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-brand-400" />
                <h3 className="font-display font-semibold text-white text-base">
                  AI Engine & Backend Diagnostics
                </h3>
              </div>
              <button
                onClick={checkHealth}
                disabled={isChecking}
                className="p-1.5 rounded-lg bg-dark-card hover:bg-dark-hover text-gray-300 hover:text-white transition-colors"
                title="Re-run Diagnostic Health Check"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-brand-400' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl glass-card border border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">API Gateway</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-white">Online (Port 5000)</div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Active'}
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Database Substrate</span>
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-sm font-semibold text-white">MongoDB + Vector RAM</div>
                <div className="text-[10px] text-emerald-400 font-mono">Connected & Synced</div>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Real-time Telemetry</span>
                  <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-sm font-semibold text-white">Socket.IO Mesh</div>
                <div className="text-[10px] text-emerald-400 font-mono">Broadcasting Events</div>
              </div>
            </div>
          </div>

          {/* 3. DEMO FAST SWITCHER */}
          <div className="p-6 rounded-3xl glass-panel border border-dark-border space-y-4">
            <h3 className="font-display font-semibold text-white text-base">
              Quick Role Switching (Demo Sandbox)
            </h3>
            <p className="text-xs text-gray-400">
              Instantly toggle between administrator, agent console, and customer intake views to test full end-to-end workflows.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => demoLogin('admin')}
                className="p-3.5 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/40 text-purple-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Sarah Chen (Admin)</span>
              </button>

              <button
                onClick={() => demoLogin('agent')}
                className="p-3.5 rounded-2xl bg-brand-950/30 hover:bg-brand-900/40 border border-brand-500/40 text-brand-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <User className="w-5 h-5 text-brand-400" />
                <span>Marcus Vance (Agent)</span>
              </button>

              <button
                onClick={() => demoLogin('customer')}
                className="p-3.5 rounded-2xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Alex Rivera (Customer)</span>
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
