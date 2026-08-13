'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { registerSchema, type RegisterFormData } from '@/lib/validators';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/useAuth';
import { ApiError } from '@/lib/api/client';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      setAuth(
        {
          userId: response.userId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
        },
        response.accessToken
      );
      toast.success('Account created! Welcome to BoerIT.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      toast.error(message);
    }
  }

  const inputClass =
    'w-full bg-stone-900 border border-stone-700 text-white placeholder-stone-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="text-stone-400 mt-1 text-sm">Start forecasting your farm&apos;s future today.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-stone-300 mb-1.5">
              First name
            </label>
            <input id="firstName" type="text" {...register('firstName')} className={inputClass} placeholder="Jan" />
            {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-stone-300 mb-1.5">
              Last name
            </label>
            <input id="lastName" type="text" {...register('lastName')} className={inputClass} placeholder="van der Berg" />
            {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-1.5">
            Email address
          </label>
          <input id="email" type="email" autoComplete="email" {...register('email')} className={inputClass} placeholder="you@example.com" />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
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
              autoComplete="new-password"
              {...register('password')}
              className={`${inputClass} pr-10`}
              placeholder="Min. 8 characters"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-300 mb-1.5">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={inputClass}
            placeholder="••••••••"
          />
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
