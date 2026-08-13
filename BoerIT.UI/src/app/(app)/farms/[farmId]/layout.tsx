'use client';

/**
 * app/(app)/farms/[farmId]/layout.tsx — Farm-scoped layout
 *
 * This layout wraps all pages under /farms/[farmId] — the farm overview,
 * parameters, and forecast pages. It:
 *   1. Fetches the farm record using the [farmId] URL param
 *   2. Puts it into the Zustand farmStore so child pages don't need to re-fetch
 *   3. Renders farm-level sub-navigation tabs
 *
 * WHY LAYOUT-LEVEL DATA FETCHING?
 * If each child page fetched the farm independently, you'd get waterfall
 * requests and loading flickers on every tab switch. Fetching once here and
 * sharing via the store gives instant sub-navigation.
 */

import { useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronRight, Settings, TrendingUp, LayoutGrid } from 'lucide-react';
import { farmsApi } from '@/lib/api/farms';
import { useFarmStore } from '@/store/farmStore';
import { PageLoader, ErrorMessage } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';
import type { Farm } from '@/types/farm';

export default function FarmLayout({ children }: { children: React.ReactNode }) {
  const { farmId } = useParams<{ farmId: string }>();
  const pathname = usePathname();
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm);

  const { data: farm, isLoading, error } = useSWR<Farm>(
    farmId ? `farm-${farmId}` : null,
    () => farmsApi.get(farmId)
  );

  useEffect(() => {
    if (farm) setActiveFarm(farm);
    return () => setActiveFarm(null);
  }, [farm, setActiveFarm]);

  if (isLoading) return <PageLoader />;
  if (error || !farm) return <ErrorMessage message="Farm not found or access denied." />;

  const tabs = [
    { href: `/farms/${farmId}`,            label: 'Overview',   icon: LayoutGrid },
    { href: `/farms/${farmId}/parameters`, label: 'Parameters', icon: Settings },
    { href: `/farms/${farmId}/forecast`,   label: 'Forecast',   icon: TrendingUp },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
        <Link href="/farms" className="hover:text-stone-300 transition-colors">My Farms</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-300">{farm.name}</span>
      </nav>

      {/* Farm name + sub-tabs */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-4">{farm.name}</h1>
        <div className="flex gap-1 border-b border-stone-800 -mb-px">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  active
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-white hover:border-stone-600'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
