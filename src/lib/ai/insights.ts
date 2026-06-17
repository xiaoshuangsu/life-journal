import "server-only";
import type { UserUnderstanding } from "./understanding";

export type InsightsResult = {
  observation: string;
  reflection: string;
  future: string;
};

function buildSystemPrompt(profile: UserUnderstanding | null): string {
  let base = `You are an empathetic life coach AI. A user has shared a personal journal entry.
Analyze it deeply and return ONLY valid JSON with this structure:

{
  "observation": "...",
  "reflection": "...",
  "future": "..."
}

General rules:
- observation: A key observation about the user's emotional state, patterns, or triggers in this entry. Be specific and insightful. 2-3 sentences.
- reflection: A gentle reflection that helps the user see this experience from a growth perspective. What might this reveal about their values, needs, or inner world? 2-3 sentences.
- future: A forward-looking perspective or gentle nudge. What can the user take from this experience moving forward? 2-3 sentences.
- Write in the same language as the diary entry.
- Be warm, specific, and authentic — not generic. Reference details from the entry.
- Never give medical or clinical advice. Stay in the domain of emotional reflection and personal growth.
- Keep each section concise (2-3 sentences each).`;

  if (profile && profile.total_entries >= 3) {
    base += `\n\nIMPORTANT — You have a deep understanding of this user built from ${profile.total_entries} journal entries. Use this to make your insights more personal and specific:\n`;

    if (profile.personality_hints.length > 0) {
      base += `\nPersonality traits observed: ${profile.personality_hints.join("; ")}.`;
    }

    if (profile.recurring_themes.length > 0) {
      const themes = profile.recurring_themes
        .map((t) => `"${t.theme}" (${t.count}x)`)
        .join(", ");
      base += `\nRecurring life themes: ${themes}.`;
    }

    if (profile.emotional_patterns.length > 0) {
      base += `\nEmotional patterns across all entries: ${profile.emotional_patterns.join(". ")}.`;
    }

    if (profile.life_context.length > 0) {
      base += `\nLife context: ${profile.life_context.join("; ")}.`;
    }

    base += `\n\nWhen writing your insights, connect this entry to the user's broader patterns. For example, if they've mentioned similar struggles before, acknowledge that. If this entry represents growth from a past pattern, call that out. Make the user feel truly known and understood.`;
  } else if (profile) {
    base += `\n\nThis user has written ${profile.total_entries} entries so far. As they write more, your understanding will deepen. For now, focus on this entry alone.`;
  }

  return base;
}

export async function generateInsights(
  content: string,
  profile: UserUnderstanding | null = null
): Promise<InsightsResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const systemPrompt = buildSystemPrompt(profile);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: 0.5,
      max_tokens: 700,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error("Empty response from DeepSeek");

  const result = JSON.parse(text) as InsightsResult;
  if (!result.observation || !result.reflection || !result.future) {
    throw new Error("Invalid insights result structure");
  }

  return result;
}
