# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# utils/setup.ps1
# Local development setup script for Windows (PowerShell 7+).
#
# Usage:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#   .\utils\setup.ps1
# =============================================================================

#Requires -Version 7.0

$ErrorActionPreference = "Stop"

function Info    { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success { param($msg) Write-Host "[OK]   $msg" -ForegroundColor Green }
function Warn    { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Err     { param($msg) Write-Error "[ERR]  $msg" }

# ---- Prerequisites ----------------------------------------------------------
Info "Checking prerequisites..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Err "Node.js 24+ required. Download from https://nodejs.org"
}

$nodeVersion = (node -e "process.stdout.write(process.version.slice(1))")
$nodeMajor   = [int]($nodeVersion -split '\.')[0]
if ($nodeMajor -lt 24) { Err "Node.js 24+ required, found v$nodeVersion" }
Success "Node.js v$nodeVersion"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Err "pnpm required. Install with: npm i -g pnpm@9"
}
$pnpmVersion = (pnpm --version)
Success "pnpm v$pnpmVersion"

# ---- Install dependencies ---------------------------------------------------
Info "Installing workspace dependencies..."
pnpm install --frozen-lockfile
Success "Dependencies installed"

# ---- Environment file -------------------------------------------------------
if (-not (Test-Path ".env.local")) {
    Info "Creating .env.local from .env.example..."
    Copy-Item ".env.example" ".env.local"
    Warn "Edit .env.local and fill in DATABASE_URL, CLERK_* keys, and SESSION_SECRET."
} else {
    Success ".env.local already exists"
}

# ---- TypeScript typecheck ---------------------------------------------------
Info "Running typecheck..."
pnpm run typecheck
Success "TypeScript clean"

# ---- Done -------------------------------------------------------------------
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Synaptiq dev environment ready!          " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:"
Write-Host "  1. Edit .env.local with your secrets"
Write-Host "  2. Run:  pnpm --filter @workspace/db run push   (first-time DB migration)"
Write-Host "  3. Start API:       pnpm --filter @workspace/api-server run dev"
Write-Host "  4. Start frontend:  pnpm --filter @workspace/platform run dev"
Write-Host ""
