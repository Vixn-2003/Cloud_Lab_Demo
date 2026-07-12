import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin';
  studentCode?: string | null;
  email?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      initialized: false,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true, initialized: true });
        // Cần ghi cookie để middleware (nếu có) có thể đọc được token đồng bộ
        if (typeof window !== 'undefined') {
          document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Strict`;
        }
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, initialized: true });
        if (typeof window !== 'undefined') {
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      },
      initialize: () => {
        set({ initialized: true });
      },
    }),
    {
      name: 'cloud-lab-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
