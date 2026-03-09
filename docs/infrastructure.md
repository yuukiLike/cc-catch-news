# 基础设施与硬件需求

## 你一定需要海外服务器吗？

不一定，取决于阶段。

- **验证期（推荐）**：不需要自有服务器，直接用 GitHub Actions 定时运行
- **扩展期**：如果你要多项目共用、长驻服务、自定义运维，再考虑 VPS

## 为什么仍可能选择海外节点

1. 网络可达性：Hacker News、Product Hunt、Discord、主流 AI API 在国内直连可能不稳定
2. 稳定性：长驻任务（n8n / 自托管服务）需要 7×24 在线
3. 复用性：一台主机可承载多个小项目

## 推荐配置

### 仅跑 cc-catch-news（自托管）

| 项目 | 规格 |
|------|------|
| CPU | 1 vCPU |
| 内存 | 1 GB |
| 硬盘 | 20 GB SSD |
| 带宽 | 500 GB/月 |
| 预算 | ~$5-10/月 |

### 多项目共用

| 项目 | 规格 |
|------|------|
| CPU | 2 vCPU |
| 内存 | 4 GB |
| 硬盘 | 40-80 GB SSD |
| 带宽 | 1-2 TB/月 |
| 预算 | ~$15-30/月 |

## VPS 厂商参考

| 厂商 | 日本节点 | 特点 |
|------|---------|------|
| Vultr | 东京 | 灵活，按小时计费 |
| Linode | 东京 | 稳定，价格友好 |
| AWS Lightsail | 东京 | 入门成本低，可试用 |
| Bandwagon | 东京/大阪 | 对中国线路友好 |

## 自托管常见组件

```bash
# 基础
Docker + Docker Compose

# 可选
n8n                 # 可视化工作流
PostgreSQL          # 持久化
LiteLLM             # 多模型网关
Nginx Proxy Manager # HTTPS 与反代
```

## Docker Compose 示例（n8n + PostgreSQL）

```yaml
version: "3.8"
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-password
      - AI_BASE_URL=https://api.deepseek.com
      - AI_API_KEY=${AI_API_KEY}
      - AI_MODEL=deepseek-chat
    volumes:
      - n8n_data:/home/node/.n8n

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=your-db-password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

## 总结

| 你的阶段 | 建议 |
|---------|------|
| 验证期 | 优先 GitHub Actions，无需自有服务器 |
| 扩展期 | 加 Supabase 或自托管 PostgreSQL |
| 平台化 | 再评估 VPS + n8n / LiteLLM |
