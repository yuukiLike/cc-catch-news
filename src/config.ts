import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Required
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  DISCORD_WEBHOOK_URL: z.string().url("DISCORD_WEBHOOK_URL must be a valid URL"),

  // Optional
  AI_MODEL: z.string().default("claude-sonnet-4-20250514"),
  CRON_SCHEDULE: z.string().default("0 */6 * * *"),
  TOP_N: z.coerce.number().int().positive().default(10),
  DATABASE_URL: z.string().optional(),
  PRODUCTHUNT_API_TOKEN: z.string().optional(),
  WECHAT_WORK_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
