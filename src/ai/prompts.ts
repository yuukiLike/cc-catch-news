import type { RawArticle } from "../sources/types.js";

export function buildFilterPrompt(articles: RawArticle[], topN: number): string {
  const articleList = articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title}\n    URL: ${a.url}\n    Source: ${a.sourceName} | Score: ${a.score ?? "N/A"} | Comments: ${a.commentCount ?? "N/A"}`,
    )
    .join("\n\n");

  return `你是一个 AI/科技领域资讯编辑。请从以下文章列表中：

1. **筛选**出与 AI/ML/LLM/深度学习/大模型/机器人/自动化 相关的条目
2. 对每条内容生成一句话**中文摘要**（20-50字）
3. 给每条内容打**相关性评分**（1-10，10 = 纯 AI 核心内容）
4. 给每条内容打上**标签**（如：LLM、CV、机器人、AI 应用、开源、论文、产品、融资等）
5. 按评分从高到低排序，保留 **Top ${topN}**

文章列表：
${articleList}

请严格按以下 JSON 格式输出，不要包含其他文字：
\`\`\`json
[
  {
    "index": 1,
    "title": "原始标题",
    "score": 9,
    "summary": "一句话中文摘要",
    "tags": ["LLM", "开源"]
  }
]
\`\`\`

注意：
- index 是上面列表中的编号
- 只返回 JSON 数组，不要多余解释
- 如果没有 AI 相关内容，返回空数组 []`;
}
