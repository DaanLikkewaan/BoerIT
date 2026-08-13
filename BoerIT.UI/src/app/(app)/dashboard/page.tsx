'use client';

/**
 * app/(app)/dashboard/page.tsx
 *
 * The landing page after login. Shows a summary of the user's farms
 * and quick-access cards. Uses SWR for data fetching.
 *
 * WHY SWR?
 * SWR (stale-while-revalidate) is a React data-fetching library by Vercel.
 * It caches responses and revalidates in the background, giving the user
 * instant perceived performance. Key benefits:
 *   - Automatic caching by URL key
 *   - Background revalidation on window focus
 *   - Loading and error states out of the box
 *   - Deduplicates simultaneous requests for the same key
 *
 * Pattern: `useSWR(key, fetcher)` — if the key is null/undefined,
 * the fetch is skipped. We use this to conditionally fetch farm-scoped data.
 */

import useSWR from 'swr';
import Link from 'next/link';
import { Plus, MapPin, TrendingUp, Wheat } from 'lucide-react';
import { farmsApi } from '@/lib/api/farms';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PageLoader, ErrorMessage } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/utils';
import type { Farm } from '@/types/farm';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: farms, isLoading, error } = useSWR<Farm[]>('farms', farmsApi.list);

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorMessage message="Failed to load your farms." className="mt-8" />;

  const farmCount = farms?.length ?? 0;
  const totalHectares = farms?.reduce((sum, f) => sum + f.landHectares, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={`Good day, ${user?.firstName ?? 'Farmer'}`}
        description="Here's an overview of your farm portfolio."
        action={
          <Link
            href="/farms"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Farm
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Farm Profiles" value={farmCount} icon={MapPin} />
        <StatCard label="Total Land" value={`${totalHectares.toLocaleString('en-ZA')} ha`} icon={Wheat} />
        <StatCard label="Forecasts Generated" value="—" icon={TrendingUp} />
      </div>

      {/* Farm cards */}
      {farmCount === 0 ? (
        <div className="border border-dashed border-stone-800 rounded-xl p-12 text-center">
          <Wheat className="w-10 h-10 text-stone-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-1">No farms yet</h3>
          <p className="text-stone-400 text-sm mb-6">Create your first farm profile to get started.</p>
          <Link
            href="/farms"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create farm
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-4">Your Farms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms?.map((farm) => (
              <Link
                key={farm.id}
                href={`/farms/${farm.id}`}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-xl p-5 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs text-stone-500">{formatDate(farm.createdAt)}</span>
                </div>
                <h3 className="text-white font-medium group-hover:text-amber-400 transition-colors">{farm.name}</h3>
                {farm.location && <p className="text-stone-500 text-xs mt-0.5">{farm.location}</p>}
                <p className="text-stone-400 text-sm mt-3">{farm.landHectares.toLocaleString('en-ZA')} ha</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
