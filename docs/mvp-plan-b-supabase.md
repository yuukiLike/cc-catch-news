# 方案 B：Supabase + GitHub Actions MVP（扩展期默认）

> 在方案 A 验证通过后增加数据库，沉淀历史与运行状态，保持零服务器运维。

## 架构

```
GitHub Actions (定时触发)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ 运行内去重 (URL hash, 单次执行内)
       ├─ AI 筛选 + 中文摘要
       ├─ DB 持久化 (runs / articles / digest_items)
       └─ Discord Webhook 推送
```

- Supabase 免费版 PostgreSQL，替代自建数据库
- GitHub Actions 继续负责调度
- 现有 Drizzle 代码可直接复用

## 能力边界（按当前实现）

- 已支持：
  - 运行追踪（`runs`）
  - 文章入库（`articles`，URL hash 唯一）
  - 摘要入库（`digest_items`）
- 未默认支持：
  - **跨运行去重后再推送**（历史文章自动跳过推送）

> 说明：`articles` 的唯一约束会避免重复写入数据库，但不会自动阻止同一 URL 在不同运行中再次进入 AI 和推送流程。

## 成本

| 项目 | 费用 |
|------|------|
| Supabase 免费版 | 免费（500MB 数据库） |
| GitHub Actions | 免费 |
| AI API | 按量计费 |
| **合计** | **约 $0 + AI API** |

## 实施步骤

### 1. 创建 Supabase 项目（5 分钟）

1. 登录 [supabase.com](https://supabase.com)，新建项目
2. 选择区域：东京或新加坡
3. 在 `Settings -> Database` 复制连接串（`Transaction mode`, 6543）

示例：

```text
postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 2. 本地验证数据库连接（10 分钟）

```bash
cp .env.example .env
```

填入 `.env`：

```bash
AI_API_KEY=sk-xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

运行迁移和联调：

```bash
npm install
npm run db:generate
npm run db:migrate
npm run run-once
```

验证项：
- Discord 收到摘要
- Supabase 中 `runs`、`articles`、`digest_items` 有新增数据

### 3. 创建 GitHub Actions Workflow

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

      - run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - run: npm run run-once
        env:
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 4. 配置 GitHub Secrets

| Secret | 值 |
|--------|----|
| `AI_API_KEY` | DeepSeek / OpenAI 兼容 API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |
| `DATABASE_URL` | Supabase 连接字符串 |

### 5. 推送并验证

```bash
git add .github/workflows/catch-news.yml
git commit -m "ci: add GitHub Actions workflow with Supabase"
git push
```

手动触发一次，确认三件事：
- Actions 成功
- Discord 收到消息
- Supabase 表中有新增记录

## 相比方案 A 的增益

| 能力 | 方案 A | 方案 B |
|------|--------|--------|
| 历史记录 | 无 | 有 |
| 运行状态追踪 | 仅 Actions 日志 | 有（`runs`） |
| 数据分析 | 弱 | 可 SQL 查询 |
| 跨运行去重推送 | 无 | 默认仍无（需追加逻辑） |

## 下一步（可选）

若你希望减少重复推送，可在 pipeline 的 AI 前增加“历史 URL 过滤”步骤：

1. 查询最近 N 天已推送 URL hash
2. 在候选列表中过滤后再调用 AI
3. 仅对新文章生成并推送摘要
