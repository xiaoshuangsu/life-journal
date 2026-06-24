import "server-only";

export type UserUnderstanding = {
  generated_at: string;
  total_entries: number;
  personality_hints: string[];
  recurring_themes: { theme: string; count: number }[];
  emotional_patterns: string[];
  life_context: string[];
  core_values: string[];
  recurring_conflicts: string[];
  growth_history: string[];
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

  // Core values: inferred from dominant positive emotions and relational keywords
  const core_values: string[] = [];
  const familyKw = keywordCounts.get("家人") ?? keywordCounts.get("family") ?? 0;
  const workKw = keywordCounts.get("工作") ?? keywordCounts.get("work") ?? 0;
  const healthKw = keywordCounts.get("健康") ?? keywordCounts.get("health") ?? 0;
  const growthKw = keywordCounts.get("成长") ?? keywordCounts.get("项目") ?? 0;

  if (familyKw >= 2) core_values.push("重视亲情与连接");
  if (gratefulCount >= 2) core_values.push("在困境中仍能捕捉感恩的时刻");
  if (workKw >= 3) core_values.push("对事业有深层的投入与责任感");
  if (healthKw >= 2) core_values.push("将健康视为重要的生活基石");
  if (growthKw >= 2) core_values.push("渴望持续的自我进化与成长");
  if (reflectiveCount >= 3) core_values.push("以内省作为理解世界的核心方式");
  if (core_values.length === 0) {
    core_values.push("正在探索什么对自己真正重要");
  }

  // Recurring conflicts: tensions visible in the data
  const recurring_conflicts: string[] = [];
  if (workKw >= 3 && stressedCount >= 3) {
    recurring_conflicts.push("工作投入与身心疲惫之间的拉扯");
  }
  if (familyKw >= 2 && anxiousCount >= 2) {
    recurring_conflicts.push("对家人的深切关心伴随着无法掌控的焦虑感");
  }
  if (motivatedCount >= 2 && anxiousCount >= 2) {
    recurring_conflicts.push("对成长的渴望与对自我要求过高之间的张力");
  }
  if (gratefulCount >= 2 && stressedCount >= 2) {
    recurring_conflicts.push("在感恩与压力之间反复摇摆——能看见美好，却也被现实消耗");
  }
  if (recurring_conflicts.length === 0 && entries.length >= 3) {
    recurring_conflicts.push("正在逐渐厘清自己内心的矛盾所在");
  }

  // Growth history: track mood improvement over time
  const growth_history: string[] = [];
  if (entries.length >= 3) {
    const recent = entries.slice(-3);
    const older = entries.slice(0, Math.min(3, entries.length - 3));
    const recentAvg = recent.reduce((s, e) => s + (e.mood_score ?? 0), 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((s, e) => s + (e.mood_score ?? 0), 0) / older.length
      : recentAvg;
    if (recentAvg > olderAvg + 0.1) {
      growth_history.push("近期情绪基线较之前有所提升，整体在向更明亮的方向移动");
    }
    if (reflectiveCount >= 3) {
      growth_history.push("持续保持自我反思的习惯，这是内在成长的核心驱动力");
    }
    if (entries.length >= 5) {
      growth_history.push(`坚持书写了 ${entries.length} 篇日记——这本身就是一种对自己生命负责的笃定行动`);
    }
  }
  if (growth_history.length === 0) {
    growth_history.push("成长正在悄然发生，未来的日记将会见证");
  }

  return {
    generated_at: new Date().toISOString(),
    total_entries: entries.length,
    personality_hints,
    recurring_themes,
    emotional_patterns,
    life_context,
    core_values,
    recurring_conflicts,
    growth_history,
  };
}
