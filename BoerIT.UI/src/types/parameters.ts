export interface FarmParameter {
  parameterKey: string;
  parameterValue: string;
  unit?: string;
  category?: string;
}

export interface LivestockGroup {
  id: string;
  farmId: string;
  species: 'cattle' | 'sheep';
  category: LivestockCategory;
  currentCount: number;
  targetCount?: number;
  averageAgeMonths?: number;
  averageWeightKg?: number;
  createdAt: string;
  updatedAt?: string;
}

export type LivestockCategory =
  | 'cow' | 'bull' | 'tolly' | 'heifer'   // cattle
  | 'ewe' | 'ram' | 'lamb' | 'hogget';    // sheep

export interface UpsertParametersPayload {
  parameters: FarmParameter[];
}

export interface LivestockGroupPayload {
  species: 'cattle' | 'sheep';
  category: LivestockCategory;
  currentCount: number;
  targetCount?: number;
  averageAgeMonths?: number;
  averageWeightKg?: number;
}

// Grouped view for the parameters page
export interface ParameterGroup {
  category: string;
  label: string;
  parameters: FarmParameter[];
}
