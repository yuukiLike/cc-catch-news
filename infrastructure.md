# 基础设施与硬件需求

## 你需要一台海外服务器吗？

**需要。** 原因：

1. **网络可达性** — Hacker News、Product Hunt、Discord、Claude API 在国内直连不稳定或不可达
2. **定时任务稳定性** — n8n 需要 7×24 运行，本地电脑不适合
3. **多项目复用** — 一台服务器可以跑 n8n、LiteLLM、以及你其他项目的后端服务

## 为什么选日本服务器

| 优势 | 说明 |
|------|------|
| 低延迟 | 从中国大陆访问延迟通常 30-80ms，体验好 |
| 线路质量 | 主流厂商日本节点对中国优化较好（软银/NTT 线路） |
| 合规中性 | 相比美国节点，日本节点访问中国和海外服务都比较均衡 |
| 推送微信 | 企业微信 Webhook 在日本服务器上调用没有问题 |

## 推荐配置

### 最低配置（仅跑 cc-catch-news）

| 项目 | 规格 |
|------|------|
| CPU | 1 vCPU |
| 内存 | 1 GB |
| 硬盘 | 20 GB SSD |
| 带宽 | 500 GB/月 |
| 预算 | ~$5-10/月 |

### 推荐配置（多项目共用）

| 项目 | 规格 |
|------|------|
| CPU | 2 vCPU |
| 内存 | 4 GB |
| 硬盘 | 40-80 GB SSD |
| 带宽 | 1-2 TB/月 |
| 预算 | ~$15-30/月 |

> 4 GB 内存可以同时跑 n8n + LiteLLM + PostgreSQL + 2-3 个轻量服务，留有余量。

## VPS 厂商参考

| 厂商 | 日本节点 | 特点 |
|------|---------|------|
| **Vultr** | 东京 | 按小时计费，灵活，$6/月起 |
| **DigitalOcean** | 无日本（新加坡替代） | 稳定，$6/月起 |
| **Bandwagon (搬瓦工)** | 东京/大阪 | CN2 GIA 线路对中国优化好，稍贵 |
| **Linode (Akamai)** | 东京 | 稳定，$5/月起 |
| **RackNerd** | 无日本（洛杉矶替代） | 便宜，年付 $10-20 |
| **AWS Lightsail** | 东京 | $5/月起，3 个月免费 |

### 选择建议

- **追求对中国线路质量** → 搬瓦工 CN2 GIA 或 Vultr 东京
- **追求性价比** → Vultr / Linode 东京
- **已有 AWS 账号** → Lightsail 东京，可免费试用

## 服务器上需要安装的软件

```bash
# 基础环境
Docker + Docker Compose    # 所有服务容器化部署

# 核心服务
n8n                        # 工作流引擎
PostgreSQL                 # n8n 数据存储（替代默认 SQLite，更稳定）

# 可选
LiteLLM                   # AI 网关（多项目/多模型时）
Nginx Proxy Manager        # 反向代理 + 自动 HTTPS
Watchtower                 # Docker 镜像自动更新
```

## Docker Compose 快速启动示例

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
      - AI_BASE_URL=https://api.anthropic.com/v1
      - AI_API_KEY=${AI_API_KEY}
      - AI_MODEL=claude-sonnet-4-20250514
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

| 你的情况 | 建议 |
|---------|------|
| 只跑 cc-catch-news | Vultr/Linode 东京 1C1G，$5-6/月 |
| 多项目共用 | Vultr/搬瓦工 东京 2C4G，$15-30/月 |
| 想省事不折腾 | n8n Cloud ($20/月) + 不需要自己的服务器 |
