"use client";

import { useTheme } from "@/components/theme-provider";
import { logout } from "@/lib/auth/actions";

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Top nav bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/80 backdrop-blur transition-colors duration-500">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="font-semibold text-zinc-800 dark:text-white tracking-tight">
            Life Journal
          </span>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="rounded-full p-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {userEmail && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {userEmail}
              </span>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
