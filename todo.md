# cc-catch-news Todo

## 当前状态

- 分支: `main`
- Phase 1 代码骨架已完成，尚未提交
- 未本地验证端到端流程

## 待提交

- 整个 `src/` 目录、package.json、tsconfig.json、Dockerfile、docker-compose.yml 等

## 下一步

### Phase 1: 本地验证
- [ ] 提交当前代码
- [ ] 配置 `.env`（ANTHROPIC_API_KEY + DISCORD_WEBHOOK_URL）
- [ ] `npm run run-once` 跑通端到端流程
- [ ] 确认 Discord 收到消息

### Phase 2: 持久化 + 定时调度
- [ ] 服务器选型（日本节点，需同时跑 OpenClaw）
- [ ] `docker compose up` 验证 PostgreSQL + 应用
- [ ] Drizzle 迁移跑通
- [ ] 确认 6h 定时调度正常工作

### Phase 3: 扩展插件
- [ ] 实现 Product Hunt source（需申请 API token）
- [ ] 实现企业微信 output
- [ ] 验证添加插件不改 pipeline.ts

## 待决策

- 服务器厂商选型：Vultr / Linode / AWS Lightsail / 搬瓦工
- OpenClaw 和 cc-catch-news 是否共用一个 PostgreSQL 实例
