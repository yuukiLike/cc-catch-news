# 方案 A：GitHub Actions 极简 MVP（验证期默认）

> 目标：以最低成本验证“这份信息推送是否真的有价值”。

## 架构

```
GitHub Actions (定时触发)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ 运行内去重 (URL hash, 单次执行内)
       ├─ AI 筛选 + 中文摘要
       └─ Discord Webhook 推送
```

- 无 PostgreSQL，无 Docker，无 VPS
- 使用现有代码直接运行
- 重点是验证内容价值，不是先做完整平台

## 成本

| 项目 | 费用 |
|------|------|
| GitHub Actions | 免费（私有仓库 2000 分钟/月） |
| AI API | 按量计费 |
| **合计** | **约 $0 + AI API** |

## 实施步骤

### 1. 本地验证（10 分钟）

```bash
cp .env.example .env
# 填入两个必填项：
# AI_API_KEY=sk-xxx
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx

npm install
npm run run-once
```

确认 Discord 收到摘要后，再进入自动化调度。

### 2. 创建 GitHub Actions Workflow

创建 `.github/workflows/catch-news.yml`：

```yaml
name: Catch News

on:
  schedule:
    # UTC: 0:00 / 6:00 / 12:00 / 18:00
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

### 3. 配置 GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions` 中添加：

| Secret | 值 |
|--------|----|
| `AI_API_KEY` | DeepSeek / OpenAI 兼容 API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |

### 4. 推送并验证

```bash
git add .github/workflows/catch-news.yml
git commit -m "ci: add GitHub Actions scheduled workflow"
git push
```

在 Actions 页面手动触发一次 `workflow_dispatch` 做联调。

## 已知局限

| 问题 | 影响 | 升级方向 |
|------|------|----------|
| 无持久化历史 | 无法回看/统计 | 升级方案 B（Supabase） |
| 仅运行内去重 | 不会跨运行去重推送 | 在 B 上追加历史过滤逻辑 |
| cron 非强实时 | 可能有分钟级延迟 | 通常可接受 |

## 升级路径

1. 升级到 **方案 B（Supabase）**：补齐历史和运行追踪
2. 启用 Product Hunt 源：配置 `PRODUCTHUNT_API_TOKEN`
3. 增加企业微信输出：配置 `WECHAT_WORK_WEBHOOK_URL`
