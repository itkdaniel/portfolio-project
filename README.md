# Synaptiq

> **Synaptic Applications** — AI-native knowledge graph, agent pipeline, and analytics platform.

[![CI](https://github.com/Itkdaniel/portfolio-project/actions/workflows/ci.yml/badge.svg)](https://github.com/Itkdaniel/portfolio-project/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Itkdaniel/portfolio-project/actions/workflows/codeql.yml/badge.svg)](https://github.com/Itkdaniel/portfolio-project/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
![Python 3.12](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)

Synaptiq is a full-stack intelligence platform that scrapes live trending-topic data (tech, news, crypto, stocks, sports), processes and trains lightweight AI models on it, visualizes its own relational data as a live force-directed knowledge graph, manages a team portfolio/resume directory, and surfaces a color-coded test-suite dashboard — all behind Clerk authentication and role-based access control.

> **v2.0.0 — Python 3 FastAPI backend** (migrated from TypeScript/Express)  
> The TypeScript React frontend is unchanged. The OpenAPI 3.1 contract is preserved.  
> Original TypeScript backend preserved on the [`typescript-backend`](https://github.com/Itkdaniel/portfolio-project/tree/typescript-backend) branch.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development (Replit)](#local-development-replit)
  - [Local Development (Self-hosted)](#local-development-self-hosted)
  - [Docker Compose](#docker-compose)
- [Environment Variables](#environment-variables)
- [CI/CD Pipelines](#cicd-pipelines)
- [Database Migrations](#database-migrations)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Docker & Container Builds](#docker--container-builds)
- [Deployment Methods](#deployment-methods)
- [Security Protocols](#security-protocols)
- [Release History](#release-history)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **Auth / RBAC** | Clerk sign-in (JWT RS256), first user = admin, per-route role enforcement |
| **AI Agent Pipeline** | Scrape (HN / CoinGecko / CryptoPanic) → Process → Train, with CLI support |
| **Knowledge Graph** | Live force-directed canvas graph of the platform's own relational data |
| **Team / Portfolio** | Resume pages per user, public and private views |
| **Test Dashboard** | Color-coded progress bars across 5 pytest suites (85 tests) |
| **Admin Panel** | User role management, admin-gated UI |
| **Object Storage** | Replit bucket-backed file upload/download |

---

## Tech Stack

### Backend (v2.0.0 — Python 3.12 FastAPI)

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115.6 (ASGI, native async) |
| Server | uvicorn (dev: `--reload`, prod: `--workers 4`) |
| Database | PostgreSQL 16 + SQLAlchemy 2.0 async + asyncpg |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Auth | PyJWT + Clerk JWKS (RS256, 5-min cache) |
| HTTP client | httpx (async scraper + test client) |
| Logging | structlog |
| Testing | pytest + pytest-asyncio + Factory Boy + aiosqlite |

### Frontend (unchanged)

| Layer | Technology |
|---|---|
| Framework | React 18, TypeScript 5.9 |
| Bundler | Vite 6 |
| Routing | Wouter |
| Data fetching | React Query (generated hooks via Orval) |
| UI | shadcn/ui, Tailwind CSS v4 |
| Auth | Clerk React SDK |

### Shared

| Tool | Use |
|---|---|
| OpenAPI 3.1 | Contract-first API spec (`lib/api-spec/openapi.yaml`) |
| Orval | Codegen — React Query hooks + Zod schemas from OpenAPI |
| pnpm workspaces | Node.js 24 monorepo (frontend + shared libs) |
| Docker | Multi-stage images, separate dev/prod compose files |
| GitHub Actions | CI (lint + typecheck + test + build + Docker smoke) |

---

## Repository Structure

```
portfolio-project/
├── artifacts/
│   ├── api-server/              # Python FastAPI backend
│   │   ├── src/
│   │   │   ├── main.py          # App factory + lifespan
│   │   │   ├── config.py        # Pydantic BaseSettings
│   │   │   ├── database.py      # Async engine + session factory
│   │   │   ├── middleware/      # Clerk JWT auth
│   │   │   ├── models/          # SQLAlchemy ORM (7 models)
│   │   │   ├── schemas/         # Pydantic v2 request/response schemas
│   │   │   ├── routers/         # FastAPI routers (7 routers)
│   │   │   ├── services/        # Factory pattern services (BaseService[T])
│   │   │   └── agent/           # Scrape → Process → Train pipeline
│   │   ├── tests/
│   │   │   ├── conftest.py      # SQLite+aiosqlite fixtures, mocked Clerk
│   │   │   ├── factories/       # Factory Boy (UserFactory, AgentFactory suite)
│   │   │   ├── page_objects/    # Page Object Model (BasePage + 4 pages)
│   │   │   ├── unit/            # Pure function tests
│   │   │   ├── ddt/             # Parametrized data-driven tests
│   │   │   ├── bdd/             # Given/When/Then behaviour tests
│   │   │   ├── regression/      # Bug guard tests
│   │   │   └── e2e/             # Full HTTP cycle tests
│   │   ├── alembic/             # Database migrations
│   │   ├── requirements.txt     # Production Python deps
│   │   └── requirements-dev.txt # Dev + test Python deps
│   └── platform/                # TypeScript React SPA (unchanged)
│       └── src/
│           ├── pages/           # Dashboard, Graph, Team, Tests, Admin
│           └── components/      # shadcn/ui + custom components
├── lib/                         # Shared TypeScript libraries
│   ├── api-spec/                # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/        # Generated React Query hooks
│   ├── api-zod/                 # Generated Zod schemas
│   ├── db/                      # Drizzle schema (reference only in v2)
│   └── agent-pipeline/          # TypeScript agent utils (reference)
├── docker/
│   ├── dev/                     # Docker Compose (hot-reload, Vite HMR)
│   └── prod/                    # Docker Compose (multi-stage, Nginx)
├── docs/
│   ├── architecture.md          # Mermaid diagrams, architecture decisions
│   ├── api.md                   # API reference
│   └── testing.md               # POM + Factory Boy guide
├── .github/workflows/
│   ├── ci.yml                   # Python lint + TS typecheck + tests + Docker
│   ├── deploy-production.yml    # Replit production deploy
│   └── codeql.yml               # GitHub CodeQL security scan
└── utils/                       # Bash + PowerShell utility scripts
```

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for full Mermaid diagrams:

- System overview (browser → proxy → FastAPI → PostgreSQL)
- Python backend app structure (routers / services / models / agent)
- Agent pipeline sequence (scrape → process → train)
- Auth sequence (Clerk JWT → JWKS → JIT user creation)
- Database ER diagram (7 entities)
- Testing architecture (POM + Factory Boy)
- Docker dev vs prod comparison
- CI/CD pipeline

### Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **FastAPI over Flask/Django** | Native async/await, Pydantic v2 auto-validation, auto OpenAPI docs, fastest Python ASGI |
| **SQLAlchemy 2.0 async + asyncpg** | True async I/O; no greenlet thread pool |
| **Alembic migrations** | Explicit versioned history; replaces Drizzle push |
| **BaseService[ModelT] factory** | Generic repository base; all services extend it |
| **Factory Boy + POM tests** | Declarative, composable test data; HTTP interactions encapsulated per router |
| **SQLite + aiosqlite in tests** | In-memory isolation, rolled back per function; no live DB in CI |
| **PyJWT + JWKS cache (5 min)** | Avoids per-request Clerk roundtrip; handles key rotation |
| **OpenAPI contract preserved** | TypeScript React Query hooks work without frontend changes |
| **First user = admin** | Count users BEFORE insert; prevents race-condition role promotion |

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.12+ |
| Node.js | 24+ |
| pnpm | 10+ |
| PostgreSQL | 16 (or Docker) |

### Local Development (Replit)

The API server workflow runs automatically via Replit:

```bash
# API server starts automatically (uvicorn with hot reload)
# Frontend starts automatically (Vite dev server)

# Check API health
curl https://<your-repl-domain>/api/healthz
```

To run manually:
```bash
# Python backend
cd artifacts/api-server
pip install -r requirements-dev.txt
uvicorn src.main:app --reload --port 8080 --host 0.0.0.0

# TypeScript frontend (unchanged)
pnpm --filter @workspace/platform run dev
```

### Local Development (Self-hosted)

```bash
# Clone
git clone https://github.com/Itkdaniel/portfolio-project.git
cd portfolio-project

# Python deps
cd artifacts/api-server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# Apply DB schema
alembic upgrade head

# Start backend
uvicorn src.main:app --reload --port 8080

# Frontend (new terminal)
cd ../..
pnpm install --frozen-lockfile
pnpm --filter @workspace/platform run dev
```

### Docker Compose

```bash
# Development (hot-reload, Vite HMR)
docker compose -f docker/dev/docker-compose.dev.yml up

# Production (4 workers, Nginx, built SPA)
docker compose -f docker/prod/docker-compose.prod.yml up --build
```

---

## Environment Variables

### Backend (Python)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `CLERK_SECRET_KEY` | Clerk backend secret key |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_JWKS_URL` | Clerk JWKS URL (auto-derived from publishable key if omitted) |
| `SESSION_SECRET` | 64-char hex secret |
| `ENVIRONMENT` | `development` \| `production` |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Replit object storage bucket |
| `PRIVATE_OBJECT_DIR` | Private object storage prefix |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Public object search paths |

### Frontend (TypeScript, unchanged)

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (Vite client) |

---

## CI/CD Pipelines

### CI — `ci.yml`

Triggered on push to `main` and `typescript-backend`, and on all pull requests.

```
push to main
  ├── 🐍 lint-py          ruff check artifacts/api-server/src
  ├── 📘 typecheck-ts      tsc --noEmit (frontend, unchanged)
  │
  ├── 🧪 test-py  ← needs lint-py
  │       ├── unit tests        pytest tests/unit/
  │       ├── DDT tests         pytest tests/ddt/
  │       ├── BDD tests         pytest tests/bdd/
  │       ├── regression tests  pytest tests/regression/
  │       ├── E2E tests         pytest tests/e2e/
  │       └── coverage → Codecov
  │
  ├── 🏗️ build-ts ← needs typecheck-ts
  │       └── pnpm --filter @workspace/platform run build
  │
  ├── 🐳 docker-dev  ← needs test-py
  └── 🐳 docker-prod ← needs test-py + build-ts
```

### CD — `deploy-production.yml`

Triggered on push to `main` after CI passes. Deploys to Replit production.

### Security — `codeql.yml`

Weekly CodeQL scan on Python and TypeScript sources.

### Required GitHub Secrets

```
DATABASE_URL
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
SESSION_SECRET
DEFAULT_OBJECT_STORAGE_BUCKET_ID
PRIVATE_OBJECT_DIR
PUBLIC_OBJECT_SEARCH_PATHS
REPLIT_TOKEN          (for production deploy workflow)
```

---

## Database Migrations

```bash
cd artifacts/api-server

# Apply all migrations
alembic upgrade head

# Create a new migration (after editing SQLAlchemy models)
alembic revision --autogenerate -m "add_my_column"

# Rollback one migration
alembic downgrade -1

# Show current migration state
alembic current
```

Migration files live in `artifacts/api-server/alembic/versions/`.

---

## API Reference

See [`docs/api.md`](docs/api.md) for full endpoint documentation.

Interactive Swagger UI available in development: `GET /api/docs`  
ReDoc: `GET /api/redoc`

### Endpoints Overview

| Router | Base Path | Auth Required |
|---|---|---|
| Health | `GET /api/healthz` | No |
| Users | `/api/users/` | Yes (admin for list/role) |
| Profile | `/api/profile/` | Yes (public endpoints open) |
| Agent | `/api/agent/` | Yes |
| Tests | `/api/tests/` | Yes (admin for run) |
| Knowledge Graph | `/api/knowledge-graph/` | Yes |
| Storage | `/api/storage/` | Yes |

---

## Testing

See [`docs/testing.md`](docs/testing.md) for the full testing guide.

```bash
cd artifacts/api-server

# All 5 suites (85 tests)
python -m pytest tests/ -v

# Individual suites
python -m pytest tests/unit/ -v       # 25 pure function tests
python -m pytest tests/ddt/ -v        # 22 parametrized tests
python -m pytest tests/bdd/ -v        # 7 Given/When/Then tests
python -m pytest tests/regression/ -v # 16 bug guard tests
python -m pytest tests/e2e/ -v        # 15 full HTTP cycle tests

# With coverage report
python -m pytest tests/ --cov=src --cov-report=term-missing
```

**Patterns used:**

- **Page Object Model** — HTTP interactions encapsulated per router (`BasePage` → `HealthPage`, `UsersPage`, `AgentPage`, `GraphPage`)
- **Factory Boy** — Declarative test data (`UserFactory`, `AdminUserFactory`, `DataSourceFactory`, `ScrapeJobFactory`, `FeatureSetFactory`, `TrainingRunFactory`, `TestRunFactory`)
- **In-memory isolation** — SQLite + aiosqlite, rolled back per test function; no live DB required

---

## Docker & Container Builds

Two separate Docker environments (dev vs prod):

### Development

```bash
docker compose -f docker/dev/docker-compose.dev.yml up
# API: uvicorn --reload on port 8080
# Frontend: Vite HMR on port 3000
# PostgreSQL: local container
# Source: volume-mounted (hot reload)
```

### Production

```bash
docker compose -f docker/prod/docker-compose.prod.yml up --build
# API: uvicorn --workers 4 on port 8080 (multi-stage Dockerfile)
# Frontend: Nginx serving pre-built /dist
# Source: COPY into image at build time
```

Multi-stage `docker/prod/Dockerfile`:
- Stage 1 (`builder`): `python:3.12-slim` + pip install into `/opt/venv`
- Stage 2 (`runtime`): `python:3.12-slim` + copy venv + non-root user

---

## Deployment Methods

### Replit Deployments (primary)

Click **Publish** in the Replit workspace. The production deploy uses:
- API: `uvicorn src.main:app --host 0.0.0.0 --port 8080 --workers 4 --log-level info`
- Frontend: Vite-built static SPA served by the Replit proxy

### Docker / Railway / Fly.io

```bash
# Build production API image
docker build -f docker/prod/Dockerfile -t synaptiq-api:v2.0.0 artifacts/api-server/

# Build and push
docker build -f docker/prod/Dockerfile -t ghcr.io/itkdaniel/synaptiq-api:v2.0.0 .
docker push ghcr.io/itkdaniel/synaptiq-api:v2.0.0
```

### Static Frontend (Vercel / Netlify)

```bash
pnpm --filter @workspace/platform run build
# Output: artifacts/platform/dist/
```

---

## Security Protocols

| Layer | Measure |
|---|---|
| Auth | Clerk RS256 JWT, JWKS-verified, 5-min cache |
| RBAC | Per-route `require_role(["admin"])` dependency |
| Input validation | Pydantic v2 strict mode on all request bodies |
| SQL injection | SQLAlchemy parameterized queries only |
| Secrets | Replit Secrets / environment variables (never in code) |
| CORS | Origins restricted in production |
| Headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` |
| Dependencies | `pnpm minimumReleaseAge: 24h` (supply-chain defense) |
| Scanning | GitHub CodeQL weekly on Python + TypeScript |

---

## Release History

| Version | Date | Description |
|---|---|---|
| [v2.0.0](https://github.com/Itkdaniel/portfolio-project/releases/tag/v2.0.0) | 2026-07-16 | **Python 3.12 FastAPI backend** (this release) — 85 tests, Factory Boy + POM, Alembic, separate dev/prod Docker |
| [v1.0.0](https://github.com/Itkdaniel/portfolio-project/tree/typescript-backend) | 2026 | TypeScript/Express backend (preserved on `typescript-backend` branch) |

---

## License

MIT © 2026 Synaptic Applications (Itkdaniel). See [LICENSE](LICENSE).

## Copyright

Copyright © 2026 Synaptic Applications. All source files carry the MIT copyright header.
