#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a
case "$DATABASE_URL" in
  *connect_timeout=*) ;;
  *\?*) export DATABASE_URL="${DATABASE_URL}&connect_timeout=30" ;;
  *) export DATABASE_URL="${DATABASE_URL}?connect_timeout=30" ;;
esac
: "${BACKEND_PORT:?BACKEND_PORT is required}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo "BACKEND_PORT and FRONTEND_PORT must differ" >&2; exit 1; }
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  [[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1024 && port <= 65535 )) || { echo "Invalid assigned port" >&2; exit 1; }
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "Port $port is occupied" >&2; exit 1; }
done
[[ -d "$project_dir/node_modules" ]] || { echo "Dependencies are missing; run npm ci" >&2; exit 1; }
export NEXTAUTH_URL="http://127.0.0.1:$FRONTEND_PORT"
export PROVISION_COMPANY_NAME="${PROVISION_COMPANY_NAME:-Runtime Acceptance}"
cd "$project_dir"
npx --no-install prisma generate
npm run db:migrate:deploy
npm run create-admin

api_pid=''; proxy_pid=''
cleanup() {
  [[ -n "$proxy_pid" ]] && kill "$proxy_pid" 2>/dev/null || true
  [[ -n "$api_pid" ]] && kill "$api_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM
npm run dev -- --hostname 127.0.0.1 --port "$BACKEND_PORT" & api_pid=$!
for _ in $(seq 1 180); do
  curl --fail --silent "http://127.0.0.1:$BACKEND_PORT/api/health/ready" >/dev/null 2>&1 && break
  kill -0 "$api_pid" 2>/dev/null || { echo "Application exited during startup" >&2; wait "$api_pid"; exit 1; }
  sleep 0.25
done
curl --fail --silent "http://127.0.0.1:$BACKEND_PORT/api/health/ready" >/dev/null || { echo "Application readiness timed out" >&2; exit 1; }
curl --fail --silent "http://127.0.0.1:$BACKEND_PORT/api/auth/providers" >/dev/null
curl --fail --silent "http://127.0.0.1:$BACKEND_PORT/api/auth/csrf" >/dev/null
RUNTIME_PROXY_PORT="$FRONTEND_PORT" RUNTIME_PROXY_TARGET_PORT="$BACKEND_PORT" node scripts/runtime-proxy.mjs & proxy_pid=$!
echo "LeadGenFlow is available at http://127.0.0.1:$FRONTEND_PORT (API $BACKEND_PORT)"
wait "$api_pid" "$proxy_pid"
