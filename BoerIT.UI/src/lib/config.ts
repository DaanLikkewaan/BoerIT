/**
 * lib/config.ts
 *
 * Build-time feature switches. NEXT_PUBLIC_ values are inlined when the app is
 * built, so each deployed environment gets its own build (see
 * .github/workflows/deploy.yml).
 */

/**
 * Whether visitors may create their own account. Off in the hosted demo
 * environments, where accounts are provisioned for invited users only. The API
 * enforces the same rule; this only keeps the UI from offering a dead end.
 * Defaults to on so local development works without any setup.
 */
export const ALLOW_REGISTRATION = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION !== 'false';
