'use client';

/**
 * components/layout/AuthGuard.tsx
 *
 * WHY A CLIENT-SIDE AUTH GUARD?
 * Since our JWT lives in sessionStorage (client-side), the server cannot
 * read it during SSR. We therefore handle auth protection on the client.
 *
 * This component wraps every page inside (app) — it checks the Zustand
 * store on mount. If there's no token, it redirects to /login immediately.
 * The brief loading state prevents a flash of protected content.
 *
 * A future upgrade path: move the token to an httpOnly cookie and use
 * Next.js middleware (middleware.ts) for true server-side protection.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [token, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-400 text-sm tracking-wider uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
