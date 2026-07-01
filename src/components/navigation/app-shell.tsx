"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { logout } from "@/lib/auth/actions";
import BottomNav from "./bottom-nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const isAuthPage =
    pathname === "/login" || pathname === "/signup" || pathname === "/";

  // Auth pages: no shell
  if (isAuthPage) return <>{children}</>;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-transparent dark:border-white/5 bg-white/60 dark:bg-transparent backdrop-blur-md transition-colors duration-500">
        <div className="mx-auto flex h-12 md:h-14 max-w-3xl items-center justify-between px-4 md:px-8">
          <span className="text-[15px] font-semibold text-zinc-800 dark:text-white tracking-tight">
            Life Journal
          </span>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              className="rounded-full p-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 md:px-8 py-4 md:py-6 pb-20 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation (Mobile only) */}
      <BottomNav />

      {/* Desktop: top tabs */}
      <div className="hidden md:block" />
    </>
  );
}
