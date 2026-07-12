#!/usr/bin/env bash
# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# utils/db-migrate.sh
# Push Drizzle schema changes to the target database.
#
# Usage:
#   ./utils/db-migrate.sh                       # uses .env.local
#   DATABASE_URL=postgres://... ./utils/db-migrate.sh
#
# Environment:
#   DATABASE_URL  — Postgres connection string (required)
#   ENV           — "dev" (default) or "prod" (adds extra safety confirmation)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*" >&2; exit 1; }

ENV="${ENV:-dev}"

# Load .env.local if present and DATABASE_URL not already set
if [[ -z "${DATABASE_URL:-}" && -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a; source .env.local; set +a
fi

[[ -z "${DATABASE_URL:-}" ]] && error "DATABASE_URL is not set. See .env.example."

# Production safety gate
if [[ "$ENV" == "prod" ]]; then
  warn "You are about to push schema changes to PRODUCTION."
  echo -n "Type 'yes' to confirm: "
  read -r CONFIRM
  [[ "$CONFIRM" == "yes" ]] || error "Aborted."
fi

info "Pushing Drizzle schema → $DATABASE_URL"
pnpm --filter @workspace/db run push
success "Schema push complete"
