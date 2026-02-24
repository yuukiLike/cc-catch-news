# 方案 F：VPS + Docker（完整自控）

> 原始设计方案。完整控制，适合多项目共用一台服务器。

## 架构

```
VPS (Tokyo)
  └─ Docker Compose
       ├─ PostgreSQL 16 (数据持久化)
       └─ cc-catch-news (Node.js)
            ├─ node-cron 定时调度
            ├─ HN 抓取
            ├─ AI 筛选 (DeepSeek)
            ├─ DB 读写 (Drizzle ORM)
            └─ Discord 推送
```

## 成本

| 项目 | 费用 |
|------|------|
| VPS (2C2G, Tokyo) | $5-12/月 |
| AI API | ~$0.5/月 |
| **合计** | **$5.5-12.5/月** |

### VPS 供应商推荐

| 供应商 | 配置 | 价格 | 特点 |
|--------|------|------|------|
| Vultr Tokyo | 1C1G | $6/月 | 灵活，按小时计费 |
| Linode Tokyo | 1C1G | $5/月 | 稳定 |
| AWS Lightsail Tokyo | 1C1G | $5/月 | 3 个月免费试用 |
| 搬瓦工 CN2 GIA | 1C1G | $50/年 | CN2 线路，国内访问快 |

## 实施步骤

### 1. 购买并初始化 VPS

```bash
# SSH 登录后
apt update && apt upgrade -y
apt install docker.io docker-compose-v2 -y
systemctl enable docker
```

### 2. 部署项目

```bash
git clone <repo-url> /opt/cc-catch-news
cd /opt/cc-catch-news
cp .env.example .env
# 编辑 .env 填入 API Key、Webhook URL、DATABASE_URL
```

### 3. 启动服务

```bash
docker compose up -d
```

这会启动：
- PostgreSQL 16（带健康检查）
- 应用容器（等 PG 就绪后自动启动）

### 4. 初始化数据库

```bash
# 进入容器执行迁移
docker compose exec app npm run db:migrate
```

### 5. 验证

```bash
# 查看日志
docker compose logs -f app

# 手动触发一次
docker compose exec app node dist/index.js --once
```

### 6. 日常维护

```bash
# 更新代码
cd /opt/cc-catch-news
git pull
docker compose build app
docker compose up -d app

# 查看状态
docker compose ps

# 查看数据库
docker compose exec postgres psql -U catchnews -c "SELECT * FROM runs ORDER BY id DESC LIMIT 5;"
```

## 优点

- 完整控制，想改什么改什么
- 数据库本地化，查询快
- 可以跑多个项目共用服务器
- node-cron 精准调度，无延迟
- 支持所有功能：去重、历史、Product Hunt、企业微信

## 局限

- 需要维护服务器（安全更新、磁盘监控等）
- 每月固定开销 $5-12
- Docker 构建 + 部署有一定复杂度
- 服务器宕机期间会错过调度
- 需要自己做备份
