import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authService } from '../services/authService';
import { socketService } from '../services/socketService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.login(email, password);
        set({ 
          user: response.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Connect to Socket.IO after successful login
        socketService.connect();
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Login failed', 
          isLoading: false 
        });
        throw error;
      }
    },

    signup: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.signup(email, password);
        set({ 
          user: response.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Connect to Socket.IO after successful signup
        socketService.connect();
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Signup failed', 
          isLoading: false 
        });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true });
      
      // Disconnect Socket.IO before logout
      socketService.disconnect();
      
      try {
        await authService.logout();
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear local state even if API call fails
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null
        });
      }
    },

    checkAuth: async () => {
      set({ isLoading: true });
      try {
        const response = await authService.me();
        if (response.user) {
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Connect to Socket.IO if authenticated
          socketService.connect();
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          
          // Disconnect Socket.IO if not authenticated
          socketService.disconnect();
        }
      } catch (error) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    },

    clearError: () => set({ error: null })
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ 
      user: state.user, 
      isAuthenticated: state.isAuthenticated 
    })
  }
));