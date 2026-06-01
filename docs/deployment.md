# TradePilot 部署指南

## 目标服务器：Ubuntu 22.04 + Docker 26 (4核 4GB 3Mbps 40GB)

---

## 一、部署架构

### 无 HTTPS（最简部署）

```
用户浏览器
    │
    ▼
 Docker web 容器 :80  (Nginx + React)
    │
    ├── /          → React SPA 静态文件 (gzip 压缩)
    └── /api/*     → 反向代理到 api 容器 :4100
                         │
                         ▼
                    PostgreSQL 16 (postgres 容器 :5432)
```

仅 web 容器暴露 80 端口对外。

### 配置 HTTPS 后

```
用户浏览器 (HTTPS)
    │
    ▼
 Caddy (:80/:443, 宿主机)
    │
    ▼
 Docker web 容器 127.0.0.1:8080  (不对外暴露)
    │
    ├── /          → React SPA 静态文件
    └── /api/*     → 反向代理到 api 容器 :4100
                         │
                         ▼
                    PostgreSQL 16 (postgres 容器 :5432)
```

Caddy 接管 80/443 端口，Docker 容器仅绑定 `127.0.0.1:8080`，两者不再冲突。

---

## 二、服务器初始化

### 2.1 更新系统

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git openssl
```

### 2.2 确认 Docker 版本

```bash
docker --version          # 应为 Docker 26.x
docker compose version    # 确认 compose 插件可用
```

### 2.3 配置防火墙

> **关键顺序：先放行 SSH，再启用 ufw，否则会立即断开连接！**

```bash
# 第 1 步：先放行 SSH（必须放在 enable 之前！）
sudo ufw allow 22/tcp
sudo ufw limit 22/tcp

# 第 2 步：放行 Web 端口
# 如果暂时不用 HTTPS，只放行 80
sudo ufw allow 80/tcp

# 如果后续配置 HTTPS，还需要放行 443
sudo ufw allow 443/tcp

# 第 3 步：所有规则就绪后，再启用 ufw
sudo ufw --force enable

# 第 4 步：确认规则生效
sudo ufw status verbose
```

> **云服务器用户特别注意**：除了服务器内部的 ufw/iptables，云厂商（阿里云、腾讯云、AWS 等）还有一层**安全组/防火墙**，也需要放行端口，否则即使 ufw 配置正确也无法访问。
>
> 登录云厂商控制台 → 安全组规则 → 入方向，添加：
> ```
> 协议: TCP    端口: 22     来源: 你的IP/32（推荐）或 0.0.0.0/0
> 协议: TCP    端口: 80     来源: 0.0.0.0/0
> 协议: TCP    端口: 443    来源: 0.0.0.0/0
> ```
>
> 两层防火墙（安全组 + ufw）都要放行，缺一不可。

### 2.4 系统优化

```bash
# 降低 swappiness，减少磁盘 IO（4GB 内存场景）
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf

# 提高文件描述符限制
echo "fs.file-max=65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 三、环境变量说明

部署前需要配置 `.env.production`，以下是所有变量的完整说明：

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DB_PASSWORD` | **是** | - | PostgreSQL 密码 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥 |
| `EMAIL_SECRET_KEY` | **是** | - | 邮箱授权码加密密钥 |
| `JWT_EXPIRES_IN` | 否 | `7d` | JWT 过期时间 |
| `WEB_BIND` | 否 | `0.0.0.0` | Web 宿主机绑定地址。HTTP 直连模式使用 `0.0.0.0`；HTTPS/Caddy 模式使用 `127.0.0.1`，避免 Docker web 直接对外暴露 |
| `WEB_PORT` | 否 | `80` | Web 宿主机映射端口。HTTP 直连模式使用 `80`；HTTPS/Caddy 模式使用 `8080`，由 Caddy 反向代理到 `127.0.0.1:8080` |
| `CORS_ORIGIN` | 否 | `http://localhost` | CORS 来源，部署到服务器后改为实际地址 |
| `APP_TIMEZONE` | 否 | `Asia/Shanghai` | 应用时区，用于邮件同步等定时任务 |
| `PORT` | 否 | `4100` | API 内部端口，通常无需修改 |

生成安全密钥：

```bash
echo "JWT_SECRET:       $(openssl rand -hex 32)"
echo "EMAIL_SECRET_KEY: $(openssl rand -hex 32)"
echo "DB_PASSWORD:      $(openssl rand -hex 16)"
```

---

## 四、部署步骤

### 4.1 上传项目

```bash
cd /opt
git clone <你的仓库地址> tradepilot
cd tradepilot
```

### 4.2 配置环境变量

```bash
cp .env.production.example .env.production
nano .env.production
```

**至少修改以下三项：**

```ini
DB_PASSWORD=<用 openssl rand -hex 16 生成>
JWT_SECRET=<用 openssl rand -hex 32 生成>
EMAIL_SECRET_KEY=<用 openssl rand -hex 32 生成>
CORS_ORIGIN=http://你的服务器IP    # 暂用 http，配置 HTTPS 后改为 https://你的域名
```

### 4.3 选择部署模式

#### 模式 A：无 HTTPS（快速验证）

如果暂时不用 Caddy/HTTPS，直接通过服务器 IP 访问前端，在 `.env.production` 中配置：

```ini
WEB_BIND=0.0.0.0
WEB_PORT=80
```

然后执行：

```bash
chmod +x deploy.sh
./deploy.sh
```

访问 `http://服务器IP`。

#### 模式 B：配置 HTTPS（推荐，使用 Caddy）

使用 Caddy 代理 HTTPS 时，让 Docker web 只监听宿主机本地地址，在 `.env.production` 中配置：

```ini
WEB_BIND=127.0.0.1
WEB_PORT=8080
```

> **前提条件**：你需要一个域名，并且已将域名的 A 记录解析到服务器 IP。
>
> 在域名 DNS 管理后台添加一条 A 记录：
> ```
> 类型: A    主机记录: @（或 your-domain.com）    记录值: 你的服务器IP
> ```
>
> 添加后等待 DNS 生效（通常几分钟，最长 48 小时），用 `ping your-domain.com` 确认已解析到正确 IP 后再继续。

**步骤 1：安装 Caddy**

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

**步骤 2：配置 Caddyfile**

```bash
sudo nano /etc/caddy/Caddyfile
```

写入（替换 `your-domain.com` 为你的实际域名）：

```caddy
your-domain.com {
    reverse_proxy localhost:8080
}
```

**步骤 3：启动服务**

```bash
# 先确保 80/443 端口未被占用（Caddy 需要它们）
sudo systemctl stop nginx 2>/dev/null || true

# 启动 Caddy
sudo systemctl enable --now caddy

# 部署 TradePilot
./deploy.sh
```

**步骤 4：更新 CORS 配置**

HTTPS 生效后，修改 `.env.production` 中的 `CORS_ORIGIN`：

```ini
CORS_ORIGIN=https://your-domain.com
```

然后重启 API：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d api
```

### 4.4 手动部署（不使用脚本时）

`api` 容器启动时会先执行 `prisma migrate deploy`，确保数据库表结构和当前代码匹配；下面的手动迁移命令可作为部署后的显式校验。

```bash
# 1. 构建镜像
docker compose -f docker-compose.prod.yml --env-file .env.production build

# 2. 启动所有服务
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3. 等待数据库就绪后执行迁移
docker compose -f docker-compose.prod.yml exec -T api \
  sh -lc 'cd apps/api && ./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma'

# 4. 验证
docker compose -f docker-compose.prod.yml ps
```

---

## 五、验证部署

### 5.1 容器状态

```bash
docker compose -f docker-compose.prod.yml ps
# 三个容器都应显示 Up 且 healthy
```

### 5.2 API 健康检查

API 自身的健康端点是 `/health`：

```bash
# 容器内直连 API（路径是 /health，不是 /api/health）
docker compose -f docker-compose.prod.yml exec api wget -qO- http://127.0.0.1:4100/health
# → {"status":"ok"}
```

通过 nginx 代理访问时，`/api/` 前缀会被 nginx 剥离后转发给 API：

```bash
# 通过 nginx 代理（/api/health → API 的 /health）
curl http://localhost/api/health
# → {"status":"ok"}

# 如果用 Caddy + HTTPS：
curl https://your-domain.com/api/health
```

> **路径总结**：API 直接暴露的是 `/health`，对外通过 nginx 代理后变为 `/api/health`。

### 5.3 前端可访问性

```bash
# 直连 Docker（模式 A）
curl -I http://localhost/

# 通过 Caddy（模式 B）
curl -I http://localhost:8080/
```

浏览器访问 `http://服务器IP`（模式 A）或 `https://你的域名`（模式 B）。

---

## 六、数据库备份

### 6.1 手动备份

```bash
# -T 参数必须加（禁用 pseudo-tty），否则在 cron 中会失败
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradepilot tradepilot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 6.2 自动备份（cron）

创建备份脚本：

```bash
sudo nano /opt/tradepilot/backup.sh
```

写入：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/tradepilot

BACKUP_DIR="/opt/tradepilot/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/tradepilot_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradepilot tradepilot | gzip > "${BACKUP_FILE}"

find "${BACKUP_DIR}" -name "tradepilot_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup completed: ${BACKUP_FILE} (size: $(du -h "${BACKUP_FILE}" | cut -f1))"
```

设置权限并添加 cron：

```bash
chmod +x /opt/tradepilot/backup.sh

# 每天凌晨 3:00 执行备份
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/tradepilot/backup.sh >> /opt/tradepilot/backups/backup.log 2>&1") | crontab -
```

### 6.3 下载备份到本地

> **重要**：备份存在服务器上，服务器故障时备份也会丢失。务必定期将备份下载到本地或其他机器。

```bash
# 在本地机器上执行，将服务器上的备份拉取到本地：
scp user@你的服务器IP:/opt/tradepilot/backups/tradepilot_*.sql.gz ./本地目录/

# 或者从服务器推送到其他存储（在服务器上执行）：
# 推送到另一台机器：
rsync -avz /opt/tradepilot/backups/ user@备份服务器:/backups/tradepilot/

# 或者上传到云存储（以 AWS S3 为例，需要先安装 awscli）：
# aws s3 sync /opt/tradepilot/backups/ s3://your-bucket/tradepilot-backups/
```

### 6.4 恢复备份

```bash
gunzip -c backups/tradepilot_20260531_030000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U tradepilot tradepilot
```

---

## 七、资源规划与限制

针对 4核 4GB 3Mbps 40GB 配置：

| 组件 | 内存预估 | 说明 |
|------|---------|------|
| PostgreSQL | ~256MB | Alpine 镜像 |
| NestJS API | ~150MB | Node.js 运行时 |
| Nginx + React | ~20MB | 静态文件服务 |
| Caddy | ~30MB | 宿主机进程（仅 HTTPS 模式） |
| Docker 开销 | ~200MB | 守护进程 |
| **合计** | **~700MB** | 剩余约 3.3GB 用于系统缓存和峰值 |

### 日志轮转（已内置）

`docker-compose.prod.yml` 中已配置 JSON file 日志驱动，单个日志文件最大 10MB，最多保留 3 个。

### 磁盘清理

```bash
# 定期清理 Docker 构建缓存
docker builder prune -f --keep-storage 5GB

# 查看磁盘占用
docker system df
```

### 内存限制

`docker-compose.prod.yml` 中已预留内存限制配置（当前为注释状态）。如果出现 OOM，可取消注释并调整数值。当前 4GB 主机建议暂时不开启，先观察实际使用情况。

### 带宽（3Mbps）

3Mbps 约 375KB/s。前端已配置 gzip 压缩（压缩率通常 60-80%），nginx 对静态资源设置了 1 年强缓存。首次加载约 500KB (gzip 后约 150KB)，后续访问命中缓存几乎不产生流量。

---

## 八、常用运维命令

```bash
# 查看服务状态（含健康检查）
docker compose -f docker-compose.prod.yml ps

# 查看实时日志
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f api

# 查看最近 100 行日志
docker compose -f docker-compose.prod.yml logs --tail=100

# 重启单个服务
docker compose -f docker-compose.prod.yml restart api

# 进入容器调试
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U tradepilot tradepilot

# 停止所有服务
docker compose -f docker-compose.prod.yml down

# 完全重置（删除数据卷，会丢失所有数据！）
docker compose -f docker-compose.prod.yml down -v
```

---

## 九、更新部署

```bash
cd /opt/tradepilot
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build --pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml exec -T api \
  sh -lc 'cd apps/api && ./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma'

# 清理旧镜像
docker image prune -f
```

---

## 十、故障排查

### 容器不健康 (unhealthy)

```bash
docker inspect tradepilot-api --format '{{json .State.Health}}' | python3 -m json.tool

# 手动测试 API 健康端点（直连 API 内部端口）
docker compose -f docker-compose.prod.yml exec api wget -qO- http://127.0.0.1:4100/health
```

### Caddy 启动失败（端口被占用）

```bash
# 检查是谁占用了 80/443
sudo lsof -i :80
sudo lsof -i :443

# 如果是 Docker 的 web 容器占用，检查 .env.production 中的 WEB_BIND/WEB_PORT：
# HTTP 直连：WEB_BIND=0.0.0.0 WEB_PORT=80
# HTTPS/Caddy：WEB_BIND=127.0.0.1 WEB_PORT=8080
grep -A2 "ports:" docker-compose.prod.yml

# 如果之前用 nginx 占用了 80：
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 数据库连接失败

```bash
docker compose -f docker-compose.prod.yml logs postgres
# 确认 DATABASE_URL 中 host 为 "postgres"（容器名，不是 localhost）
```

### Prisma 迁移失败（首次部署）

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d postgres
sleep 10
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec -T api \
  sh -lc 'cd apps/api && ./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma'
```

### 邮箱授权码解密失败

如果看到 `EMAIL_SECRET_KEY is not configured` 错误：
1. 确认 `.env.production` 中已设置 `EMAIL_SECRET_KEY`
2. 首次部署后去「系统设置」→「邮箱设置」重新保存授权码
3. **不要**在服务运行后更改 `EMAIL_SECRET_KEY`，否则之前加密的授权码将无法解密

### CORS 报错

前端控制台出现 CORS 错误时：
1. 确认 `CORS_ORIGIN` 包含完整的前端访问地址（含协议）
2. HTTP 模式：`CORS_ORIGIN=http://你的IP`
3. HTTPS 模式：`CORS_ORIGIN=https://你的域名`（注意是 `https://` 不是 `http://`）
4. 多个来源用逗号分隔：`CORS_ORIGIN=https://example.com,http://192.168.1.100:8080`
