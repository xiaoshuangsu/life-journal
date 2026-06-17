import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy — minimal pass-through for MVP.
 * Auth checks happen in page components, not here.
 *
 * Why not session refresh here? In Next.js 16, proxy cookies
 * and Server Action cookies can conflict, causing auth failures.
 * Instead, the Supabase SSR client in Server Components handles
 * session refresh naturally via `getUser()`.
 */
export default function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
