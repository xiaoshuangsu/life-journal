import "server-only";

export type UserUnderstanding = {
  generated_at: string;
  total_entries: number;
  personality_hints: string[];
  recurring_themes: { theme: string; count: number }[];
  emotional_patterns: string[];
  life_context: string[];
};

/**
 * Build a deep user understanding profile from all journal entries.
 * This is passed to the Insights prompt so the AI knows the user better
 * with each entry they write.
 */
export function buildUserProfile(
  entries: {
    content: string;
    mood_score: number | null;
    created_at: string;
    emotion_tags?: string[] | null;
    keywords?: string[] | null;
    summary?: string | null;
    primary_emotion?: string | null;
  }[]
): UserUnderstanding {
  // Collect all emotion tags with counts
  const emotionCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  let totalMood = 0;
  let moodCount = 0;

  for (const e of entries) {
    for (const tag of e.emotion_tags ?? []) {
      emotionCounts.set(tag, (emotionCounts.get(tag) ?? 0) + 1);
    }
    for (const kw of e.keywords ?? []) {
      keywordCounts.set(kw, (keywordCounts.get(kw) ?? 0) + 1);
    }
    if (e.mood_score != null) {
      totalMood += e.mood_score;
      moodCount++;
    }
  }

  // Recurring themes: keywords appearing 2+ times
  const recurring_themes = [...keywordCounts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, count }));

  // Personality hints from dominant emotions
  const topEmotions = [...emotionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const personality_hints: string[] = [];
  const emotional_patterns: string[] = [];
  const avgMood = moodCount > 0 ? totalMood / moodCount : 0;

  // Derive patterns from emotion history
  const anxiousCount = emotionCounts.get("anxious") ?? 0;
  const stressedCount = emotionCounts.get("stressed") ?? 0;
  const gratefulCount = emotionCounts.get("grateful") ?? 0;
  const hopefulCount = emotionCounts.get("hopeful") ?? 0;
  const reflectiveCount = emotionCounts.get("reflective") ?? 0;
  const motivatedCount = emotionCounts.get("motivated") ?? 0;

  if (gratefulCount >= 2) {
    personality_hints.push("tends to find gratitude even in difficult moments");
  }
  if (reflectiveCount >= 2) {
    personality_hints.push("highly self-reflective, often examining inner experiences");
  }
  if (motivatedCount >= 2) {
    personality_hints.push("goal-oriented, driven by purpose and growth");
  }
  if (anxiousCount + stressedCount >= 3) {
    personality_hints.push("prone to stress and anxiety, especially around key responsibilities");
    emotional_patterns.push("stress and anxiety appear frequently, suggesting a high-pressure life context");
  }
  if (hopefulCount >= 2 && anxiousCount >= 2) {
    emotional_patterns.push("balances anxiety with hope — resilient under pressure");
  }

  if (avgMood < -0.1) {
    emotional_patterns.push(
      "overall emotional baseline leans slightly negative — may benefit from identifying consistent mood-lifters"
    );
  } else if (avgMood > 0.2) {
    emotional_patterns.push(
      "generally maintains a positive emotional baseline despite challenges"
    );
  }

  if (topEmotions.length >= 2) {
    const names = topEmotions.map(([t]) => t).join(" and ");
    emotional_patterns.push(`dominant emotions revolve around ${names}`);
  }

  // Life context: themes appearing 4+ times
  const life_context = [...keywordCounts.entries()]
    .filter(([, c]) => c >= 4)
    .map(([kw, count]) => `frequently mentions "${kw}" (${count} times)`);

  // Entries over time pattern
  if (entries.length >= 5) {
    const dates = entries.map((e) => e.created_at.slice(0, 10));
    const uniqueDays = new Set(dates).size;
    if (uniqueDays >= 5) {
      emotional_patterns.push(`consistent journaler — ${uniqueDays} days with entries across ${entries.length} journals`);
    }
  }

  return {
    generated_at: new Date().toISOString(),
    total_entries: entries.length,
    personality_hints,
    recurring_themes,
    emotional_patterns,
    life_context,
  };
}
