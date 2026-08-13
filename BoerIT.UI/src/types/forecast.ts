export interface ForecastSummary {
  id: string;
  farmId: string;
  generatedAt: string;
  baseYear: number;
  forecastYears: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface Forecast extends ForecastSummary {
  years: ForecastYear[];
}

export interface ForecastYear {
  id: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  lineItems: ForecastLineItem[];
}

export interface ForecastLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'income' | 'expense';
}

export interface GenerateForecastPayload {
  forecastYears: number;
}
