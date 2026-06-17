#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SMOKE_SCRIPT="$ROOT_DIR/scripts/regional-demo-seed-smoke.sh"

usage="$("$SMOKE_SCRIPT" 2>&1 || true)"
script_body="$(cat "$SMOKE_SCRIPT")"

for command in \
  login-smoke \
  indicators-smoke \
  reset-smoke \
  briefing-smoke
do
  if ! grep -q "$command" <<<"$usage"; then
    echo "Missing regional demo smoke command in usage: $command" >&2
    exit 1
  fi
done

for endpoint in \
  "/regional/demo/session/login" \
  "/regional/demo/indicators" \
  "/regional/demo/reset"
do
  if ! grep -q "$endpoint" <<<"$script_body"; then
    echo "Regional demo smoke script must call endpoint: $endpoint" >&2
    exit 1
  fi
done

if ! grep -q "gov_demo" <<<"$script_body"; then
  echo "Regional demo smoke script must use the government golden account" >&2
  exit 1
fi

echo "OK: regional demo seed smoke commands are documented"
