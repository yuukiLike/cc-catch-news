# 架构总览：先验证，再平台化

> 目标不是先选“最完美技术栈”，而是先用最短路径验证信息产品是否有价值。

## 推荐默认路径（两阶段）

### Phase 1：验证期（1-2 周）

`GitHub Actions + 现有 Node Pipeline + Discord`

- 目标：验证内容质量、阅读率、持续使用意愿
- 成本：约 `$0 + AI API`
- 交付标准：稳定定时推送，人工确认内容有价值

### Phase 2：扩展期（验证通过后）

`GitHub Actions + Node Pipeline + Supabase`

- 目标：沉淀历史、运行追踪、为后续跨运行去重/分析做准备
- 成本：仍可接近 `$0 + AI API`
- 交付标准：`runs / articles / digest_items` 可查询，支持后续产品化

## 为什么是这个主线

- 你当前代码已经是可插拔 pipeline（源/AI/输出分层）
- 调度和部署是可替换层，不应先成为决策阻塞
- 先验证价值，再决定是否做“跨领域信息中心”或迁移到技能平台

## 方案定位（按角色）

| 方案 | 定位 | 何时选用 |
|------|------|---------|
| A. GitHub Actions | 默认起步 | 立刻验证可行性 |
| B. Supabase + Actions | 默认升级 | 需要历史数据和运行追踪 |
| C. n8n | 可视化编排 | 非工程同学要频繁改流程 |
| D. Cloudflare Workers | 轻量边缘 | 你愿意改写运行时并接受平台约束 |
| E. Make | 纯 GUI | 非技术快速试错（但有订阅成本） |
| F. VPS + Docker | 自控基础设施 | 多项目共用、需要完整主机控制 |

## 决策顺序（避免过度架构）

1. 先回答：内容是否值得看、值得持续收。
2. 再回答：是否需要历史沉淀与统计分析。
3. 最后回答：是否需要平台化（多领域、多租户、可视化后台）。

## 详细文档

- [方案 A — GitHub Actions](./plan-a-github-actions.md)
- [方案 B — Supabase + GitHub Actions](./plan-b-supabase.md)
- [方案 C — n8n](./plan-c-n8n.md)
- [方案 D — Cloudflare Workers](./plan-d-cloudflare-workers.md)
- [方案 E — Make (Integromat)](./plan-e-make.md)
- [方案 F — VPS + Docker](./plan-f-vps-docker.md)
