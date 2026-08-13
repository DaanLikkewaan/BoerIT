import type { NextConfig } from 'next';

/**
 * next.config.ts
 *
 * KEY SETTINGS:
 *
 * reactStrictMode — Runs components twice in development to detect side effects.
 * Keeps your code clean. Always leave this on.
 *
 * env — Exposes environment variables to the browser bundle. Only variables
 * prefixed with NEXT_PUBLIC_ are safe to expose client-side. Server-side
 * variables (like database credentials) should never use NEXT_PUBLIC_.
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
