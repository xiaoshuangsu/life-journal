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

  if (!user) {
    redirect("/login");
  }

  let entries: Awaited<ReturnType<typeof getEntries>> = [];
  try {
    entries = await getEntries();
  } catch (err) {
    console.error("getEntries failed:", err);
  }

  return (
    <DashboardShell userEmail={user.email}>
      <DashboardContent initialEntries={entries} />
    </DashboardShell>
  );
}
