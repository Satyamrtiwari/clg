import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from localStorage
  const savedToken = localStorage.getItem('access_token');
  const savedUser = localStorage.getItem('user_data');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    isAuthenticated: !!savedToken,

    setAuth: (user: User, token: string) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
