#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .next/standalone/server.js ]]; then
  echo "Next.js did not produce the expected standalone server." >&2
  exit 1
fi

# Next.js intentionally leaves static and public assets outside its standalone
# directory. Package them here so the same artifact used by Docker can also be
# launched safely by start.sh.
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
