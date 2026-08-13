'use client';

/**
 * app/(auth)/login/page.tsx
 *
 * TECHNOLOGIES USED HERE:
 *
 * react-hook-form — Form state management library. Instead of useState for
 * every field, RHF tracks values, validation, and submission state with
 * minimal re-renders. The `register()` function connects HTML inputs to the
 * form without wrapping them in controlled components.
 *
 * @hookform/resolvers/zod — Bridges RHF and Zod. The `zodResolver()` runs
 * your Zod schema on form submission (and optionally on change/blur),
 * populating `formState.errors` with typed, field-level error messages.
 *
 * sonner (toast) — Imperative toast notifications. `toast.success()` and
 * `toast.error()` can be called from anywhere — no context needed.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { loginSchema, type LoginFormData } from '@/lib/validators';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/useAuth';
import { ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const response = await authApi.login(data);
      setAuth(
        {
          userId: response.userId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
        },
        response.accessToken
      );
      toast.success(`Welcome back, ${response.firstName}!`);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      toast.error(message);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Sign in</h1>
        <p className="text-stone-400 mt-1 text-sm">Enter your credentials to access your farms.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full bg-stone-900 border border-stone-700 text-white placeholder-stone-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className="w-full bg-stone-900 border border-stone-700 text-white placeholder-stone-500 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
