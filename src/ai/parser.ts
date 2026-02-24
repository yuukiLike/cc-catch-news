/**
 * AI 响应解析器
 *
 * AI 可能返回 ```json ... ``` 包裹的 JSON，也可能直接返回裸 JSON。
 * 这里统一提取并做容错解析。
 */
import { logger } from "../utils/logger.js";

export interface AIFilterResult {
  index: number;   // 对应 prompt 中文章的编号（1-based）
  title: string;
  score: number;   // AI 打的相关性评分 1-10
  summary: string; // 中文摘要
  tags: string[];  // 标签，如 ["LLM", "开源"]
}

export function parseFilterResponse(text: string): AIFilterResult[] {
  const log = logger.child({ module: "ai-parser" });

  // 尝试从 markdown code block 中提取 JSON
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

    // 逐字段做类型转换，防止 AI 返回非预期类型
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
