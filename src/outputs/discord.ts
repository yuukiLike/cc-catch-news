/**
 * Discord 输出插件
 *
 * 将摘要格式化为 Markdown，通过 Webhook 推送到 Discord 频道。
 * Discord 单条消息限制 2000 字符，超出时自动拆分。
 */
import type { FormattedDigest, OutputPlugin } from "./types.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

/** 将摘要列表格式化为 Discord Markdown */
function formatDigestMessage(digest: FormattedDigest): string {
  const date = digest.generatedAt.toISOString().slice(0, 10);
  const lines: string[] = [`## 🤖 AI 资讯日报 — ${date}\n`];

  for (const item of digest.items) {
    const tags = item.tags.length > 0 ? ` \`${item.tags.join("` `")}\`` : "";
    lines.push(`**${item.rank}. [${item.title}](${item.url})**${tags}`);
    lines.push(`> ${item.summary}`);
    lines.push(`> 📊 Score: ${item.score} | 📰 ${item.sourceName}\n`);
  }

  return lines.join("\n");
}

/** 按 Discord 2000 字符限制拆分消息，按行拆不会截断格式 */
function splitMessage(content: string, limit = 2000): string[] {
  if (content.length <= limit) return [content];

  const chunks: string[] = [];
  let current = "";

  for (const line of content.split("\n")) {
    if (current.length + line.length + 1 > limit) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? "\n" : "") + line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export const discordOutput: OutputPlugin = {
  name: "discord",
  label: "Discord",
  enabled: !!config.DISCORD_WEBHOOK_URL,

  async send(digest: FormattedDigest): Promise<void> {
    const log = logger.child({ output: "discord" });
    const webhookUrl = config.DISCORD_WEBHOOK_URL;

    const content = formatDigestMessage(digest);
    const chunks = splitMessage(content);

    for (const chunk of chunks) {
      await withRetry(
        async () => {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: chunk }),
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`Discord webhook ${res.status}: ${body}`);
          }
        },
        "discord-send",
      );

      // 多条消息时加 500ms 间隔，避免触发 Discord 限流
      if (chunks.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    log.info({ itemCount: digest.items.length }, "Sent digest to Discord");
  },
};
