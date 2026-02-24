# 方案 D：Cloudflare Workers（边缘计算）

> 全球边缘运行，冷启动 < 5ms，免费额度充足。

## 架构

```
Cloudflare Workers (Cron Trigger 每 6h)
  │
  ├─ fetch HN (Algolia API)
  ├─ 去重 (KV 或内存)
  ├─ AI 筛选 (DeepSeek API)
  └─ Discord Webhook 推送
```

可选加 KV / D1 做持久化。

## 成本

| 项目 | 免费版限制 | 够用？ |
|------|-----------|--------|
| Workers 请求 | 10 万次/天 | 每天 4 次，远够 |
| Cron Triggers | 5 个 | 只需 1 个 |
| KV 存储 | 10 万次读/天，1000 次写/天 | 够 |
| D1 数据库 | 5GB + 500 万行读/天 | 远够 |
| CPU 时间 | 10ms/请求（免费）/ 30s（$5 计划） | 免费版可能不够，需 $5 计划 |
| AI API | ~$0.5/月 | - |
| **合计** | **$0 ~ $5/月** | - |

## 实施步骤

### 1. 初始化项目

```bash
npm create cloudflare@latest cc-catch-news-worker -- --type scheduled
cd cc-catch-news-worker
```

### 2. 配置 wrangler.toml

```toml
name = "cc-catch-news"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[triggers]
crons = ["0 */6 * * *"]

[vars]
AI_BASE_URL = "https://api.deepseek.com"
AI_MODEL = "deepseek-chat"
TOP_N = "10"

# KV 用于去重（可选）
# [[kv_namespaces]]
# binding = "SEEN_URLS"
# id = "xxx"

# D1 用于历史记录（可选）
# [[d1_databases]]
# binding = "DB"
# database_name = "catch-news"
# database_id = "xxx"
```

### 3. 核心代码

```typescript
// src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Step 1: 抓取 HN
    const queries = ["AI", "LLM", "GPT", "machine learning", "deep learning", "Claude", "neural network"];
    const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const allHits = new Map();

    for (const q of queries) {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=50`
      );
      const data = await res.json();
      for (const hit of data.hits) {
        if (hit.url && !allHits.has(hit.objectID)) {
          allHits.set(hit.objectID, hit);
        }
      }
    }

    // Step 2: 构建 prompt
    const articles = [...allHits.values()];
    const prompt = buildPrompt(articles, Number(env.TOP_N));

    // Step 3: AI 筛选
    const aiRes = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const aiData = await aiRes.json();
    const resultText = aiData.choices[0]?.message?.content;

    // Step 4: 解析 + 推送 Discord
    const results = JSON.parse(resultText.match(/```json\s*([\s\S]*?)```/)?.[1] || resultText);
    const markdown = formatMarkdown(results, articles);

    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: markdown }),
    });
  },
};
```

### 4. 配置 Secrets

```bash
wrangler secret put AI_API_KEY
wrangler secret put DISCORD_WEBHOOK_URL
```

### 5. 部署

```bash
wrangler deploy
```

## 优点

- 全球 300+ 节点，就近执行
- 冷启动极快（< 5ms）
- 免费额度对本场景绰绰有余
- D1 / KV 可做轻量持久化
- `wrangler deploy` 一条命令部署

## 局限

- 免费版 CPU 时间限制 10ms（AI API 调用是 I/O 不算 CPU，但解析可能超限）
- 建议用 $5/月的 Workers Paid 计划（30s CPU 时间）
- 不能直接复用现有 Node.js 代码（Workers 运行时不完全兼容 Node.js）
- 调试体验不如本地 Node.js
- 复杂逻辑在 Workers 里写起来不如传统后端舒服
