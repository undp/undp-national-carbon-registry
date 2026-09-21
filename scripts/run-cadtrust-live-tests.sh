#!/usr/bin/env bash
# Runs every CAD Trust v2 live-node test/capture in one go.
#
# Usage:
#   scripts/run-cadtrust-live-tests.sh <base-url> [api-key]
#   CADT_V2_LIVE_URL=... [CADT_V2_LIVE_API_KEY=...] scripts/run-cadtrust-live-tests.sh
#
# Runs the whole backend/services/libs/cadtrust/src/live/ directory as one jest
# invocation. Every *.spec.ts under it -- the original smoke-test spec plus every
# <resource>.capture.spec.ts -- picks up CADT_V2_LIVE_URL/CADT_V2_LIVE_API_KEY
# automatically. Adding a capture spec for a future resource needs NO change here;
# this script never needs to know their names.
#
# Capture output lands in backend/services/libs/cadtrust/src/live/.captures/
# (gitignored) -- read those files directly, no need to scroll test output.

set -euo pipefail

CADT_V2_LIVE_URL="${1:-${CADT_V2_LIVE_URL:-}}"
CADT_V2_LIVE_API_KEY="${2:-${CADT_V2_LIVE_API_KEY:-}}"

if [ -z "$CADT_V2_LIVE_URL" ]; then
  echo "Usage: $0 <base-url> [api-key]" >&2
  echo "   or: CADT_V2_LIVE_URL=... [CADT_V2_LIVE_API_KEY=...] $0" >&2
  exit 1
fi

export CADT_V2_LIVE_URL
export CADT_V2_LIVE_API_KEY

cd "$(dirname "$0")/../backend/services"

echo "[cadtrust-live] Running every live/*.spec.ts against $CADT_V2_LIVE_URL"
yarn test -- libs/cadtrust/src/live
