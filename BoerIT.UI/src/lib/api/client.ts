/**
 * lib/api/client.ts
 *
 * WHY A TYPED FETCH WRAPPER?
 * Raw `fetch` calls scattered across components create several problems:
 *   1. Auth headers must be repeated everywhere
 *   2. Error handling is inconsistent
 *   3. The base URL is hardcoded in multiple places
 *   4. Response types are lost (everything becomes `any`)
 *
 * This wrapper centralises all of that. Every API call in the app goes through
 * `apiClient.get<T>()`, `apiClient.post<T>()` etc., which:
 *   - Automatically attaches the JWT Bearer token
 *   - Handles 401s globally (clears auth and redirects to login)
 *   - Throws typed errors with the server's error message
 *   - Returns a typed response `T`
 */

import { getToken, removeToken } from '@/lib/auth/token';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 globally — token is expired or invalid
  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  // Parse error body for non-2xx responses
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body?.error ?? 'An unexpected error occurred.');
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
