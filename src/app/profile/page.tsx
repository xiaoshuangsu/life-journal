import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-[720px] mx-auto space-y-8 py-4">
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
        Profile
      </h1>

      <div className="rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 space-y-4">
        <div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
            Email
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {user.email}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 space-y-3">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
          Account
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
