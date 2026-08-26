import { create } from 'zustand';
import api from '../services/api';
import { joinUserRoom } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth from localStorage on client boot
  initAuth: async () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    const savedToken = localStorage.getItem('rf_auth_token');
    const savedUser = localStorage.getItem('rf_auth_user');

    if (savedToken && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        set({
          token: savedToken,
          user: userObj,
          isAuthenticated: true,
          isLoading: false,
        });

        joinUserRoom(userObj.id || userObj._id);

        // Background profile sync
        get().fetchProfile();
        return;
      } catch (err) {
        localStorage.removeItem('rf_auth_token');
        localStorage.removeItem('rf_auth_user');
      }
    }

    set({ isLoading: false, isAuthenticated: false, user: null, token: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('rf_auth_token', token);
      localStorage.setItem('rf_auth_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      joinUserRoom(user.id || user._id);
      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed.';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  register: async ({ name, email, password, role = 'customer' }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token, user } = response.data;

      localStorage.setItem('rf_auth_token', token);
      localStorage.setItem('rf_auth_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      joinUserRoom(user.id || user._id);
      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed.';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      localStorage.setItem('rf_auth_user', JSON.stringify(user));
      set({ user });
    } catch (err) {
      console.warn('Profile sync failed:', err.message);
    }
  },

  demoLogin: async (role = 'agent') => {
    let email = 'agent@resolveflow.ai';
    if (role === 'admin') email = 'admin@resolveflow.ai';
    if (role === 'customer') email = 'customer@acme.com';

    return get().login(email, 'Password123!');
  },

  logout: () => {
    localStorage.removeItem('rf_auth_token');
    localStorage.removeItem('rf_auth_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
