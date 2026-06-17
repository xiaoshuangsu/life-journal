import { redirect } from "next/navigation";
import { getEntries } from "@/lib/entries/actions";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./shell";
import DashboardContent from "./content";

export default async function DashboardPage() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const entries = await getEntries();

    return (
      <DashboardShell userEmail={user.email}>
        <DashboardContent initialEntries={entries} />
      </DashboardShell>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Dashboard error:", message);

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-zinc-400 mb-4">
            {message || "Unable to load dashboard. Please try again."}
          </p>
          <a
            href="/login"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }
}
