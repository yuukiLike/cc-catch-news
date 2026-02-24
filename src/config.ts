/**
 * 环境变量配置
 *
 * 使用 Zod 做运行时校验，启动时如果缺少必填项会直接报错退出。
 * AI_BASE_URL 支持任何 OpenAI 兼容接口（DeepSeek / OpenAI / Groq 等），
 * 只需在 .env 里切换 URL 和 model 即可。
 */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // ── 必填 ──────────────────────────────────────
  AI_API_KEY: z.string().min(1, "AI_API_KEY is required"),
  DISCORD_WEBHOOK_URL: z.string().url("DISCORD_WEBHOOK_URL must be a valid URL"),

  // ── 可选（有默认值） ──────────────────────────
  AI_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  AI_MODEL: z.string().default("deepseek-chat"),
  CRON_SCHEDULE: z.string().default("0 */6 * * *"),
  TOP_N: z.coerce.number().int().positive().default(10),

  // ── 可选（无默认值，功能按需启用） ────────────
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
