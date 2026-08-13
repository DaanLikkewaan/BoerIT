/**
 * lib/utils/index.ts
 *
 * Pure utility functions with no side effects.
 * `cn()` is the standard shadcn/ui class merging helper — it combines
 * clsx (conditional classes) and tailwind-merge (deduplicates conflicting
 * Tailwind classes like `p-2 p-4` → `p-4`).
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely — use this everywhere instead of template literals */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as South African Rand */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a large number with thousand separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-ZA').format(value);
}

/** Format an ISO date string to a readable format */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Get initials from a first and last name */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Convert a camelCase or snake_case key to a human-readable label */
export function toLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
