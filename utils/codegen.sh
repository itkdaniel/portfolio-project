#!/usr/bin/env bash
# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# utils/codegen.sh
# Regenerate API client hooks and Zod schemas from the OpenAPI spec.
# Run this after any change to lib/api-spec/openapi.yaml.
#
# Usage:
#   ./utils/codegen.sh
# =============================================================================

set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }

info "Regenerating API client from OpenAPI spec..."
pnpm --filter @workspace/api-spec run codegen
success "Codegen complete — lib/api-client-react and lib/api-zod updated"

info "Typechecking libs..."
pnpm run typecheck:libs
success "Libs typecheck clean"
