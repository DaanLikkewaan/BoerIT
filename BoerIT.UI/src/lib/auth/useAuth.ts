'use client';

/**
 * lib/auth/useAuth.ts
 *
 * A thin hook that reads auth state from Zustand and exposes helpers.
 * Components import this instead of touching the store directly — it gives
 * us one place to add loading states, redirect logic, etc. later.
 */

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, token, setAuth, clearAuth } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated: !!token,
    setAuth,
    logout: clearAuth,
  };
}
