import type { RawArticle, SourcePlugin } from "./types.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

interface HNHit {
  objectID: string;
  title: string;
  url: string | null;
  story_url?: string | null;
  points: number;
  num_comments: number;
  author: string;
  created_at: string;
  created_at_i: number;
}

interface HNSearchResponse {
  hits: HNHit[];
  nbHits: number;
}

const HN_API = "https://hn.algolia.com/api/v1";

export const hackernewsSource: SourcePlugin = {
  name: "hackernews",
  label: "Hacker News",
  enabled: true,

  async fetch(since?: Date): Promise<RawArticle[]> {
    const log = logger.child({ source: "hackernews" });

    // Default to last 24 hours
    const sinceTs = since
      ? Math.floor(since.getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    const queries = [
      "AI",
      "LLM",
      "GPT",
      "machine learning",
      "deep learning",
      "Claude",
      "neural network",
    ];

    const allHits = new Map<string, HNHit>();

    for (const query of queries) {
      const url = `${HN_API}/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${sinceTs}&hitsPerPage=50`;

      try {
        const data = await withRetry(
          async () => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HN API ${res.status}: ${res.statusText}`);
            return res.json() as Promise<HNSearchResponse>;
          },
          `hn-search-${query}`,
        );

        for (const hit of data.hits) {
          if (!allHits.has(hit.objectID)) {
            allHits.set(hit.objectID, hit);
          }
        }
      } catch (error) {
        log.error({ error, query }, "Failed to fetch HN results for query");
      }
    }

    log.info({ count: allHits.size }, "Fetched HN articles");

    const articles: RawArticle[] = [];
    for (const hit of allHits.values()) {
      const articleUrl = hit.url || hit.story_url;
      if (!articleUrl) continue;

      articles.push({
        sourceId: hit.objectID,
        title: hit.title,
        url: articleUrl,
        score: hit.points,
        commentCount: hit.num_comments,
        author: hit.author,
        createdAt: new Date(hit.created_at),
        sourceName: "hackernews",
        meta: {
          hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        },
      });
    }

    return articles;
  },
};
