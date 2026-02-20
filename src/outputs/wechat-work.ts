import type { FormattedDigest, OutputPlugin } from "./types.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

function formatDigestMarkdown(digest: FormattedDigest): string {
  const date = digest.generatedAt.toISOString().slice(0, 10);
  const lines: string[] = [`# AI 资讯日报 — ${date}\n`];

  for (const item of digest.items) {
    const tags = item.tags.length > 0 ? ` [${item.tags.join("] [")}]` : "";
    lines.push(`**${item.rank}. ${item.title}**${tags}`);
    lines.push(`> ${item.summary}`);
    lines.push(`> [阅读原文](${item.url}) | 评分: ${item.score}\n`);
  }

  return lines.join("\n");
}

export const wechatWorkOutput: OutputPlugin = {
  name: "wechat_work",
  label: "企业微信",
  enabled: !!config.WECHAT_WORK_WEBHOOK_URL && config.WECHAT_WORK_WEBHOOK_URL !== "",

  async send(digest: FormattedDigest): Promise<void> {
    const log = logger.child({ output: "wechat_work" });
    const webhookUrl = config.WECHAT_WORK_WEBHOOK_URL;

    if (!webhookUrl) {
      log.warn("WECHAT_WORK_WEBHOOK_URL not set, skipping");
      return;
    }

    const content = formatDigestMarkdown(digest);

    await withRetry(
      async () => {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            msgtype: "markdown",
            markdown: { content },
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`WeChat Work webhook ${res.status}: ${body}`);
        }
      },
      "wechat-work-send",
    );

    log.info({ itemCount: digest.items.length }, "Sent digest to WeChat Work");
  },
};
