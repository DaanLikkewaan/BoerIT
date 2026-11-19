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
 *
 * output: 'standalone' — The build emits a self-contained `server.js` plus only
 * the node_modules it actually needs. The deployment pipeline ships that folder
 * to Azure App Service and starts it with `node server.js`, so the server never
 * has to run `npm install` itself. Has no effect on `npm run dev`.
 *
 * NOTE: NEXT_PUBLIC_ values are baked in at build time, which is why the
 * pipeline builds the UI separately for beta and production.
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig;
