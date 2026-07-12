# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# Multi-stage Docker build for the Synaptiq monorepo.
# Produces two optimized images: API server (Node.js) + frontend (Nginx static).
#
# Build args:
#   NODE_VERSION  — default 24 (LTS)
#
# Usage (local):
#   docker build --target api-server -t synaptiq-api .
#   docker build --target frontend   -t synaptiq-web .
# =============================================================================

ARG NODE_VERSION=24
ARG PNPM_VERSION=9

# ---------------------------------------------------------------------------
# Stage 1: Base — shared Node + pnpm setup
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# Install OS-level deps needed by native addons (pg, etc.)
RUN apk add --no-cache python3 make g++ openssl

# ---------------------------------------------------------------------------
# Stage 2: Dependencies — install all workspace deps (cached layer)
# ---------------------------------------------------------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./

# Copy only package.json manifests to maximise cache hits
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/platform/package.json    ./artifacts/platform/
COPY lib/agent-pipeline/package.json    ./lib/agent-pipeline/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/db/package.json                ./lib/db/
COPY lib/object-storage-web/package.json ./lib/object-storage-web/
COPY scripts/package.json               ./scripts/

RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: Build all TypeScript packages
# ---------------------------------------------------------------------------
FROM deps AS builder

COPY . .

# Build shared libs first (composite TypeScript project references)
RUN pnpm run typecheck:libs

# Build API server bundle (esbuild → dist/server.cjs)
RUN pnpm --filter @workspace/api-server run build \
    --env PORT=5000 \
    --env BASE_PATH=/api

# Build frontend static site (Vite → dist/public)
RUN pnpm --filter @workspace/platform run build \
    --env PORT=23633 \
    --env BASE_PATH=/

# ---------------------------------------------------------------------------
# Stage 4: API server — production image (minimal)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS api-server

LABEL org.opencontainers.image.title="Synaptiq API Server"
LABEL org.opencontainers.image.description="Synaptiq Express API — Synaptic Applications"
LABEL org.opencontainers.image.source="https://github.com/Itkdaniel/portfolio-project"
LABEL org.opencontainers.image.licenses="MIT"

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# Copy only production runtime: bundle + prod node_modules
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Drop privileges — never run as root in production
RUN addgroup -S synaptiq && adduser -S synaptiq -G synaptiq
USER synaptiq

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/healthz || exit 1

CMD ["node", "dist/server.cjs"]

# ---------------------------------------------------------------------------
# Stage 5: Frontend — Nginx static server
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS frontend

LABEL org.opencontainers.image.title="Synaptiq Frontend"
LABEL org.opencontainers.image.description="Synaptiq React SPA — Synaptic Applications"
LABEL org.opencontainers.image.source="https://github.com/Itkdaniel/portfolio-project"
LABEL org.opencontainers.image.licenses="MIT"

# Copy built static files
COPY --from=builder /app/artifacts/platform/dist/public /usr/share/nginx/html

# Custom Nginx config: SPA routing (all paths → index.html)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1
