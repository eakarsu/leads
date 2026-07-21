#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi
source_file="${1:-}"
confirmation="${2:-}"
if [[ -z "$source_file" || ! -f "$source_file" ]]; then
  echo "Usage: npm run db:restore -- /absolute/path/backup.dump RESTORE_CONFIRMED" >&2
  exit 1
fi
if [[ "$confirmation" != "RESTORE_CONFIRMED" ]]; then
  echo "Restore refused without the exact RESTORE_CONFIRMED argument" >&2
  exit 1
fi

pg_restore --exit-on-error --no-owner --no-acl --clean --if-exists --dbname="$DATABASE_URL" "$source_file"
echo "Restore completed"
