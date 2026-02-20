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

  if (runOnce) {
    log.info("Running pipeline once");
    await runPipeline();
    log.info("Done");
    process.exit(0);
  }

  // Run immediately on startup
  log.info("Running initial pipeline");
  await runPipeline().catch((error) => {
    log.error({ error }, "Initial pipeline run failed");
  });

  // Schedule recurring runs
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
