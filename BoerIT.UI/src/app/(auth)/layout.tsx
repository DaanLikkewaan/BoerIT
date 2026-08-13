/**
 * app/(auth)/layout.tsx
 *
 * WHY ROUTE GROUPS ( )?
 * Wrapping a folder name in parentheses creates a "route group". The folder
 * name is invisible in the URL — /app/(auth)/login/page.tsx maps to /login,
 * not /auth/login. This lets you apply different layouts to different sections
 * of the app without affecting the URL structure.
 *
 * (auth) pages — login, register — get this centered, no-sidebar layout.
 * (app) pages — dashboard, farms — get the sidebar shell layout.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 border-r border-stone-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-stone-950" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">BoerIT</span>
        </div>

        <div>
          <blockquote className="text-stone-300 text-2xl font-light leading-relaxed mb-6">
            "Plan with confidence.<br />
            Farm with intelligence."
          </blockquote>
          <p className="text-stone-500 text-sm">
            Financial and herd forecasting for South African farms — built for the realities of the land.
          </p>
        </div>

        <div className="flex gap-8 text-stone-500 text-sm">
          <div>
            <p className="text-white text-2xl font-semibold">10yr</p>
            <p>forecast horizon</p>
          </div>
          <div>
            <p className="text-white text-2xl font-semibold">2</p>
            <p>livestock species</p>
          </div>
          <div>
            <p className="text-white text-2xl font-semibold">∞</p>
            <p>farm profiles</p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
