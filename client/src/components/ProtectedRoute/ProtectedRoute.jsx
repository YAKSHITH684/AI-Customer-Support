import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { Bot, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Customer trying to access agent/admin page
        if (user.role === 'customer') {
          router.push('/tickets');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, router, user, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-gray-400 gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow-brand animate-pulse">
            <Bot className="w-8 h-8" />
          </div>
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <div className="text-sm font-medium tracking-wide">Authenticating ResolveFlow_AI Session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}
