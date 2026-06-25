"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { analyzeEntry } from "@/lib/ai/analyze";
import { generateInsights } from "@/lib/ai/insights";
import { buildUserProfile } from "@/lib/ai/understanding";

export type Entry = {
  id: string;
  content: string;
  word_count: number;
  mood_score: number | null;
  status: "pending" | "analyzed" | "error";
  created_at: string;
  entry_date: string;
  // Joined analysis result (if analyzed).
  // Supabase returns 1:1 joins as a single object {} with service_role,
  // or as an array [{}] with anon key. We handle both.
  analysis?:
    | {
        emotion_tags: string[];
        primary_emotion: string | null;
        summary: string | null;
        keywords?: string[] | null;
        topics?: string[] | null;
        life_themes?: string[] | null;
        insights?: {
          seen: string;
          observation: string;
          hidden_pattern: string;
          growth_mirror: string;
          looking_ahead: string;
        } | null;
      }
    | {
        emotion_tags: string[];
        primary_emotion: string | null;
        summary: string | null;
        keywords?: string[] | null;
        topics?: string[] | null;
        life_themes?: string[] | null;
        insights?: {
          seen: string;
          observation: string;
          hidden_pattern: string;
          growth_mirror: string;
          looking_ahead: string;
        } | null;
      }[]
    | null;
};

/**
 * Create a new diary entry, then analyze it with AI.
 * Returns the entry WITH analysis data so the UI can show tags immediately.
 * Also re-processes any stale pending entries on each save.
 */
export async function createEntry(content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const serviceClient = createServiceClient();

  // 1. Save entry with pending status
  const { data: entry, error } = await serviceClient
    .from("entries")
    .insert({ user_id: user.id, content })
    .select("id, content, word_count, status, created_at, entry_date")
    .single();

  if (error) throw new Error(error.message);

  // 2. Run AI analysis (3-5s)
  try {
    const analysis = await analyzeEntry(content);

    // 3. Write analysis results
    await serviceClient.from("analysis_results").insert({
      entry_id: entry.id,
      user_id: user.id,
      emotion_tags: analysis.emotion_tags,
      primary_emotion: analysis.primary_emotion,
      mood_score: analysis.mood_score,
      summary: analysis.summary,
      keywords: analysis.keywords,
      topics: analysis.topics,
      life_themes: analysis.life_themes,
    });

    // 4. Update entry status
    await serviceClient
      .from("entries")
      .update({ status: "analyzed", mood_score: analysis.mood_score })
      .eq("id", entry.id);

    // 5. Fetch the full entry WITH analysis join (separate query, not nested in update)
    const { data: fullEntry } = await serviceClient
      .from("entries")
      .select(
        `id, content, word_count, mood_score, status, created_at, entry_date,
         analysis:analysis_results(emotion_tags, primary_emotion, summary, keywords, topics, life_themes, insights)`
      )
      .eq("id", entry.id)
      .single();

    revalidatePath("/dashboard");
    return (fullEntry ?? { ...entry, analysis: null }) as Entry;
  } catch (err) {
    console.error("Entry analysis failed:", err);
    await serviceClient
      .from("entries")
      .update({ status: "error" })
      .eq("id", entry.id);

    revalidatePath("/dashboard");
    return { ...entry, status: "error" } as Entry;
  }
}

/**
 * Fetch all entries for the current user, newest first.
 * Includes joined analysis results when available.
 */
export async function getEntries(): Promise<Entry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("entries")
    .select(
      `
      id, content, word_count, mood_score, status, created_at, entry_date,
      analysis:analysis_results(emotion_tags, primary_emotion, summary, keywords, topics, life_themes, insights)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch entries:", error.message);
    return [];
  }

  return (data ?? []) as Entry[];
}

/**
 * Update an entry's content. Re-triggers AI analysis if content changed.
 */
export async function updateEntry(entryId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const serviceClient = createServiceClient();

  // Update content
  const { error } = await serviceClient
    .from("entries")
    .update({ content })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // Delete old analysis + re-analyze
  await serviceClient
    .from("analysis_results")
    .delete()
    .eq("entry_id", entryId);

  try {
    const analysis = await analyzeEntry(content);
    await serviceClient.from("analysis_results").insert({
      entry_id: entryId,
      user_id: user.id,
      emotion_tags: analysis.emotion_tags,
      primary_emotion: analysis.primary_emotion,
      mood_score: analysis.mood_score,
      summary: analysis.summary,
      keywords: analysis.keywords,
      topics: analysis.topics,
      life_themes: analysis.life_themes,
    });
    await serviceClient
      .from("entries")
      .update({ status: "analyzed", mood_score: analysis.mood_score })
      .eq("id", entryId);
  } catch (err) {
    console.error("Re-analysis failed:", err);
    await serviceClient
      .from("entries")
      .update({ status: "error" })
      .eq("id", entryId);
  }

  // Fetch the full updated entry
  const { data: fullEntry } = await serviceClient
    .from("entries")
    .select(
      `id, content, word_count, mood_score, status, created_at, entry_date,
       analysis:analysis_results(emotion_tags, primary_emotion, summary, keywords, topics, life_themes, insights)`
    )
    .eq("id", entryId)
    .single();

  revalidatePath("/dashboard");
  return (fullEntry ?? null) as Entry | null;
}

/**
 * Generate deep AI insights for an entry (on-demand, not automatic).
 * Stores result in analysis_results.insights (JSONB).
 */
export async function generateEntryInsights(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const serviceClient = createServiceClient();

  // Fetch the entry content
  const { data: entry } = await serviceClient
    .from("entries")
    .select("content")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) throw new Error("Entry not found");

  // Fetch ALL user entries to build deep profile
  const { data: allEntries } = await serviceClient
    .from("entries")
    .select(
      `content, mood_score, created_at,
       analysis:analysis_results(emotion_tags, primary_emotion, summary, keywords)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Build user understanding profile
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

  const profile = buildUserProfile(profileInput);

  // Save profile to profiles table
  await serviceClient
    .from("profiles")
    .upsert({ id: user.id, deep_understanding: profile });

  // Generate insights via DeepSeek with profile context
  const insights = await generateInsights(entry.content, profile);

  // Upsert into analysis_results
  const { data: existing } = await serviceClient
    .from("analysis_results")
    .select("id")
    .eq("entry_id", entryId)
    .single();

  if (existing) {
    await serviceClient
      .from("analysis_results")
      .update({ insights })
      .eq("entry_id", entryId);
  } else {
    await serviceClient.from("analysis_results").insert({
      entry_id: entryId,
      user_id: user.id,
      insights,
    });
  }

  // Fetch full entry with updated analysis
  const { data: fullEntry } = await serviceClient
    .from("entries")
    .select(
      `id, content, word_count, mood_score, status, created_at, entry_date,
       analysis:analysis_results(emotion_tags, primary_emotion, summary, keywords, topics, life_themes, insights)`
    )
    .eq("id", entryId)
    .single();

  revalidatePath("/dashboard");
  return (fullEntry ?? null) as Entry | null;
}

/**
 * Delete an entry by ID — verifies auth then uses service_role.
 */
export async function deleteEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
