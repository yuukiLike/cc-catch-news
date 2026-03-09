# 方案 A：GitHub Actions（验证期默认）

> 零服务器、零运维，用现有代码最快拿到真实反馈。

## 架构

```
GitHub Actions (cron 每 6h)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ 运行内去重 (URL hash, 单次执行内)
       ├─ AI 筛选 + 中文摘要
       └─ Discord Webhook 推送
```

## 成本

| 项目 | 费用 |
|------|------|
| GitHub Actions | 免费（私有仓库 2000 分钟/月，公开仓库基本够用） |
| AI API | 按量计费 |
| **合计** | **约 $0 + AI API** |

## 实施步骤

### 1. 本地验证

```bash
cp .env.example .env
# 填入 AI_API_KEY + DISCORD_WEBHOOK_URL
npm install
npm run run-once
```

### 2. 创建 Workflow

创建 `.github/workflows/catch-news.yml`：

```yaml
name: Catch News

on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      - run: npm run run-once
        env:
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
```

### 3. 配置 Secrets

| Secret | 值 |
|--------|----|
| `AI_API_KEY` | DeepSeek / OpenAI 兼容 API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |

## 优点

- 现有代码可直接复用
- 上手最快，验证成本最低
- 无主机运维负担

## 局限

- 仅“单次运行内去重”，不做跨运行去重
- 无持久化历史（未配置数据库时）
- GitHub cron 触发时间可能有分钟级偏移

## 何时升级到方案 B

当你确认“内容值得长期追踪”，并需要历史查询/运行追踪时，升级到 Supabase。
