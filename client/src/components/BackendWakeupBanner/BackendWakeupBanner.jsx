import { useState, useEffect } from 'react';
import { Zap, CheckCircle2, RefreshCw, Server, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-customer-support-dhyq.onrender.com/api';

export default function BackendWakeupBanner() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'waking' | 'online' | 'error'
  const [showBanner, setShowBanner] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const pingBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus('online');
        // Auto hide success banner after 3.5 seconds
        setTimeout(() => setShowBanner(false), 3500);
      } else {
        throw new Error('Non-200 response');
      }
    } catch (err) {
      // Backend is likely sleeping on Render free tier
      setStatus('waking');
      setShowBanner(true);
      setRetryCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    // Initial ping on first page load
    pingBackend();

    // Re-check periodically if waking
    const interval = setInterval(() => {
      if (status !== 'online') {
        pingBackend();
      }
    }, 4000);

    // Keepalive ping every 4 minutes while browser tab is open
    const keepalive = setInterval(() => {
      fetch(`${API_BASE_URL}/health`).catch(() => {});
    }, 240000);

    return () => {
      clearInterval(interval);
      clearInterval(keepalive);
    };
  }, [status]);

  if (!showBanner) return null;

  return (
    <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-[92vw] font-sans transition-all duration-300">
      {status === 'waking' && (
        <div className="bg-dark-card/95 border border-amber-500/40 text-amber-200 p-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Waking Up Backend Server</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  (Attempt #{retryCount})
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Render free tier wakes up in ~20-30s on first load...
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'online' && (
        <div className="bg-dark-card/95 border border-emerald-500/40 text-emerald-200 p-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-white">Backend Connected & Ready</div>
              <p className="text-[11px] text-emerald-300/80">
                Groq AI, MongoDB Atlas, & WebSockets live.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
