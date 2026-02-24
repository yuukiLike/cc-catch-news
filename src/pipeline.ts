/**
 * 核心 Pipeline — 整个应用的主流程
 *
 * 流程：抓取 → 去重 → (存 DB) → AI 筛选 → 构建摘要 → (存 DB) → 推送
 *
 * 设计原则：
 * - 数据库可选：没有 DATABASE_URL 时跳过所有 DB 操作，pipeline 照样跑
 * - 源/输出可插拔：只要实现接口并注册，就能扩展新的数据源或推送渠道
 * - 容错降级：单个源或输出失败不影响其他步骤
 */
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

  // 记录本次运行（如果有 DB）
  const run = await createRun(
    sources.map((s) => s.name),
    outputs.map((o) => o.name),
  );

  try {
    // ── Step 1: 从所有数据源抓取，时间窗口 = 最近 24 小时 ──
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
        // 单个源失败不中断，继续下一个
      }
    }

    if (allArticles.length === 0) {
      log.warn("No articles fetched from any source");
      if (run) await finishRun(run.id, "empty", 0, 0);
      return;
    }

    // ── Step 2: URL hash 去重 ──
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

    // ── Step 3: 持久化原始文章到 DB（可选） ──
    const urlToArticleId = await upsertArticles(uniqueArticles);

    // ── Step 4: AI 筛选 + 中文摘要生成 ──
    const aiResults = await filterAndSummarize(uniqueArticles, config.TOP_N);

    if (aiResults.length === 0) {
      log.warn("AI returned no results");
      if (run) await finishRun(run.id, "no_results", uniqueArticles.length, 0);
      return;
    }

    // ── Step 5: 组装摘要列表 ──
    const digestItems: DigestItem[] = aiResults.map((result, idx) => {
      const article = uniqueArticles[result.index - 1]; // AI 返回的 index 是 1-based
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

    // ── Step 6: 持久化摘要到 DB（可选） ──
    if (run) {
      await insertDigestItems(run.id, digestItems, urlToArticleId);
    }

    // ── Step 7: 推送到所有输出渠道 ──
    for (const output of outputs) {
      try {
        log.info({ output: output.name }, "Sending digest to output");
        await output.send(digest);
      } catch (error) {
        log.error({ error, output: output.name }, "Output send failed");
        // 单个输出失败不中断
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
