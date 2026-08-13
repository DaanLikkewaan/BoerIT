/**
 * store/farmStore.ts
 *
 * Stores the currently active farm context. When a user navigates into
 * /farms/[farmId], this store is populated so that child pages (parameters,
 * forecast) can read the farm name, ID and other details without prop-drilling
 * or re-fetching.
 */

import { create } from 'zustand';
import type { Farm } from '@/types/farm';

interface FarmState {
  activeFarm: Farm | null;
  setActiveFarm: (farm: Farm | null) => void;
}

export const useFarmStore = create<FarmState>()((set) => ({
  activeFarm: null,
  setActiveFarm: (farm) => set({ activeFarm: farm }),
}));
