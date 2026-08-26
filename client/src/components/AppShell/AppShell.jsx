import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import { getSocket, joinAgentFeedRoom } from '../../services/socket';
import {
  LayoutDashboard,
  Inbox,
  Ticket,
  BookOpen,
  Boxes,
  Settings,
  Bell,
  Search,
  LogOut,
  Sparkles,
  ChevronDown,
  User,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Menu,
  X,
  Plus,
  MessageSquare
} from 'lucide-react';

export default function AppShell({ children, title = 'ResolveFlow_AI' }) {
  const router = useRouter();
  const { user, logout, demoLogin } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    handleAgentEvent,
    handleTicketUpdate,
    handleResolutionUpdate,
    handleNewNotification
  } = useTicketStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Setup real-time Socket.IO event listeners
  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      joinAgentFeedRoom();

      socket.on('agent_event', handleAgentEvent);
      socket.on('ticket_updated', handleTicketUpdate);
      socket.on('resolution_updated', handleResolutionUpdate);
      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('agent_event', handleAgentEvent);
        socket.off('ticket_updated', handleTicketUpdate);
        socket.off('resolution_updated', handleResolutionUpdate);
        socket.off('notification', handleNewNotification);
      };
    }
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tickets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = user?.role === 'customer'
    ? [
        { href: '/chat', label: 'AI Live Chat', icon: MessageSquare, badge: 'Groq' },
        { href: '/tickets', label: 'My Tickets', icon: Ticket },
        { href: '/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/chat', label: 'AI Live Chat', icon: MessageSquare, badge: 'Groq' },
        { href: '/queue', label: 'Triage Queue', icon: Inbox, badge: 'Escalations' },
        { href: '/tickets', label: 'Tickets Desk', icon: Ticket },
        { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
        { href: '/integrations', label: 'Integrations', icon: Boxes },
        { href: '/settings', label: 'Settings', icon: Settings },
      ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-surface border-r border-dark-border flex flex-col transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                ResolveFlow<span className="text-brand-400">_AI</span>
              </div>
              <div className="text-[10px] text-brand-300/70 uppercase tracking-widest font-semibold">
                Autonomous Support
              </div>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-4">
          <Link
            href="/tickets?new=true"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-glow-brand transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href) && item.href !== '/tickets');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive
                    ? 'bg-brand-600/15 text-brand-300 border border-brand-500/25 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-card/60'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Live Engine Status Footer */}
        <div className="p-4 border-t border-dark-border bg-dark-card/30">
          <div className="p-3 rounded-xl bg-dark-card/60 border border-dark-border/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-gray-300 font-medium">Multi-Agent Chain</span>
            </div>
            <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Online
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR HEADER */}
        <header className="sticky top-0 z-40 h-16 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-2 -ml-2 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-display font-semibold text-white truncate">
              {title}
            </h1>
          </div>

          {/* Global Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by subject, #ID, or keyword..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
              />
            </div>
          </form>

          {/* Header Action Items */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-dark-card/80 border border-dark-border px-2 py-1 rounded-xl text-xs">
              <span className="text-gray-400 text-[11px] font-medium mr-1">Demo As:</span>
              <button
                onClick={() => demoLogin('admin')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Admin
              </button>
              <button
                onClick={() => demoLogin('agent')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${user?.role === 'agent' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Agent
              </button>
              <button
                onClick={() => demoLogin('customer')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${user?.role === 'customer' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Customer
              </button>
            </div>

            {/* Notifications Popover Toggle */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-dark-card transition-colors border border-transparent hover:border-dark-border"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-glow-rose">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Drawer Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-glass border border-dark-border p-4 animate-fade-in z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brand-400" />
                      <span className="font-semibold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded-full border border-brand-500/30">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto mt-2 space-y-2 divide-y divide-dark-border/40">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            markNotificationRead(notif._id);
                            if (notif.ticketId?._id || notif.ticketId) {
                              router.push(`/tickets/${notif.ticketId?._id || notif.ticketId}`);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`pt-2.5 first:pt-0 pb-1 cursor-pointer transition-colors hover:bg-dark-hover/40 px-2 rounded-lg ${!notif.isRead ? 'bg-brand-600/5' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-xs text-gray-200">
                              {notif.title}
                            </div>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                            {notif.message}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-card transition-colors border border-transparent hover:border-dark-border"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-500 text-white font-bold flex items-center justify-center text-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || 'RF'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-gray-200 truncate max-w-[120px]">
                    {user?.name || 'Account'}
                  </div>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {user?.role || 'Guest'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* User Menu Popover */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-glass border border-dark-border p-2 animate-fade-in z-50">
                  <div className="px-3 py-2 border-b border-dark-border">
                    <div className="text-xs font-semibold text-white">{user?.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">{user?.email}</div>
                    <div className="mt-1">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {user?.role} Role
                      </span>
                    </div>
                  </div>

                  <div className="p-1 space-y-1">
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-dark-card transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        router.push('/login');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
