# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# docker/dev/Dockerfile
# Development image — Python 3.12, hot-reload via uvicorn --reload.
# Mount the source directory as a volume for live code changes.
# =============================================================================

FROM python:3.12-slim-bookworm

LABEL maintainer="Synaptic Applications <itkdaniel@users.noreply.github.com>"
LABEL description="Synaptiq API — development image (Python 3.12 + FastAPI)"

# ---- System dependencies ----------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ---- Unprivileged user ------------------------------------------------------
RUN groupadd --gid 1001 synaptiq \
    && useradd --uid 1001 --gid synaptiq --shell /bin/bash --create-home synaptiq

WORKDIR /app

# ---- Python dependencies (dev) ----------------------------------------------
COPY artifacts/api-server/requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# ---- Source (mounted as volume in docker-compose.dev.yml) -------------------
COPY artifacts/api-server/ .

# Ensure logs directory exists
RUN mkdir -p /app/logs && chown synaptiq:synaptiq /app/logs

USER synaptiq

EXPOSE 8080

# Uvicorn with hot-reload enabled for development
CMD ["uvicorn", "src.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--reload", \
     "--reload-dir", "src", \
     "--log-level", "debug"]
