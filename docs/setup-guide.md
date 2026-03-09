# AI 资讯自动聚合实施指南

> 统一口径：先验证可行性，再做平台化扩展。

## 核心目标

每 6 小时自动抓取 AI 相关信息，经过 AI 筛选和中文摘要后，推送到 Discord（可选企业微信）。

## 默认架构（推荐）

### Phase 1：验证期

`GitHub Actions + Node Pipeline + Discord`

- 目标：快速验证内容质量与持续使用价值
- 成本：约 `$0 + AI API`
- 重点：先跑通，不先做重平台

### Phase 2：扩展期

`GitHub Actions + Node Pipeline + Supabase`

- 目标：沉淀历史、追踪运行状态、支持后续分析
- 说明：当前默认仍是“运行内去重”；跨运行去重需额外逻辑

## 需要准备的 Key

1. `AI_API_KEY`：DeepSeek / OpenAI / 其他 OpenAI 兼容服务
2. `DISCORD_WEBHOOK_URL`：Discord 推送必需
3. `DATABASE_URL`：可选（启用 Supabase 或 PostgreSQL 时）
4. `PRODUCTHUNT_API_TOKEN`：可选（启用 Product Hunt 源时）
5. `WECHAT_WORK_WEBHOOK_URL`：可选（启用企业微信输出时）

## 快速启动（本地验证）

```bash
cp .env.example .env
# 至少填 AI_API_KEY + DISCORD_WEBHOOK_URL
npm install
npm run run-once
```

验证标准：Discord 成功收到 AI 资讯摘要。

## GitHub Actions 定时运行

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

## 可选：接入 Supabase

当你需要历史查询和运行追踪时：

```bash
# .env 增加 DATABASE_URL 后
npm run db:generate
npm run db:migrate
npm run run-once
```

## 可选：n8n / Make / Workers

这些是编排或部署形态，不是默认主线。建议在验证通过后再选：

- n8n：可视化编排，适合频繁改流程
- Make：纯 GUI，速度快但订阅成本更高
- Workers：轻量边缘，但需要额外适配运行时

## Prompt 设计建议（通用）

不绑定单一 AI 提供商，保持统一输入输出：

- 输入：标题、URL、来源、基础热度
- 输出：JSON 数组（index/title/score/summary/tags）
- 约束：只返回机器可解析结构，避免额外解释文本
