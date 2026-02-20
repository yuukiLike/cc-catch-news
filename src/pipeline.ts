import { enabledSources } from "./sources/index.js";
import { enabledOutputs } from "./outputs/index.js";
import { filterAndSummarize } from "./ai/client.js";
import { hashUrl } from "./utils/url.js";
import { logger } from "./utils/logger.js";
import { config } from "./config.js";
import { createRun, finishRun, upsertArticles, insertDigestItems } from "./db/queries.js";
import type { RawArticle } from "./sources/types.js";
import type { DigestItem, FormattedDigest } from "./outputs/types.js";

export async function runPipeline(): Promise<void> {
  const log = logger.child({ module: "pipeline" });
  const startedAt = new Date();

  const sources = enabledSources();
  const outputs = enabledOutputs();

  log.info(
    {
      sources: sources.map((s) => s.name),
      outputs: outputs.map((o) => o.name),
    },
    "Pipeline started",
  );

  if (sources.length === 0) {
    log.error("No enabled sources — aborting");
    return;
  }
  if (outputs.length === 0) {
    log.error("No enabled outputs — aborting");
    return;
  }

  // Create run record (if DB is available)
  const run = await createRun(
    sources.map((s) => s.name),
    outputs.map((o) => o.name),
  );

  try {
    // Step 1: Fetch from all sources
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allArticles: RawArticle[] = [];

    for (const source of sources) {
      try {
        log.info({ source: source.name }, "Fetching from source");
        const articles = await source.fetch(since);
        allArticles.push(...articles);
        log.info({ source: source.name, count: articles.length }, "Source fetch complete");
      } catch (error) {
        log.error({ error, source: source.name }, "Source fetch failed");
      }
    }

    if (allArticles.length === 0) {
      log.warn("No articles fetched from any source");
      if (run) await finishRun(run.id, "empty", 0, 0);
      return;
    }

    // Step 2: Deduplicate by URL hash
    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter((a) => {
      const hash = hashUrl(a.url);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
    log.info(
      { before: allArticles.length, after: uniqueArticles.length },
      "Deduplication complete",
    );

    // Step 3: Persist articles to DB (if available)
    const urlToArticleId = await upsertArticles(uniqueArticles);

    // Step 4: AI filtering and summarization
    const aiResults = await filterAndSummarize(uniqueArticles, config.TOP_N);

    if (aiResults.length === 0) {
      log.warn("AI returned no results");
      if (run) await finishRun(run.id, "no_results", uniqueArticles.length, 0);
      return;
    }

    // Step 5: Build digest
    const digestItems: DigestItem[] = aiResults.map((result, idx) => {
      const article = uniqueArticles[result.index - 1];
      return {
        rank: idx + 1,
        title: article?.title ?? result.title,
        url: article?.url ?? "",
        score: result.score,
        summary: result.summary,
        tags: result.tags,
        sourceName: article?.sourceName ?? "unknown",
      };
    });

    const digest: FormattedDigest = {
      generatedAt: startedAt,
      items: digestItems,
    };

    // Step 6: Persist digest items (if DB available)
    if (run) {
      await insertDigestItems(run.id, digestItems, urlToArticleId);
    }

    // Step 7: Send to all output plugins
    for (const output of outputs) {
      try {
        log.info({ output: output.name }, "Sending digest to output");
        await output.send(digest);
      } catch (error) {
        log.error({ error, output: output.name }, "Output send failed");
      }
    }

    const elapsed = Date.now() - startedAt.getTime();
    log.info(
      {
        elapsed,
        articles: uniqueArticles.length,
        digestItems: digestItems.length,
      },
      "Pipeline completed successfully",
    );

    if (run) {
      await finishRun(run.id, "success", uniqueArticles.length, digestItems.length);
    }
  } catch (error) {
    log.error({ error }, "Pipeline failed");
    if (run) {
      await finishRun(run.id, "error", 0, 0, String(error));
    }
    throw error;
  }
}
