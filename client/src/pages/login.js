import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Sparkles, Bot, Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) {
      const returnUrl = router.query.returnUrl || (result.user.role === 'customer' ? '/tickets' : '/dashboard');
      router.push(returnUrl);
    }
  };

  const handleDemo = async (role) => {
    clearError();
    const result = await demoLogin(role);
    if (result.success) {
      if (role === 'customer') {
        router.push('/tickets');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-600/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-dark-border/80 shadow-glass relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              ResolveFlow<span className="text-brand-400">_AI</span>
            </span>
          </Link>
          <h2 className="text-lg font-semibold text-gray-200">
            Sign In to Support Console
          </h2>
          <p className="text-xs text-gray-400">
            Access autonomous agents, real-time triage & knowledge base
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm shadow-glow-brand flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo 1-Click Fast Login Section */}
        <div className="space-y-3 pt-2 border-t border-dark-border">
          <div className="text-center text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            Quick 1-Click Demo Accounts
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemo('admin')}
              disabled={isLoading}
              type="button"
              className="p-2 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/30 text-purple-200 text-xs font-medium flex flex-col items-center gap-1 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handleDemo('agent')}
              disabled={isLoading}
              type="button"
              className="p-2 rounded-xl bg-brand-950/20 hover:bg-brand-900/30 border border-brand-500/30 text-brand-200 text-xs font-medium flex flex-col items-center gap-1 transition-all"
            >
              <Bot className="w-4 h-4 text-brand-400" />
              <span>Agent</span>
            </button>
            <button
              onClick={() => handleDemo('customer')}
              disabled={isLoading}
              type="button"
              className="p-2 rounded-xl bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/30 text-emerald-200 text-xs font-medium flex flex-col items-center gap-1 transition-all"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Customer</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
