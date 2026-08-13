import { apiClient } from './client';
import type { Farm, CreateFarmPayload, UpdateFarmPayload } from '@/types/farm';

export const farmsApi = {
  list: () =>
    apiClient.get<Farm[]>('/api/farms'),

  get: (farmId: string) =>
    apiClient.get<Farm>(`/api/farms/${farmId}`),

  create: (payload: CreateFarmPayload) =>
    apiClient.post<Farm>('/api/farms', payload),

  update: (farmId: string, payload: UpdateFarmPayload) =>
    apiClient.put<Farm>(`/api/farms/${farmId}`, payload),

  delete: (farmId: string) =>
    apiClient.delete<void>(`/api/farms/${farmId}`),
};
