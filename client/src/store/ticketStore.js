import { create } from 'zustand';
import api from '../services/api';

export const useTicketStore = create((set, get) => ({
  tickets: [],
  pagination: { total: 0, page: 1, pages: 1, limit: 20 },
  activeTicket: null,
  messages: [],
  activeResolution: null,
  metrics: {
    totalTickets: 0,
    openTickets: 0,
    escalatedTickets: 0,
    resolvedTickets: 0,
    autoResolveRate: 72.5,
    escalationRate: 27.5,
    avgResolutionTimeSeconds: 1.45,
  },
  recentLogs: [],
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isTicketLoading: false,
  error: null,

  fetchDashboardMetrics: async () => {
    try {
      const response = await api.get('/tickets/dashboard');
      if (response.data?.success) {
        set({
          metrics: response.data.metrics || get().metrics,
          recentLogs: response.data.recentLogs || [],
        });
      }
    } catch (err) {
      console.warn('Failed to fetch dashboard metrics:', err.message);
    }
  },

  fetchTickets: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/tickets', { params });
      if (response.data?.success) {
        set({
          tickets: response.data.tickets || [],
          pagination: response.data.pagination || get().pagination,
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: err.response?.data?.error || err.message,
        isLoading: false,
      });
    }
  },

  fetchTicketById: async (id) => {
    set({ isTicketLoading: true, error: null });
    try {
      const response = await api.get(`/tickets/${id}`);
      if (response.data?.success) {
        set({
          activeTicket: response.data.ticket,
          messages: response.data.messages || [],
          activeResolution: response.data.activeResolution || null,
          isTicketLoading: false,
        });
      }
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.error || err.message,
        isTicketLoading: false,
      });
      return null;
    }
  },

  createTicket: async (ticketData) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/tickets', ticketData);
      set({ isLoading: false });
      return { success: true, ticket: response.data.ticket };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    }
  },

  sendMessage: async (ticketId, content) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/messages`, { content });
      if (response.data?.success) {
        // Optimistically add message
        set((state) => ({
          messages: [...state.messages, response.data.data],
        }));
      }
      return { success: true, message: response.data.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    }
  },

  approveResolution: async (resolutionId) => {
    try {
      const response = await api.post(`/resolutions/${resolutionId}/approve`);
      if (response.data?.success) {
        set((state) => ({
          activeResolution: response.data.resolution,
          activeTicket: response.data.ticket || state.activeTicket,
        }));
        get().fetchTicketById(get().activeTicket?._id);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    }
  },

  editResolution: async (resolutionId, content) => {
    try {
      const response = await api.post(`/resolutions/${resolutionId}/edit`, { content });
      if (response.data?.success) {
        set((state) => ({
          activeResolution: response.data.resolution,
          activeTicket: response.data.ticket || state.activeTicket,
        }));
        get().fetchTicketById(get().activeTicket?._id);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    }
  },

  retryResolution: async (resolutionId) => {
    try {
      const response = await api.post(`/resolutions/${resolutionId}/retry`);
      return response.data;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data?.success) {
        set({
          notifications: response.data.notifications || [],
          unreadCount: response.data.unreadCount || 0,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  },

  markNotificationRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.warn('Failed to mark read:', err.message);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.warn('Failed to mark all read:', err.message);
    }
  },

  // Real-time Event Handlers
  handleAgentEvent: (event) => {
    set((state) => {
      // If this event belongs to active ticket, append log
      if (state.activeTicket && String(state.activeTicket._id) === String(event.ticketId)) {
        const currentLogs = state.activeResolution?.logs || [];
        const exists = currentLogs.some((l) => l._id === event.id || l.id === event.id);
        if (!exists) {
          const updatedLogs = [...currentLogs, event];
          return {
            activeResolution: {
              ...state.activeResolution,
              logs: updatedLogs,
            },
            recentLogs: [event, ...state.recentLogs.slice(0, 7)],
          };
        }
      }
      return {
        recentLogs: [event, ...state.recentLogs.slice(0, 7)],
      };
    });
  },

  handleTicketUpdate: (updatedTicket) => {
    set((state) => {
      const isCurrent = state.activeTicket && String(state.activeTicket._id) === String(updatedTicket._id || updatedTicket.id);
      return {
        activeTicket: isCurrent ? { ...state.activeTicket, ...updatedTicket } : state.activeTicket,
        tickets: state.tickets.map((t) =>
          String(t._id) === String(updatedTicket._id || updatedTicket.id)
            ? { ...t, ...updatedTicket }
            : t
        ),
      };
    });
  },

  handleResolutionUpdate: (resolution) => {
    set((state) => {
      if (state.activeTicket && String(state.activeTicket._id) === String(resolution.ticketId)) {
        return {
          activeResolution: {
            ...state.activeResolution,
            ...resolution,
            logs: state.activeResolution?.logs || [],
          },
        };
      }
      return {};
    });
  },

  handleNewNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
