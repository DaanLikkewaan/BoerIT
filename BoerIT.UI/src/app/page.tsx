import { redirect } from 'next/navigation';

/**
 * app/page.tsx
 *
 * The root URL "/" has no content of its own.
 * We redirect immediately to /dashboard which the AuthGuard will then
 * redirect to /login if the user is not authenticated.
 */
export default function RootPage() {
  redirect('/dashboard');
}
