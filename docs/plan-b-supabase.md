# 方案 B：Supabase + GitHub Actions（扩展期默认）

> 在方案 A 基础上增加持久化与可观测性，仍保持零服务器运维。

## 架构

```
GitHub Actions (cron 每 6h)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ 运行内去重 (URL hash, 单次执行内)
       ├─ AI 筛选 + 中文摘要
       ├─ DB 持久化 (runs / articles / digest_items)
       └─ Discord Webhook 推送
```

## 能力边界（基于当前代码）

- 已支持：
  - 运行记录追踪（`runs`）
  - 文章入库（`articles`，URL hash 唯一）
  - 摘要入库（`digest_items`）
- 当前未默认支持：
  - **跨运行去重后再推送**（即“历史已推送 URL 不再推送”）

> 说明：`articles` 的唯一约束会避免重复写入数据库，但不会自动阻止同一文章在不同运行中再次进入 AI 和推送流程。

## 成本

| 项目 | 费用 |
|------|------|
| Supabase 免费版 | 免费（500MB 数据库） |
| GitHub Actions | 免费 |
| AI API | 按量计费 |
| **合计** | **约 $0 + AI API** |

## 实施步骤

### 1. 创建 Supabase 项目

1. 登录 [supabase.com](https://supabase.com) 并新建项目
2. 区域建议选择东京或新加坡
3. 复制 Connection string（Transaction mode, 6543）

### 2. 本地验证

```bash
cp .env.example .env
# 填入 AI_API_KEY、DISCORD_WEBHOOK_URL、DATABASE_URL
npm install
npm run db:generate
npm run db:migrate
npm run run-once
```

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
| `AI_API_KEY` | DeepSeek / OpenAI 兼容 API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |
| `DATABASE_URL` | Supabase 连接字符串 |

## 对比方案 A 的增益

| 能力 | 方案 A | 方案 B |
|------|--------|--------|
| 历史记录 | 无 | 有（`articles` / `digest_items`） |
| 运行追踪 | 仅 Actions 日志 | 有（`runs`） |
| 数据分析 | 弱 | 可 SQL 查询 |
| 跨运行去重推送 | 无 | 默认仍无（需额外逻辑） |

## 下一步扩展（可选）

如果你确认要减少重复推送，可在 pipeline 的 AI 前增加“历史 URL 过滤”步骤：

1. 查询最近 N 天已推送的 URL hash
2. 在候选列表中过滤后再调用 AI
3. 仅对新文章构建 digest
