# 方案 A：GitHub Actions（最极简）

> 零成本，零服务器，直接用现有代码。

## 架构

```
GitHub Actions (cron 每 6h)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ 内存去重 (URL hash)
       ├─ AI 筛选 + 中文摘要 (DeepSeek)
       └─ Discord Webhook 推送
```

## 成本

| 项目 | 费用 |
|------|------|
| GitHub Actions | 免费（私有仓库 2000 分钟/月，公开无限） |
| AI API | ~$0.5/月 |
| **合计** | **~$0.5/月** |

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
  workflow_dispatch:  # 支持手动触发

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

在 GitHub 仓库 Settings → Secrets → Actions 中添加：

| Secret | 值 |
|--------|----|
| `AI_API_KEY` | DeepSeek / OpenAI API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |

### 4. 推送并验证

```bash
git add .github/workflows/catch-news.yml
git commit -m "ci: add scheduled news pipeline"
git push
```

在 Actions 页面手动触发一次验证。

## 优点

- 零基础设施成本
- 代码已经写好，直接用
- 运维为零

## 局限

- 无持久化，每次跑完数据就没了
- 不去重（6h 间隔内可能有重复文章）
- cron 不精确，可能延迟几分钟
- 60 天无活动会被 GitHub 自动禁用
