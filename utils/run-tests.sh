#!/usr/bin/env bash
# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# utils/run-tests.sh
# Run all Vitest test suites: unit / DDT / BDD / regression / e2e.
#
# Usage:
#   ./utils/run-tests.sh              # run all suites
#   SUITE=unit ./utils/run-tests.sh   # run only one suite
#   WATCH=1 ./utils/run-tests.sh      # watch mode
# =============================================================================

set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*" >&2; exit 1; }

SUITE="${SUITE:-}"
WATCH="${WATCH:-0}"

CMD="pnpm --filter @workspace/api-server run test"

if [[ -n "$SUITE" ]]; then
  info "Running suite: $SUITE"
  CMD="$CMD -- --reporter=verbose --grep=$SUITE"
else
  info "Running all suites (unit/ddt/bdd/regression/e2e)"
  CMD="$CMD -- --reporter=verbose"
fi

if [[ "$WATCH" == "1" ]]; then
  info "Watch mode enabled"
  CMD="$CMD --watch"
fi

eval "$CMD" && success "All tests passed" || error "Tests failed — check output above"
