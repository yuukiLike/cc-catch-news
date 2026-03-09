# AI 提供商无缝替换策略

## 核心思路

将 AI 调用抽象为统一配置：切换模型只改环境变量，不改 pipeline。

## 方案一：OpenAI 兼容接口（推荐）

主流服务都可通过 OpenAI 兼容的 `/v1/chat/completions` 使用：

| 提供商 | 兼容方式 |
|--------|---------|
| DeepSeek | 原生兼容 |
| OpenAI | 原生 |
| Claude | 可通过兼容端点或 OpenRouter |
| Gemini | 可通过 OpenRouter / LiteLLM |
| 本地模型 | Ollama / vLLM 兼容接口 |

统一环境变量：

```env
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=sk-xxx
AI_MODEL=deepseek-chat
```

只需要替换以上 3 项即可切换提供商。

## 方案二：代理网关（多模型 / 高可用）

```
pipeline  →  LiteLLM / OpenRouter  →  多家 AI 提供商
```

| 网关 | 类型 | 适用场景 |
|------|------|---------|
| OpenRouter | SaaS | 单 Key 多模型，零运维 |
| LiteLLM | 开源自托管 | 完全可控，支持 fallback、路由、成本追踪 |

### LiteLLM 示例

```yaml
model_list:
  - model_name: primary
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: sk-ds-xxx
  - model_name: backup
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: sk-openai-xxx

router_settings:
  fallbacks:
    - { "primary": ["backup"] }
```

## 建议

| 阶段 | 方案 |
|------|------|
| 起步 | 直接用 OpenAI 兼容格式 + 环境变量 |
| 扩展 | 用 LiteLLM / OpenRouter 管理多模型与兜底 |
