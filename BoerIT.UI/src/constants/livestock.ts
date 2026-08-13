/**
 * constants/livestock.ts
 *
 * Single source of truth for all livestock and parameter metadata.
 * Centralising these means the forms and labels update everywhere
 * when you add a new category — no hunting through components.
 */

export const LIVESTOCK_SPECIES = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'sheep', label: 'Sheep' },
] as const;

export const CATTLE_CATEGORIES = [
  { value: 'cow',    label: 'Cows' },
  { value: 'bull',   label: 'Bulls' },
  { value: 'tolly',  label: 'Tollies' },
  { value: 'heifer', label: 'Heifers' },
] as const;

export const SHEEP_CATEGORIES = [
  { value: 'ewe',    label: 'Ewes' },
  { value: 'ram',    label: 'Rams' },
  { value: 'lamb',   label: 'Lambs' },
  { value: 'hogget', label: 'Hoggets' },
] as const;

export const ALL_CATEGORIES = [...CATTLE_CATEGORIES, ...SHEEP_CATEGORIES];

/** Default farm parameters — these mirror the backend defaults in ForecastService */
export const DEFAULT_PARAMETERS = [
  // Cattle production
  { parameterKey: 'cattle_calving_rate_pct',      parameterValue: '85',   unit: '%',      category: 'Cattle Production',  label: 'Calving Rate' },
  { parameterKey: 'cattle_calf_mortality_pct',     parameterValue: '3',    unit: '%',      category: 'Cattle Production',  label: 'Calf Mortality Rate' },
  { parameterKey: 'cattle_tolly_price_per_head',   parameterValue: '8500', unit: 'ZAR',    category: 'Cattle Production',  label: 'Tolly Sale Price (per head)' },

  // Sheep production
  { parameterKey: 'sheep_lambing_rate_pct',        parameterValue: '90',   unit: '%',      category: 'Sheep Production',   label: 'Lambing Rate' },
  { parameterKey: 'sheep_lamb_mortality_pct',      parameterValue: '5',    unit: '%',      category: 'Sheep Production',   label: 'Lamb Mortality Rate' },
  { parameterKey: 'sheep_lamb_price_per_head',     parameterValue: '1200', unit: 'ZAR',    category: 'Sheep Production',   label: 'Lamb Sale Price (per head)' },

  // Operating costs
  { parameterKey: 'feed_cost_per_animal_unit',     parameterValue: '1200', unit: 'ZAR/AU', category: 'Operating Costs',    label: 'Feed Cost (per animal unit)' },
  { parameterKey: 'vet_cost_per_animal_unit',      parameterValue: '150',  unit: 'ZAR/AU', category: 'Operating Costs',    label: 'Vet Cost (per animal unit)' },
  { parameterKey: 'labour_cost_per_worker_annual', parameterValue: '72000',unit: 'ZAR/yr', category: 'Operating Costs',    label: 'Annual Labour Cost (per worker)' },
  { parameterKey: 'worker_count',                  parameterValue: '2',    unit: '',       category: 'Operating Costs',    label: 'Number of Workers' },
] as const;

export type DefaultParameter = typeof DEFAULT_PARAMETERS[number];
