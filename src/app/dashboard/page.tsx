import { redirect } from "next/navigation";
import { getEntries } from "@/lib/entries/actions";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./shell";
import DashboardContent from "./content";

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    let entries: Awaited<ReturnType<typeof getEntries>> = [];
    try {
      entries = await getEntries();
    } catch (entryErr) {
      console.error("getEntries failed:", entryErr);
    }

    return (
      <DashboardShell userEmail={user.email}>
        <DashboardContent initialEntries={entries} />
      </DashboardShell>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Dashboard fatal:", message);
    return <ErrorDisplay message={message} />;
  }
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <h1 className="text-xl font-semibold text-red-400 mb-2">
        Dashboard Error
      </h1>
      <p className="text-sm text-zinc-400 max-w-md break-all mb-4">
        {message}
      </p>
      <div className="flex gap-3">
        <a
          href="/login"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Login
        </a>
        <a
          href="/"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
        >
          Home
        </a>
      </div>
    </div>
  );
}
