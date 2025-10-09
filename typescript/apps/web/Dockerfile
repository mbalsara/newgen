# Multi-stage build for optimized production image
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile --filter @repo/web...

# Stage 2: Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter @repo/web build

# Stage 3: Production image with nginx
FROM nginx:alpine AS runner

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
