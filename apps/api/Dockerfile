# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Copy workspace config and lockfile first (better layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy api package.json and prisma schema
COPY apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Install dependencies (production deps needed for prisma generate)
RUN pnpm install --frozen-lockfile --filter api...

# Copy api source
COPY apps/api/src ./apps/api/src/

# Generate Prisma client and build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx nest build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

# Copy runtime dependencies and built API artifacts from the build stage.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/package.json ./package.json

# Run as non-root
RUN addgroup -g 1001 -S tradepilot && adduser -S tradepilot -u 1001 -G tradepilot
RUN chown -R tradepilot:tradepilot /app
USER tradepilot

ENV NODE_ENV=production
ENV PORT=4100
ENV NODE_PATH=/app/node_modules/.pnpm/node_modules:/app/node_modules

EXPOSE 4100

CMD ["node", "apps/api/dist/main.js"]
