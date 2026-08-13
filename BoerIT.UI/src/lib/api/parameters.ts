import { apiClient } from './client';
import type {
  FarmParameter,
  LivestockGroup,
  LivestockGroupPayload,
  UpsertParametersPayload,
} from '@/types/parameters';

export const parametersApi = {
  // Farm key-value parameters
  list: (farmId: string) =>
    apiClient.get<FarmParameter[]>(`/api/farms/${farmId}/parameters`),

  upsert: (farmId: string, payload: UpsertParametersPayload) =>
    apiClient.put<void>(`/api/farms/${farmId}/parameters`, payload),

  delete: (farmId: string, key: string) =>
    apiClient.delete<void>(`/api/farms/${farmId}/parameters/${key}`),

  // Livestock groups
  listLivestock: (farmId: string) =>
    apiClient.get<LivestockGroup[]>(`/api/farms/${farmId}/parameters/livestock`),

  upsertLivestock: (farmId: string, payload: LivestockGroupPayload) =>
    apiClient.put<LivestockGroup>(`/api/farms/${farmId}/parameters/livestock`, payload),

  deleteLivestock: (farmId: string, groupId: string) =>
    apiClient.delete<void>(`/api/farms/${farmId}/parameters/livestock/${groupId}`),
};
