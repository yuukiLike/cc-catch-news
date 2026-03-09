# Warp OZ Prompt - Empty Repo MVP

把下面整段复制给 Warp OZ 执行。

```md
你是一个在 GitHub 空仓库内自主执行的工程 Agent。请从 0 到 1 搭建“AI 资讯最小 MVP”，目标是验证可行性，不做平台化设计。

# 目标
每 6 小时自动执行一次：
1. 抓取 Hacker News（Algolia API）最近 24h 的 AI 相关内容
2. 用 OpenAI 兼容接口做筛选和中文摘要
3. 推送到 Discord Webhook

# 约束
1. 最小实现，不引入 Supabase/VPS/n8n/Workers/Make。
2. 变量统一用：AI_API_KEY、DISCORD_WEBHOOK_URL。
3. 可选变量：AI_BASE_URL（默认 https://api.deepseek.com）、AI_MODEL（默认 deepseek-chat）、TOP_N（默认 10）。
4. 优先保证可运行和可维护，不做过度抽象。

# 你需要完成的工作
1. 初始化 Node.js + TypeScript 项目（Node 22）。
2. 安装依赖：dotenv、zod、openai、tsx、typescript。
3. 创建最小目录结构：
   - src/config.ts
   - src/sources/hackernews.ts
   - src/ai.ts
   - src/outputs/discord.ts
   - src/index.ts
4. 实现逻辑：
   - 从 HN Algolia 按关键词抓取（AI/LLM/GPT/machine learning/deep learning/neural network）
   - 去重（按 URL）
   - 构建 prompt，请 AI 返回 JSON 数组（title/summary/score/tags/index）
   - 格式化 Markdown 并发到 Discord Webhook
5. package.json 脚本至少包含：
   - run-once
   - typecheck
   - build
6. 生成 .env.example（含全部变量示例）。
7. 创建 GitHub Actions：
   - 文件：.github/workflows/catch-news.yml
   - schedule: '0 */6 * * *'
   - workflow_dispatch
   - npm ci && npm run run-once
   - 使用 secrets: AI_API_KEY、DISCORD_WEBHOOK_URL
8. 创建 README.md，写清：
   - 项目用途
   - 本地运行步骤
   - GitHub Secrets 配置
   - 手动触发 workflow 方法
9. 运行 npm run typecheck，修复错误直到通过。
10. 提交代码到仓库默认分支；如果流程支持 PR，则创建 PR 并附变更说明。

# 验收标准（DoD）
1. 仓库可直接 npm install 后执行 npm run run-once（在配置好 .env 的前提下）。
2. workflow 文件存在且语法正确。
3. 使用的是 AI_API_KEY / DISCORD_WEBHOOK_URL（不是其他旧命名）。
4. typecheck 通过。
5. README 足够让他人 10 分钟内跑起来。

# 输出要求
执行结束后输出：
1. 变更摘要（3-6 条）
2. 文件清单
3. typecheck 结果
4. workflow 关键配置
5. 下一步建议（最多 3 条）
```
