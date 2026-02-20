import type { RawArticle, SourcePlugin } from "./types.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

interface PHNode {
  id: string;
  name: string;
  tagline: string;
  url: string;
  votesCount: number;
  website: string;
  createdAt: string;
  topics: { edges: Array<{ node: { name: string } }> };
}

interface PHResponse {
  data: {
    posts: {
      edges: Array<{ node: PHNode }>;
    };
  };
}

const PH_API = "https://api.producthunt.com/v2/api/graphql";

const AI_TOPICS = new Set([
  "artificial intelligence",
  "machine learning",
  "ai",
  "chatgpt",
  "llm",
  "deep learning",
  "natural language processing",
  "generative ai",
]);

export const productHuntSource: SourcePlugin = {
  name: "producthunt",
  label: "Product Hunt",
  enabled: !!config.PRODUCTHUNT_API_TOKEN,

  async fetch(since?: Date): Promise<RawArticle[]> {
    const log = logger.child({ source: "producthunt" });
    const token = config.PRODUCTHUNT_API_TOKEN;

    if (!token) {
      log.warn("PRODUCTHUNT_API_TOKEN not set, skipping");
      return [];
    }

    const postedAfter = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

    const query = `
      query {
        posts(first: 50, postedAfter: "${postedAfter.toISOString()}", topic: "artificial-intelligence") {
          edges {
            node {
              id
              name
              tagline
              url
              votesCount
              website
              createdAt
              topics { edges { node { name } } }
            }
          }
        }
      }
    `;

    const data = await withRetry(
      async () => {
        const res = await fetch(PH_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) throw new Error(`PH API ${res.status}: ${res.statusText}`);
        return res.json() as Promise<PHResponse>;
      },
      "producthunt-fetch",
    );

    const posts = data.data.posts.edges.map((e) => e.node);
    log.info({ count: posts.length }, "Fetched Product Hunt posts");

    return posts.map((post) => ({
      sourceId: post.id,
      title: `${post.name} — ${post.tagline}`,
      url: post.website || post.url,
      score: post.votesCount,
      createdAt: new Date(post.createdAt),
      sourceName: "producthunt",
      meta: {
        phUrl: post.url,
        topics: post.topics.edges.map((e) => e.node.name),
      },
    }));
  },
};
