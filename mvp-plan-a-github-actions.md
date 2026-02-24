# 方案 A：GitHub Actions 极简 MVP

> 零成本、零服务器、无数据库。验证核心价值：AI 筛选质量 + Discord 推送体验。

## 架构

```
GitHub Actions (定时触发)
  └─ npm run run-once
       ├─ HN 抓取 (Algolia API)
       ├─ Claude 筛选 + 中文摘要
       └─ Discord Webhook 推送
```

- 无 PostgreSQL，无 Docker，无 VPS
- 不做去重（6h 间隔，少量重复可接受）
- 代码零改动（已支持无 DATABASE_URL 运行）

## 成本

| 项目 | 费用 |
|------|------|
| GitHub Actions | 免费（2000 分钟/月，每次约 1 分钟） |
| Anthropic API | ~$0.5/月（每天 4 次，每次 ~100 篇） |
| **合计** | **~$0.5/月** |

## 实施步骤

### 1. 本地验证（10 分钟）

```bash
# 复制环境变量
cp .env.example .env

# 填入两个必填项
# ANTHROPIC_API_KEY=sk-ant-xxx
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx

# 安装依赖
npm install

# 跑一次，看 Discord 是否收到消息
npm run run-once
```

确认 Discord 频道收到 AI 资讯摘要后，进入下一步。

### 2. 创建 GitHub Actions Workflow

创建 `.github/workflows/catch-news.yml`：

```yaml
name: Catch News

on:
  schedule:
    # 每 6 小时运行：UTC 0:00, 6:00, 12:00, 18:00
    # 对应北京时间 8:00, 14:00, 20:00, 2:00
    - cron: '0 */6 * * *'
  workflow_dispatch: # 支持手动触发

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
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          # 可选：覆盖默认值
          # AI_MODEL: claude-haiku-4-5-20251001
          # TOP_N: 10
```

### 3. 配置 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 值 |
|--------|----|
| `ANTHROPIC_API_KEY` | Anthropic API Key |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |

### 4. 推送并验证

```bash
git add .github/workflows/catch-news.yml
git commit -m "ci: add GitHub Actions scheduled workflow"
git push
```

推送后在 Actions 页面手动触发一次 `workflow_dispatch`，确认运行成功。

## 局限性

| 问题 | 影响 | 后续解决 |
|------|------|----------|
| 无去重 | 6h 内热门文章可能重复出现 | 加 Supabase（方案 B） |
| 无历史记录 | 无法回溯/分析过去的推送 | 加 DB |
| 定时不精确 | GitHub Actions cron 有 5-15 分钟延迟 | 可接受 |
| 无 Product Hunt | 需要 API Token，暂不启用 | 后续申请 |

## 升级路径

验证 MVP 有效后，可逐步升级：

1. **加 Supabase**（方案 B）→ 解决去重 + 历史记录
2. **申请 PH Token** → 启用 Product Hunt 源
3. **加企业微信** → 多渠道推送
4. **迁移到 VPS** → 需要更灵活调度时再考虑
