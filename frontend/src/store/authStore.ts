import { create } from 'zustand';

// Staff shape returned by GET /api/auth/me.
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'attorney' | 'paralegal' | 'admin';
  active: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

// Token is mirrored to localStorage so Axios interceptors can read it
// without needing access to the store. The store is the source of truth
// for the React side; localStorage is only for the Axios layer.
const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;