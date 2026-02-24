# 方案 C：n8n（可视化工作流）

> 零代码，拖拽构建完整管道。自托管免费，云版 $20/月。

## 架构

```
n8n Workflow (cron 触发)
  │
  ├─ [Schedule Trigger] 每 6 小时
  │
  ├─ [HTTP Request] × 7
  │   HN Algolia API 搜索 AI 关键词
  │
  ├─ [Code Node]
  │   合并 + URL hash 去重
  │
  ├─ [AI Agent / HTTP Request]
  │   调用 DeepSeek API 筛选 + 摘要
  │
  ├─ [Code Node]
  │   解析 JSON，格式化 Markdown
  │
  └─ [Discord Node]
      Webhook 推送
```

## 成本

| 部署方式 | 费用 |
|---------|------|
| 自托管（Docker） | 免费 + VPS 费用 |
| n8n Cloud Starter | $20/月 |
| AI API | ~$0.5/月 |

## 实施步骤

### 方式一：n8n Cloud（最快）

1. 注册 [n8n.io](https://n8n.io)，创建实例
2. 导入下面的 workflow JSON（或手动拖拽搭建）
3. 配置 Credentials：DeepSeek API Key
4. 设置 Discord Webhook URL
5. 激活 workflow

### 方式二：自托管（免费）

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

打开 `http://localhost:5678`，手动搭建 workflow。

### Workflow 搭建步骤

#### 1. Schedule Trigger
- 类型：Cron
- 表达式：`0 */6 * * *`

#### 2. HTTP Request × 7（并行）
- Method: GET
- URL: `https://hn.algolia.com/api/v1/search`
- Query Parameters:
  - `query`: AI / LLM / GPT / machine learning / deep learning / Claude / neural network
  - `tags`: story
  - `numericFilters`: `created_at_i>{{$now.minus(24, 'hours').toUnixInteger()}}`
  - `hitsPerPage`: 50

#### 3. Code Node（去重）
```javascript
// 合并所有 HTTP 请求的结果，按 objectID 去重
const allHits = new Map();
for (const item of $input.all()) {
  for (const hit of item.json.hits) {
    if (hit.url && !allHits.has(hit.objectID)) {
      allHits.set(hit.objectID, {
        title: hit.title,
        url: hit.url,
        points: hit.points,
        comments: hit.num_comments,
      });
    }
  }
}

return [...allHits.values()].map(h => ({ json: h }));
```

#### 4. HTTP Request（AI 筛选）
- Method: POST
- URL: `https://api.deepseek.com/chat/completions`
- Headers: `Authorization: Bearer {{$credentials.deepseekApi.apiKey}}`
- Body: 构建 prompt（同现有 prompts.ts 的逻辑）

#### 5. Code Node（解析 + 格式化）
```javascript
// 解析 AI JSON 响应，格式化为 Discord Markdown
const content = JSON.parse($input.first().json.choices[0].message.content);
const lines = [`## 🤖 AI 资讯日报 — ${new Date().toISOString().slice(0,10)}\n`];

for (const item of content) {
  const tags = item.tags.map(t => `\`${t}\``).join(' ');
  lines.push(`**${item.index}. ${item.title}** ${tags}`);
  lines.push(`> ${item.summary}\n`);
}

return [{ json: { content: lines.join('\n') } }];
```

#### 6. Discord Node
- Webhook URL: 你的 Discord Webhook
- Content: `{{ $json.content }}`

## 优点

- 可视化编排，流程一目了然
- 修改不用写代码，拖拽即可
- 内置 200+ 集成节点（邮件、Slack、Telegram 等随时加）
- 执行历史可视化查看
- 自托管版本无限制

## 局限

- 自托管需要一台服务器
- 云版 $20/月 对个人项目偏贵
- Code Node 里的逻辑不如纯代码灵活
- 没有内置数据库（去重需额外接 Supabase/PostgreSQL 节点）
- prompt 调试不如 IDE 方便
