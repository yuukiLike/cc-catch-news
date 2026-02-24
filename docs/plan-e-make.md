# 方案 E：Make (Integromat)（纯图形化）

> 完全不写代码，鼠标点点就能搭，适合非技术用户。

## 架构

```
Make Scenario (Schedule 每 6h)
  │
  ├─ [HTTP] HN Algolia 搜索
  ├─ [Array Aggregator] 合并结果
  ├─ [HTTP] DeepSeek API 调用
  ├─ [JSON Parse] 解析响应
  └─ [Discord Webhook] 推送
```

## 成本

| 计划 | 费用 | Operations/月 |
|------|------|--------------|
| Free | $0 | 1,000 ops |
| Core | $9/月 | 10,000 ops |
| AI API | ~$0.5/月 | - |

每次运行约 15-20 个 operations（7 个 HTTP + 合并 + AI + 解析 + 推送），
每天 4 次 = ~80 ops/天 = ~2400 ops/月。**免费版不够，需要 Core 计划。**

## 实施步骤

### 1. 注册 Make

[make.com](https://www.make.com) 注册账号。

### 2. 创建 Scenario

#### Module 1: Schedule
- Interval: Every 6 hours

#### Module 2-8: HTTP Request × 7（并行）
- URL: `https://hn.algolia.com/api/v1/search`
- 每个用不同的 query 参数

#### Module 9: Array Aggregator
- 合并 7 个 HTTP 请求的 hits 数组

#### Module 10: HTTP Request（AI）
- Method: POST
- URL: `https://api.deepseek.com/chat/completions`
- Headers: Authorization Bearer
- Body: 构建 prompt JSON

#### Module 11: JSON Parse
- 解析 AI 返回的 JSON

#### Module 12: Discord Webhook
- URL: 你的 Webhook
- Body: 格式化后的 Markdown

### 3. 配置 Connections
- 添加 DeepSeek API Key 到 HTTP Authorization
- 添加 Discord Webhook URL

### 4. 测试并激活

点 "Run once" 测试，确认 Discord 收到消息后激活 Scenario。

## 优点

- 真正零代码，全程 GUI 操作
- 可视化执行日志，每步都能看到数据
- 错误通知（邮件/Slack）
- 内置大量集成（400+），加渠道很方便
- 团队协作友好

## 局限

- **$9/月起**，个人项目性价比低
- 免费版 1000 ops/月不够用
- 复杂逻辑（去重、JSON 解析）在 GUI 里实现很别扭
- 没有版本控制，改坏了不好回滚
- AI prompt 调试不方便
- 数据不持久化（除非再接 Google Sheets / Airtable）
