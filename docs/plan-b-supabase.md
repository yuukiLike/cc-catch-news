# 方案 B：Supabase + GitHub Actions

> 在方案 A 基础上加数据库，实现去重和历史记录，仍然零服务器。

## 架构

```
GitHub Actions (cron 每 6h)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ DB 去重 (Supabase PostgreSQL)
       ├─ AI 筛选 + 中文摘要 (DeepSeek)
       ├─ DB 持久化 (articles + digest_items)
       └─ Discord Webhook 推送
```

## 成本

| 项目 | 费用 |
|------|------|
| Supabase 免费版 | 免费（500MB 数据库） |
| GitHub Actions | 免费 |
| AI API | ~$0.5/月 |
| **合计** | **~$0.5/月** |

## 实施步骤

### 1. 创建 Supabase 项目

1. 登录 [supabase.com](https://supabase.com)，新建项目
2. 区域选 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**
3. Settings → Database → Connection string，复制 URI：
   ```
   postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
4. 选 **Transaction mode (port 6543)**，适合短连接

### 2. 本地验证

```bash
cp .env.example .env
# 填入 AI_API_KEY、DISCORD_WEBHOOK_URL、DATABASE_URL
npm install
npm run db:generate
npm run db:migrate
npm run run-once
```

验证：Supabase Dashboard → Table Editor 中 `runs`、`articles`、`digest_items` 有数据。

### 3. GitHub Actions Workflow

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

      - run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - run: npm run run-once
        env:
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 4. GitHub Secrets

| Secret | 值 |
|--------|----|
| `AI_API_KEY` | DeepSeek / OpenAI API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |
| `DATABASE_URL` | Supabase 连接字符串 |

## 对比方案 A 的增益

| 能力 | 方案 A | 方案 B |
|------|--------|--------|
| 文章去重 | 无 | URL hash 去重 |
| 历史记录 | 无 | 全部入库 |
| 运行追踪 | 只有 Actions 日志 | `runs` 表 |
| 数据分析 | 不可能 | SQL 直接查 |
| 额外成本 | 无 | 无 |
| 额外复杂度 | 无 | +1 Secret + 1 次迁移 |

## Supabase 免费版限制

| 资源 | 限制 | 够用？ |
|------|------|--------|
| 数据库大小 | 500 MB | 每月 ~1MB，可用数年 |
| 项目数 | 2 个 | 够 |
| 暂停策略 | 7 天不活跃自动暂停 | 每 6h 跑一次，不触发 |
