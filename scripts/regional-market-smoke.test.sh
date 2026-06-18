#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SMOKE_SCRIPT="$ROOT_DIR/scripts/regional-market-smoke.sh"

usage="$("$SMOKE_SCRIPT" 2>&1 || true)"
script_body="$(cat "$SMOKE_SCRIPT")"

for command in \
  reset-dashboard-demo \
  seed-dashboard-accounts \
  seed-dashboard-project \
  seed-dashboard-issuance \
  seed-dashboard-trade \
  seed-dashboard-retirement \
  seed-dashboard-pending-retirement \
  dashboard-flow-smoke
do
  if ! grep -q "$command" <<<"$usage"; then
    echo "Missing staged dashboard smoke command in usage: $command" >&2
    exit 1
  fi
done

if ! grep -q 'from generate_series(1, 10) as n;' <<<"$script_body"; then
  echo "Dashboard seed must use 10 issuance/retirement lifecycle rows for the 50-event story" >&2
  exit 1
fi

if ! grep -q '"creditIssued" = case when "refId" like '\''SMOKE-PRJ-%'\'' then' <<<"$script_body"; then
  echo "Dashboard issuance seed must assign issued credits by project, not blanket-update every project" >&2
  exit 1
fi

if ! grep -q '1500' <<<"$script_body"; then
  echo "Dashboard issuance seed must include 1500-credit issuance rows" >&2
  exit 1
fi

if ! grep -q '150,' <<<"$script_body"; then
  echo "Dashboard retirement seed must include 150-credit buyer retirement rows" >&2
  exit 1
fi

if ! grep -q 'retirement_sender_id' <<<"$script_body"; then
  echo "Dashboard retirement seed must derive senderId from buyer/compliance account ids" >&2
  exit 1
fi

echo "OK: regional dashboard staged smoke commands are documented"
