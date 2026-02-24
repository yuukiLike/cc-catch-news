/**
 * 应用入口
 *
 * 两种运行模式：
 * - `--once`：执行一次 pipeline 后退出（用于手动运行 / CI）
 * - 默认：启动后立即执行一次，然后按 cron 定时循环执行
 */
import cron from "node-cron";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { runPipeline } from "./pipeline.js";

const log = logger.child({ module: "main" });

async function main() {
  const runOnce = process.argv.includes("--once");

  log.info(
    {
      mode: runOnce ? "once" : "scheduled",
      schedule: config.CRON_SCHEDULE,
      model: config.AI_MODEL,
      topN: config.TOP_N,
    },
    "cc-catch-news starting",
  );

  // 单次模式：跑完即退出
  if (runOnce) {
    log.info("Running pipeline once");
    await runPipeline();
    log.info("Done");
    process.exit(0);
  }

  // 常驻模式：先跑一次，再按 cron 调度
  log.info("Running initial pipeline");
  await runPipeline().catch((error) => {
    log.error({ error }, "Initial pipeline run failed");
  });

  cron.schedule(config.CRON_SCHEDULE, async () => {
    log.info("Scheduled pipeline run triggered");
    await runPipeline().catch((error) => {
      log.error({ error }, "Scheduled pipeline run failed");
    });
  });

  log.info({ schedule: config.CRON_SCHEDULE }, "Scheduler started");
}

main().catch((error) => {
  log.fatal({ error }, "Fatal error");
  process.exit(1);
});
