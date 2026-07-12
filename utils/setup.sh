#!/usr/bin/env bash
# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# utils/setup.sh
# Local development setup script. Run once after cloning.
#
# Usage:
#   chmod +x utils/setup.sh && ./utils/setup.sh
# =============================================================================

set -euo pipefail

# ---- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*" >&2; exit 1; }

# ---- Guards -----------------------------------------------------------------
info "Checking prerequisites..."

command -v node  >/dev/null 2>&1 || error "Node.js 24+ is required (https://nodejs.org)"
command -v pnpm  >/dev/null 2>&1 || error "pnpm is required: npm i -g pnpm@9"
command -v psql  >/dev/null 2>&1 || warn  "psql not found — skipping DB check (Docker Compose covers this)"

NODE_VER=$(node -e "process.stdout.write(process.version.slice(1))")
MAJOR=${NODE_VER%%.*}
[[ "$MAJOR" -ge 24 ]] || error "Node.js 24+ required, found v${NODE_VER}"
success "Node.js v${NODE_VER}"

PNPM_VER=$(pnpm --version)
success "pnpm v${PNPM_VER}"

# ---- Install dependencies ---------------------------------------------------
info "Installing workspace dependencies..."
pnpm install --frozen-lockfile
success "Dependencies installed"

# ---- Environment file -------------------------------------------------------
if [[ ! -f .env.local ]]; then
  info "Creating .env.local from .env.example..."
  cp .env.example .env.local
  warn "Edit .env.local and fill in your DATABASE_URL, CLERK_* keys, and SESSION_SECRET before starting the server."
else
  success ".env.local already exists"
fi

# ---- TypeScript typecheck ---------------------------------------------------
info "Running typecheck..."
pnpm run typecheck
success "TypeScript clean"

# ---- Done -------------------------------------------------------------------
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Synaptiq dev environment ready!          ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Next steps:"
echo "  1. Edit .env.local with your secrets"
echo "  2. Run:  pnpm --filter @workspace/db run push   (first-time DB migration)"
echo "  3. Start API server:   pnpm --filter @workspace/api-server run dev"
echo "  4. Start frontend:     pnpm --filter @workspace/platform run dev"
echo ""
