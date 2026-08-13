/**
 * app/layout.tsx — Root Layout
 *
 * WHY A ROOT LAYOUT?
 * In Next.js App Router, every page is wrapped by the nearest layout.tsx.
 * This root layout applies to the entire app. It's the right place to:
 *   - Set the <html> and <body> attributes
 *   - Import global CSS (including Tailwind's base styles)
 *   - Load fonts
 *   - Mount providers (toast notifications, etc.)
 *
 * Child layouts (like the app shell) are nested inside this automatically.
 */

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BoerIT — Farm Intelligence',
  description: 'Financial and herd forecasting for South African farms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-950 text-white`}>
        {children}
        {/*
          Sonner Toast Provider
          WHY SONNER? It's the shadcn/ui recommended toast library.
          Place it once at root level — `toast()` calls anywhere in the app
          will render notifications through this single portal.
        */}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: { background: '#1c1917', border: '1px solid #292524', color: '#fff' },
          }}
        />
      </body>
    </html>
  );
}
