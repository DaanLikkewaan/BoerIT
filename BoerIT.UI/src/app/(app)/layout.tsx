/**
 * app/(app)/layout.tsx — Authenticated App Shell
 *
 * This layout wraps every authenticated page. It:
 *   1. Runs AuthGuard — redirects to /login if no token
 *   2. Renders the persistent Sidebar
 *   3. Provides the main scrollable content area
 *
 * Because this is a Server Component by default, the AuthGuard (which is a
 * Client Component) is imported and rendered here — the boundary between
 * server and client is cleanly managed by the 'use client' directive on
 * AuthGuard itself.
 */

import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-stone-950">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
