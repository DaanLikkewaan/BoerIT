import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-stone-900 border border-stone-800 rounded-xl p-5',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-stone-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-white text-2xl font-semibold mt-1.5">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1.5 font-medium',
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-amber-400" />
          </div>
        )}
      </div>
    </div>
  );
}
