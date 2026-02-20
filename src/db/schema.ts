import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  serial,
  varchar,
  real,
  index,
} from "drizzle-orm/pg-core";

export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  status: varchar("status", { length: 20 }).notNull().default("running"),
  sourceNames: jsonb("source_names").$type<string[]>().notNull(),
  outputNames: jsonb("output_names").$type<string[]>().notNull(),
  articleCount: integer("article_count"),
  digestCount: integer("digest_count"),
  error: text("error"),
});

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    urlHash: varchar("url_hash", { length: 64 }).notNull().unique(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    sourceName: varchar("source_name", { length: 50 }).notNull(),
    sourceId: varchar("source_id", { length: 100 }),
    score: integer("score"),
    commentCount: integer("comment_count"),
    author: varchar("author", { length: 100 }),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("articles_url_hash_idx").on(table.urlHash),
    index("articles_source_name_idx").on(table.sourceName),
    index("articles_fetched_at_idx").on(table.fetchedAt),
  ],
);

export const digestItems = pgTable(
  "digest_items",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id")
      .notNull()
      .references(() => runs.id),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id),
    rank: integer("rank").notNull(),
    aiScore: real("ai_score").notNull(),
    summary: text("summary").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("digest_items_run_id_idx").on(table.runId),
  ],
);
