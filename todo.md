# Todo

> 更新于 2026-03-08

## 当前状态
- 分支：`main`
- 未提交变更：有（当前在统一文档口径）
- 最近完成：方案文档重构为“两阶段主线”（验证期 → 扩展期）

## 进行中
- [ ] Phase 1 端到端验证：配置 `.env`（`AI_API_KEY` + `DISCORD_WEBHOOK_URL`），运行 `npm run run-once`，确认 HN 抓取 → AI 筛选 → Discord 推送完整闭环
- [ ] 确认 GitHub Actions 定时 workflow 落地（每 6 小时）

## 下次要做
- [ ] 若验证通过，接入 Supabase（`DATABASE_URL`）以获得历史数据和运行追踪
- [ ] 根据需要启用 Product Hunt 源（`PRODUCTHUNT_API_TOKEN`）
- [ ] 根据需要启用企业微信输出（`WECHAT_WORK_WEBHOOK_URL`）
- [ ] 评估是否追加“跨运行去重推送”逻辑（当前默认仅运行内去重）

## 备忘
- 当前默认口径：先验证价值，再平台化
- 当前代码能力：可插拔源/输出 + 可选 DB；默认可无 DB 运行
- `AI_API_KEY` 为统一凭证命名，兼容 DeepSeek / OpenAI / 其他 OpenAI 兼容接口
