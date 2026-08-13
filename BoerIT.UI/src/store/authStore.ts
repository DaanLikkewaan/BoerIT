/**
 * store/authStore.ts
 *
 * WHY ZUSTAND?
 * Zustand is a minimal global state manager. Unlike Redux it has almost no
 * boilerplate — you define state and actions in a single `create()` call.
 * Unlike React Context it does NOT re-render the entire tree on every change;
 * components only re-render when the specific slice they subscribe to changes.
 *
 * The `persist` middleware serialises state to sessionStorage automatically,
 * so auth survives page refreshes without a server round-trip.
 *
 * Pattern: `useAuthStore(state => state.user)` — only subscribes to `user`.
 * The component won't re-render if only `token` changes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';
import { setToken, removeToken } from '@/lib/auth/token';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        setToken(token);
        set({ user, token });
      },

      clearAuth: () => {
        removeToken();
        set({ user: null, token: null });
      },
    }),
    {
      name: 'boerit-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      // Only persist the user object, not the token (token is in sessionStorage via setToken)
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
