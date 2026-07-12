# Synaptiq

> **Synaptic Applications** — AI-native knowledge graph, agent pipeline, and analytics platform.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/platform run dev` — run the React SPA (port 23633)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run test` — run all 5 test suite categories (21 tests)
- `pnpm --filter @workspace/scripts run agent -- --scrape=hacker-news --path=./data/raw` — CLI agent

Required env (set via Replit Secrets):
- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — 64-char random hex
- `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY`
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` / `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, Pino logger
- Auth: Clerk (JWT, OIDC, RBAC)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React 18, Vite 6, Wouter, React Query, shadcn/ui
- Validation: Zod (v4), drizzle-zod
- API codegen: Orval (from OpenAPI 3.1 spec)
- Build: esbuild (API CJS bundle), Vite (SPA)
- Testing: Vitest — unit/DDT/BDD/regression/E2E, Page Object Model + Factory pattern
- CI/CD: GitHub Actions (ci.yml, deploy-production.yml, codeql.yml)
- Container: Docker multi-stage (API + Nginx), Docker Compose

## Where things live

- API source of truth: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/`
- Generated API hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- Agent pipeline logic: `lib/agent-pipeline/src/`
- Frontend pages: `artifacts/platform/src/pages/`
- Test suites: `artifacts/api-server/src/tests/`
- Utility scripts: `utils/` (bash + PowerShell)
- Architecture diagrams: `docs/architecture.md`
- CI/CD workflows: `.github/workflows/`

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas. Never write API calls by hand.
- **First-provisioned user = admin**: JIT user resolution in `requireAuth` middleware; first user inserted into DB gets `admin` role automatically.
- **CSV quoting fix**: Raw `split(",")` corrupts quoted fields. Shared `parseCsv`/`parseCsvLine` in `lib/agent-pipeline/src/csv.ts` used everywhere.
- **pnpm minimumReleaseAge**: All npm packages must be 24h old before install — supply-chain defense. Never disable.
- **Proxy-first routing**: All traffic goes through Replit reverse proxy. Never call service ports directly in app code. Never add Vite proxy configs.

## Product

Synaptiq is a full-stack intelligence platform with:
- **Auth/RBAC**: Clerk sign-in, first user = admin
- **Dashboard**: Activity feed, pipeline stats, team overview
- **AI Agent Pipeline**: Scrape (HN/CoinGecko/CryptoPanic) → Process → Train, with CLI support
- **Knowledge Graph**: Live force-directed canvas graph of platform's own relational data
- **Team/Portfolio**: Resume pages per user, public and private views
- **Test Dashboard**: Color-coded progress bars across unit/DDT/BDD/regression/E2E suites
- **Admin Panel**: User role management, admin-gated UI

## User preferences

- App name: **Synaptiq** / **Synaptic Applications**
- GitHub repo: `Itkdaniel/portfolio-project`
- Dark slate + cyan theme
- Code style: clean, commented, with copyright headers on every source file
- Testing: Page Object Model + Factory pattern (Vitest)
- Multi-language: TypeScript (primary), Go and Python (future), bash + PowerShell utils

## Gotchas

- **Do not run `pnpm dev` at workspace root** — no root dev script. Use per-package `--filter` or restart the Replit workflow.
- **After editing `openapi.yaml`** run `./utils/codegen.sh` (or `pnpm --filter @workspace/api-spec run codegen`) before touching frontend hooks.
- **After editing DB schema** run `pnpm --filter @workspace/db run push` — no migration files, Drizzle push is source of truth.
- **CSV parsing**: always use `parseCsv` from `lib/agent-pipeline/src/csv.ts` — never `split(",")` on raw CSV.
- **Typecheck**: trust `pnpm run typecheck` over editor/LSP when they disagree.
- **Artifact toml edits**: use `verifyAndReplaceArtifactToml` (write to `.edit.toml` sibling, then call the callback) — never direct edit.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Full architecture + Mermaid diagrams: `docs/architecture.md`
- API reference: `docs/api.md`
- Testing guide (POM + factory): `docs/testing.md`
- GitHub Actions CI/CD: `.github/workflows/`
