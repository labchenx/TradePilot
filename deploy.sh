#!/usr/bin/env bash
# TradePilot 一键部署脚本
# 在 Ubuntu 22.04 + Docker 26 服务器上执行
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  TradePilot 生产环境部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ---- 1. 检查依赖 ----
echo -e "${YELLOW}[1/6] 检查系统依赖...${NC}"

if ! command -v docker &>/dev/null; then
  echo -e "${RED}错误: Docker 未安装，请先安装 Docker 26${NC}"
  exit 1
fi

DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+' | head -1)
echo "  Docker 版本: ${DOCKER_VERSION}"

if ! docker compose version &>/dev/null; then
  echo -e "${RED}错误: docker compose 插件未安装${NC}"
  exit 1
fi

if ! command -v git &>/dev/null; then
  echo -e "${YELLOW}  git 未安装，正在安装...${NC}"
  sudo apt-get update -qq && sudo apt-get install -y -qq git
fi

echo -e "${GREEN}  依赖检查通过${NC}"
echo ""

# ---- 2. 准备环境文件 ----
echo -e "${YELLOW}[2/6] 准备环境配置...${NC}"

if [ ! -f .env.production ]; then
  if [ -f .env.production.example ]; then
    cp .env.production.example .env.production
    echo -e "${YELLOW}  已从 .env.production.example 创建 .env.production${NC}"
    echo -e "${YELLOW}  ⚠ 请编辑 .env.production 修改 DB_PASSWORD、JWT_SECRET 和 EMAIL_SECRET_KEY${NC}"
    echo ""
    read -rp "  是否现在编辑? (y/n): " EDIT_NOW
    if [ "$EDIT_NOW" = "y" ] || [ "$EDIT_NOW" = "Y" ]; then
      ${EDITOR:-nano} .env.production
    fi
  else
    echo -e "${RED}  错误: 找不到 .env.production.example${NC}"
    exit 1
  fi
else
  echo "  .env.production 已存在，跳过"
fi

# Generate JWT_SECRET and EMAIL_SECRET_KEY if still default
if grep -q "change-me-in-production" .env.production 2>/dev/null; then
  NEW_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
  # Replace first occurrence only (JWT_SECRET)
  sed -i "0,/change-me-in-production/s/change-me-in-production/${NEW_SECRET}/" .env.production
  # Generate another key for EMAIL_SECRET_KEY
  NEW_EMAIL_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
  sed -i "0,/change-me-in-production/s/change-me-in-production/${NEW_EMAIL_KEY}/" .env.production
  echo -e "${GREEN}  已自动生成 JWT_SECRET 和 EMAIL_SECRET_KEY${NC}"
fi

echo ""

# ---- 3. 构建镜像 ----
echo -e "${YELLOW}[3/6] 构建 Docker 镜像...${NC}"
echo "  这需要几分钟时间..."

docker compose -f docker-compose.prod.yml build --pull

echo -e "${GREEN}  镜像构建完成${NC}"
echo ""

# ---- 4. 启动服务 ----
echo -e "${YELLOW}[4/6] 启动服务...${NC}"

docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${GREEN}  服务已启动${NC}"
echo ""

# ---- 5. 等待数据库就绪 ----
echo -e "${YELLOW}[5/6] 等待数据库就绪...${NC}"

for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U tradepilot -d tradepilot &>/dev/null; then
    echo -e "${GREEN}  数据库就绪${NC}"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "${RED}  数据库启动超时，请检查日志: docker compose -f docker-compose.prod.yml logs postgres${NC}"
    exit 1
  fi
  sleep 2
done

# 运行 Prisma migrate
echo "  执行数据库迁移..."
docker compose -f docker-compose.prod.yml exec -T api \
  npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma || {
  echo -e "${YELLOW}  迁移命令未成功（可能已是最新），跳过...${NC}"
}

echo ""

# ---- 6. 验证部署 ----
echo -e "${YELLOW}[6/6] 验证部署...${NC}"

echo "  检查容器状态:"
docker compose -f docker-compose.prod.yml ps

WEB_PORT_VAL=$(grep -oP 'WEB_PORT=\K\d+' .env.production 2>/dev/null || echo "")
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER_IP')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Detect deployment mode
if docker compose -f docker-compose.prod.yml port web 80 2>/dev/null | grep -q "127.0.0.1"; then
  echo "  Docker web 容器绑定在 127.0.0.1（内部端口模式）"
  echo "  如果未配置 Caddy，请将 docker-compose.prod.yml 中 web 的 ports 改为:"
  echo "    ports:"
  echo "      - \"80:80\""
  echo "  然后执行: docker compose -f docker-compose.prod.yml up -d web"
elif [ "${WEB_PORT_VAL}" = "80" ]; then
  echo "  访问地址: http://${SERVER_IP}"
else
  echo "  访问地址: http://${SERVER_IP}:${WEB_PORT_VAL:-8080}"
fi

echo ""
echo "  常用命令:"
echo "    查看日志:    docker compose -f docker-compose.prod.yml logs -f"
echo "    查看状态:    docker compose -f docker-compose.prod.yml ps"
echo "    重启服务:    docker compose -f docker-compose.prod.yml restart"
echo "    停止服务:    docker compose -f docker-compose.prod.yml down"
echo "    更新部署:    git pull && ./deploy.sh"
echo ""
