import { apiClient } from './client';
import type { Forecast, ForecastSummary, GenerateForecastPayload } from '@/types/forecast';

export const forecastsApi = {
  list: (farmId: string) =>
    apiClient.get<ForecastSummary[]>(`/api/farms/${farmId}/forecasts`),

  get: (farmId: string, forecastId: string) =>
    apiClient.get<Forecast>(`/api/farms/${farmId}/forecasts/${forecastId}`),

  generate: (farmId: string, payload: GenerateForecastPayload) =>
    apiClient.post<Forecast>(`/api/farms/${farmId}/forecasts`, payload),

  delete: (farmId: string, forecastId: string) =>
    apiClient.delete<void>(`/api/farms/${farmId}/forecasts/${forecastId}`),
};
