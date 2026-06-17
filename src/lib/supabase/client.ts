"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — use in Client Components only.
 * Reads session from cookies automatically,
 * persists new sessions to cookies via localStorage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
