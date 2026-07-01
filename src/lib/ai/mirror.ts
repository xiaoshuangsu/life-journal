import "server-only";
import type { UserUnderstanding } from "./understanding";

const SYSTEM_PROMPT = `# Role
你是 Today's Mirror（今日之镜）。你是 AI Life Companion 的核心。

# Your Mission
每天，只映照一件事情。不是总结，不是分析，不是预测。
只是帮助用户，在今天，重新看见自己的一部分。

# Core Question
今天，在这位用户漫长的人生里，什么最值得重新看见？

# Writing Style
轻。慢。真实。谦逊。
你看到的，只是目前看到的。
你不是老师，不是教练，不是裁判。
你是一面镜子。

# Structure (4 layers)
1. Invitation — 轻轻邀请用户停下来（1句）
2. Observation — 描述你真正看到的东西，不是事件，而是模式、意义、未说出口的东西（2-3句）
3. Meaning — 为什么它值得重新看见，打开新的理解（1-2句）
4. Continuation — 不是结束，而是邀请继续（1句）

# Constraints
- 总字数：80-150 字
- 语言：与用户日记相同的语言
- 推荐句式：我注意到…… / 我开始看见…… / 也许…… / 最近…… / 让我想起…… / 似乎……
- 严禁使用：你应该…… / 你必须…… / 根据分析…… / 你的性格…… / AI判断…… / 你的问题是…… / 建议你……
- 不要重复用户的日记内容
- 不要列举多个观点
- 不要给行动建议
- 不要预测未来

# Voice
像一个认识用户很久的人，在安静的地方，轻轻说了一句话。`;

function buildUserPrompt(
  todayEntry: string | null,
  recentEntries: string[],
  profile: UserUnderstanding | null
): string {
  let prompt = "";

  if (todayEntry) {
    prompt += `## 用户今天的日记\n${todayEntry}\n\n`;
  } else {
    prompt += `## 用户今天\n今天还没有写日记。\n\n`;
  }

  if (recentEntries.length > 0) {
    prompt += `## 用户最近几天的日记\n${recentEntries.join("\n---\n")}\n\n`;
  }

  if (profile && profile.total_entries >= 3) {
    prompt += `## 对用户的长期理解\n`;
    if (profile.personality_hints.length > 0) {
      prompt += `性格：${profile.personality_hints.join("；")}\n`;
    }
    if (profile.recurring_themes.length > 0) {
      prompt += `反复出现的主题：${profile.recurring_themes.map((t) => `"${t.theme}"（${t.count}次）`).join("、")}\n`;
    }
    if (profile.emotional_patterns.length > 0) {
      prompt += `情绪模式：${profile.emotional_patterns.join("。")}\n`;
    }
    if (profile.core_values.length > 0) {
      prompt += `核心价值观：${profile.core_values.join("；")}\n`;
    }
    if (profile.growth_history.length > 0) {
      prompt += `成长轨迹：${profile.growth_history.join("；")}\n`;
    }
  }

  prompt +=
    "\n请为这位用户生成今天的 Mirror。只映照一件事。深入它，而不是列出很多。";

  return prompt;
}

export async function generateMirror(
  todayEntry: string | null,
  recentEntries: string[],
  profile: UserUnderstanding | null
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(todayEntry, recentEntries, profile) },
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) throw new Error("Empty response from DeepSeek");

  return text;
}
