# 方案总览：AI 资讯抓取推送的 N 种实现

> 核心需求：定时抓取 HN → AI 筛选/摘要 → 推送 Discord

## 方案对比

| 方案 | 代码量 | 月成本 | 部署复杂度 | 可定制性 | 适合谁 |
|------|--------|--------|-----------|---------|--------|
| **A. GitHub Actions** | 已有代码 | $0 + API 费 | 低 | 高 | 开发者，想零运维 |
| **B. Supabase + Actions** | 已有代码 | $0 + API 费 | 低 | 高 | 开发者，需要去重/历史 |
| **C. n8n** | 零代码 | $0(自托管) / $20(云) | 中 | 中 | 喜欢可视化编排 |
| **D. Cloudflare Workers** | ~100 行 | $0 | 低 | 高 | 想要全球边缘、极致轻量 |
| **E. Make (Integromat)** | 零代码 | $9/月起 | 低 | 低 | 非技术用户，快速上手 |
| **F. VPS + Docker** | 已有代码 | $5-12/月 | 高 | 最高 | 需要完整控制 |

## 选型建议

```
你的需求是什么？
│
├─ "零成本快速验证"
│   └─ 方案 A：GitHub Actions（当前可直接用）
│
├─ "零代码，拖拽搞定"
│   └─ 方案 C：n8n 或 方案 E：Make
│
├─ "长期运行，要去重和历史"
│   └─ 方案 B：Supabase + GitHub Actions
│
├─ "极致轻量，全球加速"
│   └─ 方案 D：Cloudflare Workers
│
└─ "完整控制，多项目共用"
    └─ 方案 F：VPS + Docker（原始设计）
```

## 共同依赖

无论哪种方案，都需要：
- 一个 AI API Key（DeepSeek / OpenAI / Claude）
- 一个 Discord Webhook URL

## 详细文档

- [方案 A — GitHub Actions](./plan-a-github-actions.md)
- [方案 B — Supabase + GitHub Actions](./plan-b-supabase.md)
- [方案 C — n8n](./plan-c-n8n.md)
- [方案 D — Cloudflare Workers](./plan-d-cloudflare-workers.md)
- [方案 E — Make (Integromat)](./plan-e-make.md)
- [方案 F — VPS + Docker](./plan-f-vps-docker.md)
