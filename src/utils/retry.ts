/**
 * 通用重试工具 — 指数退避
 *
 * 默认最多 3 次，初始延迟 1s，每次翻倍，上限 30s。
 * 所有网络调用（HN API、AI API、Discord Webhook）都通过这里重试。
 */
import { logger } from "./logger.js";

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        logger.error({ error, label, attempt }, "All retry attempts exhausted");
        throw error;
      }
      // 指数退避：1s → 2s → 4s → ...，不超过 maxDelayMs
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      logger.warn({ label, attempt, delay, error }, "Retrying after failure");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}
