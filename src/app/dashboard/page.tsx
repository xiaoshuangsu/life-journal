import { redirect } from "next/navigation";
import { getEntries } from "@/lib/entries/actions";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./shell";
import DashboardContent from "./content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth guard: redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  const entries = await getEntries();

  return (
    <DashboardShell userEmail={user.email}>
      <DashboardContent initialEntries={entries} />
    </DashboardShell>
  );
}
