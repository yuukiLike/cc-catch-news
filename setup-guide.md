# AI 资讯自动聚合工具方案

> 每隔 6 小时自动抓取 Hacker News 和 Product Hunt 的 AI 相关内容，经 Claude AI 筛选摘要后推送至 Discord 和微信。

## 核心平台

| 组件 | 用途 |
|------|------|
| **n8n** | 工作流编排，定时触发、数据流转 |
| **Claude API** | 对抓取内容做 AI 筛选/摘要/翻译 |

## 数据源 API

| 来源 | API | 认证 |
|------|-----|------|
| **Hacker News** | `https://hn.algolia.com/api/v1/search?query=AI` | 无需认证，免费 |
| **Product Hunt** | Product Hunt API v2 (GraphQL) | 需要 OAuth，在 [ph 开发者面板](https://www.producthunt.com/v2/oauth/applications) 申请 |

## 推送渠道

| 渠道 | 方案 | 说明 |
|------|------|------|
| **Discord** | Discord Webhook | 最简单，在频道设置里创建 Webhook URL 即可 |
| **微信** | 企业微信群机器人 Webhook | 最可靠的方案，无需个人号登录风险 |
| **微信(备选)** | Server酱 / PushPlus / WxPusher | 如果只推给自己，这些服务更轻量 |

## n8n 工作流结构

```
┌─────────────┐
│ Cron 触发器  │  每6小时执行一次
└──────┬──────┘
       │
  ┌────┴────┐
  ▼         ▼
┌─────┐  ┌──────────┐
│ HN  │  │ Product  │   并行抓取两个数据源
│ API │  │ Hunt API │
└──┬──┘  └────┬─────┘
   │          │
   └────┬─────┘
        ▼
┌───────────────┐
│  合并 + 去重   │
└───────┬───────┘
        ▼
┌───────────────┐
│  Claude API   │   筛选 AI 相关内容、生成中文摘要、排序
└───────┬───────┘
        ▼
   ┌────┴────┐
   ▼         ▼
┌─────────┐ ┌──────────┐
│ Discord │ │ 企业微信   │   格式化后并行推送
│ Webhook │ │ Webhook  │
└─────────┘ └──────────┘
```

## 需要准备的账号/Key

1. **n8n** — 自托管 (`docker run -it --rm -p 5678:5678 n8nio/n8n`) 或用 n8n Cloud
2. **Anthropic API Key** — 用于调用 Claude
3. **Product Hunt API credentials** — Developer Token
4. **Discord Webhook URL** — 在目标频道 Settings > Integrations 创建
5. **企业微信群机器人 Webhook** — 在企业微信群里添加机器人即可获得

## Claude Prompt 建议

在 n8n 的 HTTP Request 节点调用 Claude API 时，prompt 大致为：

```
你是一个 AI 领域资讯编辑。从以下 Hacker News 和 Product Hunt 内容中：
1. 筛选出与 AI/ML/LLM 相关的条目
2. 每条生成一句话中文摘要
3. 按热度排序，保留 Top 10
4. 输出为 Markdown 格式，包含标题、链接、摘要
```

## 微信推送方案对比

- **企业微信群机器人**（推荐）：稳定、官方支持、支持 Markdown、无封号风险
- **Server酱**：免费额度有限，适合个人接收
- **PushPlus**：支持推到微信公众号/群，免费额度够用
