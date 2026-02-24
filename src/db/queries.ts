/**
 * 数据库查询层
 *
 * 所有函数都先检查 DB 是否可用（getDb() 可能返回 null），
 * 不可用时返回空值，不影响 pipeline 运行。
 */
import { eq } from "drizzle-orm";
import { getDb } from "./client.js";
import { articles, runs, digestItems } from "./schema.js";
import { hashUrl } from "../utils/url.js";
import type { RawArticle } from "../sources/types.js";
import type { DigestItem } from "../outputs/types.js";
import { logger } from "../utils/logger.js";

const log = logger.child({ module: "db-queries" });

/** 创建一条 pipeline 运行记录 */
export async function createRun(sourceNames: string[], outputNames: string[]) {
  const db = getDb();
  if (!db) return null;

  const [run] = await db
    .insert(runs)
    .values({ sourceNames, outputNames })
    .returning();
  return run;
}

/** 更新运行记录的结束状态 */
export async function finishRun(
  runId: number,
  status: string,
  articleCount: number,
  digestCount: number,
  error?: string,
) {
  const db = getDb();
  if (!db) return;

  await db
    .update(runs)
    .set({
      finishedAt: new Date(),
      status,
      articleCount,
      digestCount,
      error: error ?? null,
    })
    .where(eq(runs.id, runId));
}

/** 批量 upsert 文章，URL hash 冲突时跳过（去重），返回 url → articleId 映射 */
export async function upsertArticles(rawArticles: RawArticle[]) {
  const db = getDb();
  if (!db) return new Map<string, number>();

  const urlToId = new Map<string, number>();

  for (const article of rawArticles) {
    const urlH = hashUrl(article.url);

    const [row] = await db
      .insert(articles)
      .values({
        urlHash: urlH,
        url: article.url,
        title: article.title,
        sourceName: article.sourceName,
        sourceId: article.sourceId,
        score: article.score,
        commentCount: article.commentCount,
        author: article.author,
        meta: article.meta,
        createdAt: article.createdAt,
      })
      .onConflictDoNothing({ target: articles.urlHash })
      .returning();

    if (row) {
      urlToId.set(article.url, row.id);
    }
  }

  log.info({ inserted: urlToId.size, total: rawArticles.length }, "Upserted articles");
  return urlToId;
}

/** 将 AI 筛选后的摘要条目存入 DB */
export async function insertDigestItems(
  runId: number,
  items: DigestItem[],
  urlToArticleId: Map<string, number>,
) {
  const db = getDb();
  if (!db) return;

  for (const item of items) {
    const articleId = urlToArticleId.get(item.url);
    if (!articleId) continue;

    await db.insert(digestItems).values({
      runId,
      articleId,
      rank: item.rank,
      aiScore: item.score,
      summary: item.summary,
      tags: item.tags,
    });
  }
}
