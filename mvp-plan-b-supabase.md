# 方案 B：Supabase + GitHub Actions MVP

> 零服务器成本，有数据库支持。在方案 A 基础上增加去重和历史记录。

## 架构

```
GitHub Actions (定时触发)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ DB 去重 (Supabase PostgreSQL)
       ├─ Claude 筛选 + 中文摘要
       ├─ DB 持久化 (articles + digest_items)
       └─ Discord Webhook 推送
```

- Supabase 免费版 PostgreSQL，替代自建 Docker PG
- GitHub Actions 定时触发，替代 VPS + node-cron
- 现有 Drizzle ORM 代码**零改动**，只改 `DATABASE_URL` 指向

## 成本

| 项目 | 费用 |
|------|------|
| Supabase 免费版 | 免费（500MB 数据库，足够用数年） |
| GitHub Actions | 免费 |
| Anthropic API | ~$0.5/月 |
| **合计** | **~$0.5/月** |

## 实施步骤

### 1. 创建 Supabase 项目（5 分钟）

1. 登录 [supabase.com](https://supabase.com)，创建新项目
2. 选择区域：**Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**
3. 设置数据库密码（记好）
4. 项目创建完成后，进入 Settings → Database → Connection string
5. 复制 **URI** 格式的连接字符串：
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

> 注意：选 **Transaction mode (port 6543)** 即可，适合短连接场景（GitHub Actions 每次新建连接）。

### 2. 本地验证数据库连接（10 分钟）

```bash
cp .env.example .env
```

填入 `.env`：

```bash
ANTHROPIC_API_KEY=sk-ant-xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

运行迁移 + 验证：

```bash
npm install

# 生成迁移文件
npm run db:generate

# 执行迁移，在 Supabase 中创建表
npm run db:migrate

# 跑一次完整流程
npm run run-once
```

验证：
- Discord 频道收到摘要
- Supabase Dashboard → Table Editor 中能看到 `runs`、`articles`、`digest_items` 表有数据

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

      # 迁移幂等，每次运行确保 schema 最新
      - run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - run: npm run run-once
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # 可选
          # AI_MODEL: claude-haiku-4-5-20251001
          # TOP_N: 10
```

### 4. 配置 GitHub Secrets

| Secret | 值 |
|--------|----|
| `ANTHROPIC_API_KEY` | Anthropic API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |
| `DATABASE_URL` | Supabase 连接字符串 |

### 5. 推送并验证

```bash
git add .github/workflows/catch-news.yml
git commit -m "ci: add GitHub Actions workflow with Supabase"
git push
```

手动触发一次，确认：
- Actions 运行成功
- Discord 收到消息
- Supabase 表中有新数据

## 对比方案 A 的增益

| 能力 | 方案 A | 方案 B |
|------|--------|--------|
| 文章去重 | 无 | URL hash 去重，不会重复推送 |
| 历史记录 | 无 | 每次运行、每篇文章、每条摘要都入库 |
| 运行状态追踪 | 只有 Actions 日志 | `runs` 表记录每次执行状态 |
| 数据分析 | 不可能 | 可在 Supabase SQL Editor 直接查询 |
| 额外成本 | 无 | 无（免费版 500MB 足够） |
| 额外复杂度 | 无 | 多一个 Secret + 一次迁移 |

## Supabase 免费版限制

| 资源 | 限制 | 够用？ |
|------|------|--------|
| 数据库大小 | 500 MB | 纯文本数据，预估每月 ~1MB，可用数年 |
| 项目数 | 2 个 | 够（OpenClaw 可用第二个） |
| 暂停策略 | 7 天不活跃自动暂停 | 每 6h 运行一次，不会触发 |
| API 请求 | 无限制（直连） | 用 Drizzle 直连，不走 REST API |

## 局限性

| 问题 | 影响 | 后续解决 |
|------|------|----------|
| 定时不精确 | GitHub Actions cron 有延迟 | 可接受 |
| 无 Product Hunt | 需要 API Token | 后续申请 |
| Supabase 在海外 | 国内访问延迟 ~200ms | CI 在 GitHub 跑，无影响 |

## 升级路径

1. **申请 PH Token** → 启用 Product Hunt 源
2. **加企业微信** → 设置 `WECHAT_WORK_WEBHOOK_URL`
3. **迁移到 VPS** → 如果需要更灵活调度或更多项目共用
