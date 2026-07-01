import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntries } from "@/lib/entries/actions";
import { getTodayMirror } from "@/lib/mirrors/actions";
import HomeContent from "./content";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getEntries();
  let mirror: string | null = null;
  try {
    mirror = await getTodayMirror();
  } catch (err) {
    console.error("Mirror fetch failed:", err);
  }

  return (
    <HomeContent
      userEmail={user.email}
      initialEntries={entries}
      initialMirror={mirror}
    />
  );
}
