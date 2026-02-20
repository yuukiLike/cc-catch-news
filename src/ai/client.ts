import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { buildFilterPrompt } from "./prompts.js";
import { parseFilterResponse, type AIFilterResult } from "./parser.js";
import type { RawArticle } from "../sources/types.js";

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

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
    "Sending articles to Claude for filtering",
  );

  const response = await withRetry(
    async () => {
      const msg = await client.messages.create({
        model: config.AI_MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = msg.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text in Claude response");
      }
      return textBlock.text;
    },
    "claude-filter",
    { maxAttempts: 2, baseDelayMs: 5000 },
  );

  const results = parseFilterResponse(response);
  log.info({ resultCount: results.length }, "Claude filtering complete");

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
