import "server-only";

type AnalysisResult = {
  emotion_tags: string[];
  primary_emotion: string;
  mood_score: number;
  summary: string;
  keywords: string[];
};

const SYSTEM_PROMPT = `You are an emotional analysis AI for a personal journaling app.
Given a diary entry, analyze the user's emotional state and return ONLY valid JSON.

Your response MUST be exactly this JSON structure with no additional text:
{
  "emotion_tags": ["tag1", "tag2", "tag3"],
  "primary_emotion": "main emotion",
  "mood_score": 0.0,
  "summary": "one sentence summarizing the emotional content",
  "keywords": ["entity1", "entity2"]
}

Rules:
- emotion_tags: 2-4 tags from [happy, excited, calm, anxious, sad, tired, angry, grateful, hopeful, frustrated, lonely, proud, confused, peaceful, nostalgic, stressed, motivated, content, overwhelmed, reflective]
- primary_emotion: the single most dominant emotion
- mood_score: float from -1.0 (very negative) to 1.0 (very positive)
- summary: one concise sentence in the same language as the entry, describing the emotional state
- keywords: 2-5 key entities/activities/people mentioned (e.g., work, family, exercise, project)`;

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
    return result;
  } catch (err) {
    console.error("Failed to parse DeepSeek response:", text);
    throw err;
  }
}
