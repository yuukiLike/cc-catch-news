# AI 提供商无缝替换策略

## 核心思路

将 AI 调用抽象为统一接口，切换模型只改配置，不改工作流。

## 方案一：OpenAI 兼容接口（推荐）

目前主流 AI 都提供或兼容 OpenAI 的 `/v1/chat/completions` 格式：

| 提供商 | 兼容方式 |
|--------|---------|
| Claude | 通过 OpenAI 兼容端点 或 OpenRouter |
| GPT | 原生 |
| Gemini | 通过 OpenRouter / LiteLLM |
| DeepSeek | 原生兼容 OpenAI 格式 |
| 本地模型 | Ollama / vLLM 均提供兼容接口 |

在 n8n 中只需将以下三个值设为环境变量：

```env
AI_BASE_URL=https://api.anthropic.com/v1   # 切换时改这里
AI_API_KEY=sk-xxx                           # 切换时改这里
AI_MODEL=claude-sonnet-4-20250514             # 切换时改这里
```

切换 AI 只改这三个值，workflow 和 prompt 完全不用动。

## 方案二：代理网关（多模型 / 高可用场景）

在 n8n 和 AI 之间加一层代理：

```
n8n  →  LiteLLM / OpenRouter  →  Claude / GPT / DeepSeek / ...
```

| 网关 | 类型 | 适用场景 |
|------|------|---------|
| **OpenRouter** | SaaS | 一个 Key 调所有模型，按量付费，零运维 |
| **LiteLLM** | 开源自托管 | 完全掌控，支持 fallback、负载均衡、成本追踪 |

### LiteLLM 配置示例

```yaml
model_list:
  - model_name: default
    litellm_params:
      model: claude-sonnet-4-20250514
      api_key: sk-ant-xxx
  - model_name: default
    litellm_params:
      model: deepseek-chat
      api_key: sk-ds-xxx

router_settings:
  fallbacks: [{ "default": ["default"] }]
```

这样主模型挂了会自动 fallback 到备选模型。

## 建议

| 阶段 | 方案 |
|------|------|
| 起步 | 直接用 OpenAI 兼容格式 + 环境变量，够用 |
| 多项目 / 多模型 | 上 LiteLLM 或 OpenRouter 做统一网关 |
