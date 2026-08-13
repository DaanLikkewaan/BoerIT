import { apiClient } from './client';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/login', payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/api/auth/register', payload),
};
