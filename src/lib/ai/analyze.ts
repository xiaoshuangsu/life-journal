import "server-only";

type AnalysisResult = {
  emotion_tags: string[];
  primary_emotion: string;
  mood_score: number;
  summary: string;
  keywords: string[];
  topics: string[];
  life_themes: string[];
};

const SYSTEM_PROMPT = `You are an emotional analysis AI for a personal journaling app.
Given a diary entry, analyze the user's emotional state and return ONLY valid JSON.

Your response MUST be exactly this JSON structure with no additional text:
{
  "emotion_tags": ["tag1", "tag2", "tag3"],
  "primary_emotion": "main emotion",
  "mood_score": 0.0,
  "summary": "one sentence summarizing the emotional content",
  "keywords": ["entity1", "entity2"],
  "topics": ["topic1", "topic2"],
  "life_themes": ["theme1", "theme2"]
}

Rules for each field:

- emotion_tags: 2-4 tags from [happy, excited, calm, anxious, sad, tired, angry, grateful, hopeful, frustrated, lonely, proud, confused, peaceful, nostalgic, stressed, motivated, content, overwhelmed, reflective]
- primary_emotion: the single most dominant emotion
- mood_score: float from -1.0 (very negative) to 1.0 (very positive)
- summary: one concise sentence in the same language as the entry, describing the emotional state

- keywords: 2-5 specific entities, people, activities, or events explicitly mentioned in the entry. NO abstraction. Examples: ["妹妹","住院","纸质书","AI项目"]
  Purpose: internal system search & filtering. NOT shown to users.

- topics: 3-6 objective theme categories this entry discusses. Suitable as classification labels. Examples: ["家庭","健康","工作","阅读","自由"]
  Purpose: statistical analysis & reports. NOT shown to users.

- life_themes: 3-5 subjective life themes behind this entry. These are what the user is truly EXPERIENCING, not just what they are DOING.
  Purpose: shown to the user as "今日主题".
  Rules for life_themes:
    - Each theme MUST be 2-6 Chinese characters, concise and powerful.
    - Focus on: values, inner conflicts, growth directions, deep needs.
    - Do NOT repeat topics. Transform objective labels into subjective experiences.
    - Bad: "健康" (topic) → Good: "家庭陪伴" (life theme, when visiting sick family)
    - Bad: "阅读" (topic) → Good: "精神休息" (life theme, when reading to rest)
    - Bad: "副业" (topic) → Good: "财富焦虑" (life theme, when worried about income)
    - Bad: "工作" (topic) → Good: "时间自由" (life theme, when valuing autonomy)
    - A life theme should make the user feel: "Yes, this is what I truly care about today."`;

/**
 * Analyze a diary entry via DeepSeek API.
 * Returns structured emotion tags, mood score, summary, and keywords.
 */
export async function analyzeEntry(
  content: string
): Promise<AnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

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
        { role: "user", content },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    console.error("Unexpected DeepSeek response:", JSON.stringify(data));
    throw new Error("Empty response from DeepSeek");
  }

  try {
    const result = JSON.parse(text) as AnalysisResult;
    // Validate required fields
    if (
      !Array.isArray(result.emotion_tags) ||
      !result.primary_emotion ||
      typeof result.mood_score !== "number" ||
      !result.summary
    ) {
      throw new Error("Invalid analysis result structure");
    }
    // Ensure new fields exist (default to empty if missing from older model output)
    if (!Array.isArray(result.keywords)) result.keywords = [];
    if (!Array.isArray(result.topics)) result.topics = [];
    if (!Array.isArray(result.life_themes)) result.life_themes = [];
    return result;
  } catch (err) {
    console.error("Failed to parse DeepSeek response:", text);
    throw err;
  }
}
