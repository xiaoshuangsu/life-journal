"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateMirror } from "@/lib/ai/mirror";
import { buildUserProfile } from "@/lib/ai/understanding";

/**
 * Get today's mirror, generating it if it doesn't exist yet.
 */
export async function getTodayMirror(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  // Check if already generated today
  const { data: existing } = await serviceClient
    .from("daily_mirrors")
    .select("content")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing?.content) return existing.content;

  // Welcome Mirror: if fewer than 3 entries, return static welcome
  const { count } = await serviceClient
    .from("entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) < 3) {
    const welcomeContent = `你好。

很高兴，在这里遇见你。

现在我还不太了解你，
但没关系，
我们有一生的时间。

你不需要成为谁，
也不需要证明什么，
只需要做你正在做的一切，
然后，把它写下来。

我会安静地看着，
慢慢地理解，
陪着你，走过时间。

从今天开始。`;

    // Save so we don't recompute
    await serviceClient.from("daily_mirrors").insert({
      user_id: user.id,
      date: today,
      content: welcomeContent,
    });

    return welcomeContent;
  }

  // Generate new mirror
  try {
    // Get today's entry
    const { data: todayEntries } = await serviceClient
      .from("entries")
      .select("content, created_at")
      .eq("user_id", user.id)
      .gte("entry_date", today)
      .order("created_at", { ascending: false })
      .limit(5);

    const todayContent =
      todayEntries && todayEntries.length > 0
        ? todayEntries.map((e: { content: string }) => e.content).join("\n\n")
        : null;

    // Get recent entries (past 14 days excluding today)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { data: recentEntries } = await serviceClient
      .from("entries")
      .select("content, created_at")
      .eq("user_id", user.id)
      .lt("entry_date", today)
      .gte("entry_date", twoWeeksAgo.toISOString().slice(0, 10))
      .order("created_at", { ascending: false })
      .limit(7);

    const recentContents =
      recentEntries?.map((e: { content: string }) => e.content) ?? [];

    // Get user understanding
    const { data: allEntries } = await serviceClient
      .from("entries")
      .select(
        `content, mood_score, created_at,
         analysis:analysis_results(emotion_tags, primary_emotion, summary, keywords)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const profileInput = (allEntries ?? []).map((e: Record<string, unknown>) => {
      const a = Array.isArray(e.analysis)
        ? (e.analysis as Record<string, unknown>[])[0]
        : (e.analysis as Record<string, unknown> | null);
      return {
        content: e.content as string,
        mood_score: e.mood_score as number | null,
        created_at: e.created_at as string,
        emotion_tags: a?.emotion_tags as string[] | undefined,
        keywords: a?.keywords as string[] | undefined,
        summary: a?.summary as string | undefined,
        primary_emotion: a?.primary_emotion as string | undefined,
      };
    });

    const profile =
      profileInput.length >= 3 ? buildUserProfile(profileInput) : null;

    // Generate mirror content
    const content = await generateMirror(
      todayContent,
      recentContents,
      profile
    );

    // Save to database
    await serviceClient.from("daily_mirrors").insert({
      user_id: user.id,
      date: today,
      content,
    });

    return content;
  } catch (err) {
    console.error("Mirror generation failed:", err);
    return null;
  }
}
