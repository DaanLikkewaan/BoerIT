'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Settings, TrendingUp, MapPin, Ruler, Calendar } from 'lucide-react';
import { useFarmStore } from '@/store/farmStore';
import { forecastsApi } from '@/lib/api/forecasts';
import { parametersApi } from '@/lib/api/parameters';
import { StatCard } from '@/components/ui/StatCard';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { ForecastSummary } from '@/types/forecast';
import type { LivestockGroup } from '@/types/parameters';

export default function FarmOverviewPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const farm = useFarmStore((s) => s.activeFarm);

  const { data: forecasts } = useSWR<ForecastSummary[]>(
    `forecasts-${farmId}`, () => forecastsApi.list(farmId)
  );
  const { data: livestock } = useSWR<LivestockGroup[]>(
    `livestock-${farmId}`, () => parametersApi.listLivestock(farmId)
  );

  const latestForecast = forecasts?.[0];
  const totalAnimals = livestock?.reduce((s, g) => s + g.currentCount, 0) ?? 0;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Land Size" value={`${farm?.landHectares?.toLocaleString('en-ZA') ?? '—'} ha`} icon={Ruler} />
        <StatCard label="Total Animals" value={totalAnimals === 0 ? '—' : totalAnimals.toLocaleString('en-ZA')} icon={MapPin} />
        <StatCard label="Forecasts" value={forecasts?.length ?? '—'} icon={TrendingUp} />
        <StatCard label="Created" value={farm ? formatDate(farm.createdAt) : '—'} icon={Calendar} />
      </div>

      {/* Latest forecast summary */}
      {latestForecast && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">Latest Forecast</h2>
            <Link
              href={`/farms/${farmId}/forecast`}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Base Year</p>
              <p className="text-white text-lg font-semibold">{latestForecast.baseYear}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Horizon</p>
              <p className="text-white text-lg font-semibold">{latestForecast.forecastYears} yrs</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Generated</p>
              <p className="text-white text-lg font-semibold">{formatDate(latestForecast.generatedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/farms/${farmId}/parameters`}
          className="bg-stone-900 border border-stone-800 hover:border-amber-500/30 rounded-xl p-5 flex items-center gap-4 transition-colors group"
        >
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-white font-medium group-hover:text-amber-400 transition-colors">Farm Parameters</p>
            <p className="text-stone-400 text-sm">Configure livestock counts, rates and costs</p>
          </div>
        </Link>
        <Link
          href={`/farms/${farmId}/forecast`}
          className="bg-stone-900 border border-stone-800 hover:border-amber-500/30 rounded-xl p-5 flex items-center gap-4 transition-colors group"
        >
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-white font-medium group-hover:text-amber-400 transition-colors">Financial Forecast</p>
            <p className="text-stone-400 text-sm">Generate and view herd & financial projections</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
