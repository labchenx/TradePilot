# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Copy workspace config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy web package.json and tsconfig
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts ./apps/web/
COPY apps/web/index.html ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter web...

# Copy the full web app so Vite-local config/plugins and PWA assets are present.
COPY apps/web ./apps/web/

# Build
WORKDIR /app/apps/web
RUN npx vite build

# ---- Production stage (nginx) ----
FROM nginx:1.27-alpine AS production

# Copy built static files
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
