import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntries } from "@/lib/entries/actions";
import JournalContent from "./content";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getEntries();

  return <JournalContent initialEntries={entries} />;
}
