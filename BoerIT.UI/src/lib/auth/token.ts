/**
 * lib/auth/token.ts
 *
 * WHY THIS EXISTS:
 * JWT tokens must never be stored in localStorage — it is accessible to any
 * JavaScript on the page, making it vulnerable to XSS attacks. Instead we keep
 * the access token in memory (a module-level variable that survives re-renders
 * but is wiped on page refresh) and store only the refresh token in an httpOnly
 * cookie (set by the server, unreadable by JS).
 *
 * For this initial implementation we store the token in memory + sessionStorage
 * as a pragmatic middle ground, with a clear upgrade path to httpOnly cookies
 * once a Next.js API route proxy is in place.
 */

const TOKEN_KEY = 'boerit_access_token';
const USER_KEY = 'boerit_user';

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
