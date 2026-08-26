import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Sparkles, User, Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await register({ name, email, password, role });
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
      {/* Background glow flare */}
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
            Create an Account
          </h2>
          <p className="text-xs text-gray-400">
            Start automating customer support with multi-agent orchestration
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
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
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
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Role Access Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'agent', label: 'Support Agent' },
                { id: 'customer', label: 'Customer' },
                { id: 'admin', label: 'Admin' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`
                    p-2 rounded-xl text-xs font-semibold border transition-all text-center
                    ${role === r.id
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300 shadow-sm'
                      : 'bg-dark-card/60 border-dark-border text-gray-400 hover:text-gray-200'}
                  `}
                >
                  {r.label}
                </button>
              ))}
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
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-dark-border">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
