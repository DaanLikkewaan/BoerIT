import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2.5 rounded-lg',
      className
    )}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn(
        'border-2 border-amber-500 border-t-transparent rounded-full animate-spin',
        sizes[size]
      )} />
      {label && <p className="text-stone-400 text-sm">{label}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}
