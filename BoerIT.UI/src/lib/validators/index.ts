/**
 * lib/validators/index.ts
 *
 * WHY ZOD?
 * Zod is a TypeScript-first schema validation library. Instead of writing
 * manual `if (!email.includes('@'))` checks, you declare the shape of valid
 * data once and Zod handles validation AND type inference simultaneously.
 *
 * The `z.infer<typeof schema>` pattern means your form types are ALWAYS in
 * sync with your validation rules — no duplication, no drift.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const farmSchema = z.object({
  name: z.string().min(1, 'Farm name is required').max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  landHectares: z
    .number({ error: 'Must be a number' })
    .positive('Land size must be greater than 0')
    .max(1_000_000),
});

export const livestockGroupSchema = z.object({
  species: z.enum(['cattle', 'sheep']),
  category: z.enum(['cow', 'bull', 'tolly', 'heifer', 'ewe', 'ram', 'lamb', 'hogget']),
  currentCount: z.number().int().min(0, 'Count cannot be negative'),
  targetCount: z.number().int().min(0).optional(),
  averageAgeMonths: z.number().min(0).optional(),
  averageWeightKg: z.number().min(0).optional(),
});

export const generateForecastSchema = z.object({
  forecastYears: z
    .number({ error: 'Must be a number' })
    .int()
    .min(1, 'Minimum 1 year')
    .max(20, 'Maximum 20 years'),
});

// Inferred types — these replace manually written interface definitions for forms
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type FarmFormData = z.infer<typeof farmSchema>;
export type LivestockGroupFormData = z.infer<typeof livestockGroupSchema>;
export type GenerateForecastFormData = z.infer<typeof generateForecastSchema>;
