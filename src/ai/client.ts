/**
 * AI 客户端 — 调用 LLM 对文章进行筛选和摘要
 *
 * 使用 OpenAI SDK 兼容接口，支持 DeepSeek / OpenAI / Groq 等，
 * 通过 .env 中的 AI_BASE_URL 和 AI_MODEL 切换。
 */
import OpenAI from "openai";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { buildFilterPrompt } from "./prompts.js";
import { parseFilterResponse, type AIFilterResult } from "./parser.js";
import type { RawArticle } from "../sources/types.js";

// 初始化 OpenAI 兼容客户端，baseURL 决定实际调用哪家 API
const client = new OpenAI({
  apiKey: config.AI_API_KEY,
  baseURL: config.AI_BASE_URL,
});

/**
 * 将原始文章列表发给 AI，返回筛选后的 Top N 结果（含中文摘要和标签）
 */
export async function filterAndSummarize(
  articles: RawArticle[],
  topN: number,
): Promise<AIFilterResult[]> {
  const log = logger.child({ module: "ai-client" });

  if (articles.length === 0) {
    log.warn("No articles to filter");
    return [];
  }

  const prompt = buildFilterPrompt(articles, topN);

  log.info(
    { articleCount: articles.length, model: config.AI_MODEL },
    "Sending articles to AI for filtering",
  );

  // 调用 LLM，失败自动重试 2 次
  const response = await withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: config.AI_MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error("No text in AI response");
      }
      return text;
    },
    "ai-filter",
    { maxAttempts: 2, baseDelayMs: 5000 },
  );

  // 解析 AI 返回的 JSON，按 score 降序取 Top N
  const results = parseFilterResponse(response);
  log.info({ resultCount: results.length }, "AI filtering complete");

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
