import { logger } from "../utils/logger.js";

export interface AIFilterResult {
  index: number;
  title: string;
  score: number;
  summary: string;
  tags: string[];
}

export function parseFilterResponse(text: string): AIFilterResult[] {
  const log = logger.child({ module: "ai-parser" });

  // Extract JSON from markdown code block or raw text
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      log.error("AI response is not an array");
      return [];
    }

    return parsed.map((item: Record<string, unknown>) => ({
      index: Number(item.index),
      title: String(item.title || ""),
      score: Number(item.score || 0),
      summary: String(item.summary || ""),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    }));
  } catch (error) {
    log.error({ error, text: text.slice(0, 500) }, "Failed to parse AI response");
    return [];
  }
}
