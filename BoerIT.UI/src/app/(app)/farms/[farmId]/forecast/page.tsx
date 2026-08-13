'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronUp, Trash2, Zap } from 'lucide-react';
import { forecastsApi } from '@/lib/api/forecasts';
import { PageLoader, ErrorMessage } from '@/components/ui/Feedback';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Forecast, ForecastSummary, ForecastYear } from '@/types/forecast';

export default function ForecastPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const [generating, setGenerating] = useState(false);
  const [forecastYears, setForecastYears] = useState(5);
  const [selectedForecastId, setSelectedForecastId] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: summaries = [], isLoading, error, mutate: mutateSummaries } =
    useSWR<ForecastSummary[]>(`forecasts-${farmId}`, () => forecastsApi.list(farmId));

  const { data: activeForecast, isLoading: loadingForecast } =
    useSWR<Forecast>(
      selectedForecastId ? `forecast-${selectedForecastId}` : null,
      () => forecastsApi.get(farmId, selectedForecastId!)
    );

  async function handleGenerate() {
    setGenerating(true);
    try {
      const forecast = await forecastsApi.generate(farmId, { forecastYears });
      await mutateSummaries();
      setSelectedForecastId(forecast.id);
      toast.success('Forecast generated successfully.');
    } catch {
      toast.error('Failed to generate forecast. Ensure farm parameters are configured.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this forecast?')) return;
    setDeletingId(id);
    try {
      await forecastsApi.delete(farmId, id);
      await mutateSummaries();
      if (selectedForecastId === id) setSelectedForecastId(null);
      toast.success('Forecast deleted.');
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorMessage message="Failed to load forecasts." />;

  return (
    <div className="space-y-8">
      {/* Generate panel */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-1">Generate New Forecast</h2>
        <p className="text-stone-400 text-sm mb-5">
          Runs the livestock production model against your current parameters.
        </p>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Forecast horizon (years)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={forecastYears}
              onChange={(e) => setForecastYears(Number(e.target.value))}
              className="w-28 bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate forecast'}
          </button>
        </div>
      </div>

      {/* Forecast history */}
      {summaries.length > 0 && (
        <div>
          <h2 className="text-white font-medium mb-3">Forecast History</h2>
          <div className="space-y-2">
            {summaries.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedForecastId === s.id
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-stone-800 bg-stone-900 hover:border-stone-700'
                }`}
                onClick={() => setSelectedForecastId(s.id)}
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {s.baseYear} — {s.baseYear + s.forecastYears - 1} ({s.forecastYears} years)
                  </p>
                  <p className="text-stone-500 text-xs mt-0.5">Generated {formatDate(s.generatedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {s.status}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    disabled={deletingId === s.id}
                    className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active forecast detail */}
      {selectedForecastId && (
        loadingForecast ? (
          <PageLoader />
        ) : activeForecast ? (
          <ForecastDetail forecast={activeForecast} expandedYear={expandedYear} onToggleYear={setExpandedYear} />
        ) : null
      )}
    </div>
  );
}

// ── ForecastDetail sub-component ──────────────────────────────────────────────

function ForecastDetail({
  forecast,
  expandedYear,
  onToggleYear,
}: {
  forecast: Forecast;
  expandedYear: string | null;
  onToggleYear: (id: string | null) => void;
}) {
  return (
    <div>
      <h2 className="text-white font-medium mb-4">
        Forecast Results — {forecast.baseYear} to {forecast.baseYear + forecast.forecastYears - 1}
      </h2>

      {/* Summary chart — simple bar representation */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-6">
        <div className="flex items-end gap-2 h-32">
          {forecast.years.map((y) => {
            const maxProfit = Math.max(...forecast.years.map((yr) => Math.abs(yr.netProfit)));
            const height = maxProfit > 0 ? Math.abs(y.netProfit) / maxProfit : 0;
            const positive = y.netProfit >= 0;
            return (
              <div key={y.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${positive ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
                  style={{ height: `${height * 100}%` }}
                />
                <span className="text-stone-500 text-xs">{y.year}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-stone-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500/70 inline-block" /> Profit</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/70 inline-block" /> Loss</span>
        </div>
      </div>

      {/* Year-by-year breakdown */}
      <div className="space-y-3">
        {forecast.years.map((year) => (
          <YearCard
            key={year.id}
            year={year}
            expanded={expandedYear === year.id}
            onToggle={() => onToggleYear(expandedYear === year.id ? null : year.id)}
          />
        ))}
      </div>
    </div>
  );
}

function YearCard({ year, expanded, onToggle }: {
  year: ForecastYear;
  expanded: boolean;
  onToggle: () => void;
}) {
  const positive = year.netProfit >= 0;

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-800/50 transition-colors">
        <div className="flex items-center gap-6">
          <span className="text-white font-semibold text-lg">{year.year}</span>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-stone-500 text-xs block">Income</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(year.totalIncome)}</span>
            </div>
            <div>
              <span className="text-stone-500 text-xs block">Expenses</span>
              <span className="text-red-400 font-medium">{formatCurrency(year.totalExpenses)}</span>
            </div>
            <div>
              <span className="text-stone-500 text-xs block">Net</span>
              <span className={`font-semibold flex items-center gap-1 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {formatCurrency(year.netProfit)}
              </span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-stone-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {/* Income */}
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Income</h4>
              <div className="space-y-2">
                {year.lineItems.filter((l) => l.type === 'income').map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-stone-300">{item.description}</p>
                      <p className="text-stone-500 text-xs">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <span className="text-emerald-400 font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Expenses */}
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Expenses</h4>
              <div className="space-y-2">
                {year.lineItems.filter((l) => l.type === 'expense').map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-stone-300">{item.description}</p>
                      <p className="text-stone-500 text-xs">{item.quantity} units × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <span className="text-red-400 font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
