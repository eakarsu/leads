#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi
: "${NEXTAUTH_SECRET:=${SESSION_SECRET:-}}"
HOSTNAME="${HOST:-${HOSTNAME:-127.0.0.1}}"
: "${NEXTAUTH_URL:=http://${HOSTNAME}:${PORT:-3000}}"
export NEXTAUTH_SECRET HOSTNAME NEXTAUTH_URL
if [[ -z "${NEXTAUTH_SECRET:-}" || ${#NEXTAUTH_SECRET} -lt 32 ]]; then
  echo "NEXTAUTH_SECRET must contain at least 32 characters" >&2
  exit 1
fi
if [[ ! -f .next/standalone/server.js ]]; then
  echo "Production standalone build is missing. Run npm ci && npm run build first." >&2
  exit 1
fi

exec node .next/standalone/server.js
