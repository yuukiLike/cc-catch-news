# Warp OZ 执行 Prompt（最小 MVP）

你是一个在 GitHub 仓库内自主执行任务的工程 Agent。请在**最小变更**前提下实现本项目的 Phase 1 MVP。

## 背景与目标

目标是验证这件事是否可行，而不是先做完整平台。

MVP 主线：
- GitHub Actions 定时触发（每 6 小时）
- 运行现有 Node pipeline（`npm run run-once`）
- 抓取 HN 内容 + AI 筛选摘要 + 推送 Discord

## 必须遵守的约束

1. 不新增 VPS、Supabase、n8n、Make、Workers 等基础设施。
2. 不做架构重构，不改核心业务逻辑（`src/` 尽量不动）。
3. 使用当前统一环境变量命名：`AI_API_KEY`、`DISCORD_WEBHOOK_URL`。
4. 本阶段默认无数据库（不要求 `DATABASE_URL`）。
5. 变更保持最小，优先只改 CI/workflow 与必要文档。

## 执行任务

### 任务 1：检查现状

- 确认项目脚本存在：
  - `npm run run-once`
  - `npm run typecheck`
- 检查是否已有 `.github/workflows/catch-news.yml`。

### 任务 2：实现/修正 GitHub Actions workflow

如果不存在则创建；如果存在则修正为以下要求：

- 文件：`.github/workflows/catch-news.yml`
- 触发：
  - `schedule: '0 */6 * * *'`
  - `workflow_dispatch`
- 运行环境：`ubuntu-latest`
- Node 版本：`22`
- 步骤：
  1. checkout
  2. setup-node（含 npm cache）
  3. `npm ci`
  4. `npm run run-once`
- 在 `run-once` 步骤注入 env：
  - `AI_API_KEY: ${{ secrets.AI_API_KEY }}`
  - `DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}`

### 任务 3：最小文档补充

新增或更新一个短文档（推荐 `docs/mvp-runbook.md`），内容包含：

- 该 MVP 的目标与边界（仅验证，不平台化）
- 需要配置的 GitHub Secrets：`AI_API_KEY`、`DISCORD_WEBHOOK_URL`
- 手动触发验证步骤（Actions 页面 `workflow_dispatch`）
- 成功标准：Discord 收到摘要消息

### 任务 4：本地可执行校验

在仓库内运行：

```bash
npm run typecheck
```

- 若失败，修复与本次改动相关的问题。
- 不要求执行真实推送（因为 CI secrets 在本地不可用）。

### 任务 5：提交与 PR

- 创建分支（如未在 feature 分支）：`feat/mvp-github-actions`
- 提交信息建议：`ci: add scheduled workflow for phase-1 mvp`
- 发起 PR，并在 PR 描述中包含：
  - 变更文件列表
  - 为什么这是最小 MVP
  - 如何配置 secrets
  - 如何手动验证

## 验收标准（DoD）

满足以下全部条件才算完成：

1. 仓库中存在可用的 `.github/workflows/catch-news.yml`。
2. workflow 使用 `AI_API_KEY` / `DISCORD_WEBHOOK_URL`（不是旧命名）。
3. 文档明确这是 Phase 1 MVP，且说明配置与验证步骤。
4. `npm run typecheck` 通过。
5. PR 已创建，并包含清晰的验证说明。

## 输出格式要求

执行完成后，请输出：

1. 变更摘要（3-6 条）
2. 修改文件清单
3. 验证结果（命令 + 结果）
4. PR 链接
5. 若有阻塞项，明确列出阻塞原因和下一步建议
