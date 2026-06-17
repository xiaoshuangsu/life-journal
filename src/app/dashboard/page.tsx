import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./shell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell userEmail={user.email}>
      <div className="py-24 text-center">
        <h2 className="text-3xl font-bold text-white">
          Welcome{user.email ? `, ${user.email.split("@")[0]}` : ""}
        </h2>
        <p className="mt-2 text-zinc-400">
          Dashboard is loading...
        </p>
      </div>
    </DashboardShell>
  );
}
