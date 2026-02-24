# Todo

> 更新于 2026-02-20

## 当前状态
- 分支：`main`
- 未提交变更：无
- 最近完成：Phase 1 代码骨架（可插拔管道架构、HN 源、Discord 输出、Claude AI 筛选、DB 层）

## 进行中
- [ ] Phase 1 端到端验证：代码已写完并通过 tsc 类型检查，但尚未实际运行。需要配置 `.env`（填入 ANTHROPIC_API_KEY + DISCORD_WEBHOOK_URL），然后 `npm run run-once` 验证 HN 抓取 → Claude 筛选 → Discord 推送的完整流程

## 下次要做
- [ ] 本地跑通 `npm run run-once`，确认 Discord 收到 AI 资讯摘要
- [ ] 选定日本服务器厂商（需同时跑 cc-catch-news 和 OpenClaw，建议 2C2G 起步）
- [ ] 服务器初始化：Docker + Docker Compose 环境搭建
- [ ] `docker compose up` 验证 PostgreSQL + 应用完整部署
- [ ] Drizzle 迁移跑通（`npm run db:generate && npm run db:migrate`）
- [ ] 验证 6h 定时调度正常触发

## 备忘
- 服务器选型待决策：Vultr 东京 / Linode 东京 / AWS Lightsail 东京 / 搬瓦工 CN2 GIA。2C2G ~$10-12/月，两个项目共用
- OpenClaw 项目需求尚未明确，确认后再决定是否与 cc-catch-news 共用 PostgreSQL 实例
- Product Hunt 源需要申请 API token（PH 开发者面板），当前代码已实现但无 token 时自动禁用
- 企业微信输出已实现，设置 WECHAT_WORK_WEBHOOK_URL 即可启用
- 架构设计核心：添加新源/输出只需"一个文件 + 注册表加一行"，pipeline.ts 零改动
