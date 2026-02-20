import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import * as schema from "./schema.js";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (db) return db;

  if (!config.DATABASE_URL) {
    logger.warn("DATABASE_URL not set — database features disabled");
    return null;
  }

  const client = postgres(config.DATABASE_URL);
  db = drizzle(client, { schema });
  logger.info("Database connection established");
  return db;
}
