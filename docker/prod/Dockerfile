# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# docker/prod/Dockerfile
# Production multi-stage image:
#   Stage 1 (builder)  — install Python deps in a venv
#   Stage 2 (api)      — minimal runtime image (Python 3.12 slim)
#   Stage 3 (frontend) — Vite build + Nginx static server
# =============================================================================

# ============================================================
# Stage 1 — Python dependency builder
# ============================================================
FROM python:3.12-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY artifacts/api-server/requirements.txt .

# Install into an explicit venv for clean copying
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


# ============================================================
# Stage 2 — API runtime
# ============================================================
FROM python:3.12-slim-bookworm AS api

LABEL maintainer="Synaptic Applications <itkdaniel@users.noreply.github.com>"
LABEL description="Synaptiq API — production image (Python 3.12 + FastAPI)"

# Runtime-only system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Unprivileged user
RUN groupadd --gid 1001 synaptiq \
    && useradd --uid 1001 --gid synaptiq --shell /bin/bash --create-home synaptiq

WORKDIR /app

# Copy venv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application source
COPY artifacts/api-server/src ./src
COPY artifacts/api-server/alembic ./alembic
COPY artifacts/api-server/alembic.ini .

RUN mkdir -p /app/logs && chown synaptiq:synaptiq /app/logs

USER synaptiq

EXPOSE 8080

# Gunicorn + uvicorn workers for production
CMD ["python", "-m", "uvicorn", "src.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--workers", "4", \
     "--log-level", "info", \
     "--no-access-log"]


# ============================================================
# Stage 3 — Frontend (TypeScript Vite React → Nginx)
# ============================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /workspace
COPY . .

RUN corepack enable \
    && pnpm install --frozen-lockfile \
    && pnpm --filter @workspace/platform run build


FROM nginx:1.27-alpine AS frontend

LABEL description="Synaptiq web — production Nginx static server"

COPY --from=frontend-builder /workspace/artifacts/platform/dist /usr/share/nginx/html
COPY docker/prod/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
