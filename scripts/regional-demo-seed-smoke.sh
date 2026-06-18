#!/usr/bin/env bash
set -euo pipefail

API_BASE="${REGIONAL_DEMO_API_BASE:-http://127.0.0.1:3001}"

usage() {
  cat <<'USAGE'
Usage: scripts/regional-demo-seed-smoke.sh <command>

Commands:
  login-smoke       Verify gov_demo can create a demo session.
  indicators-smoke  Verify verified S12 indicators and source details are exposed.
  reset-smoke       Verify reset skeleton preserves verified indicators.
  briefing-smoke    Run login, indicators, and reset smoke checks.

Environment:
  REGIONAL_DEMO_API_BASE defaults to http://127.0.0.1:3001
USAGE
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" \
      -H "Content-Type: application/json" \
      --data "$body" \
      "$API_BASE$path"
  else
    curl -fsS -X "$method" "$API_BASE$path"
  fi
}

assert_json_contains() {
  local json="$1"
  local needle="$2"

  if ! grep -q "$needle" <<<"$json"; then
    echo "Expected response to contain '$needle'" >&2
    echo "$json" >&2
    exit 1
  fi
}

login_smoke() {
  local response
  response="$(request POST "/regional/demo/session/login" '{"account":"gov_demo"}')"

  assert_json_contains "$response" "demo-session-gov"
  assert_json_contains "$response" "GOVERNMENT"
}

indicators_smoke() {
  local response first_id source
  response="$(request GET "/regional/demo/indicators?verifiedOnly=true")"

  assert_json_contains "$response" "REAL_PUBLIC_DATA"
  assert_json_contains "$response" "s12-henan-gdp-2025"
  assert_json_contains "$response" "s12-zhengzhou-gdp-2025"

  first_id="$(node -e 'const fs=require("fs"); const data=JSON.parse(fs.readFileSync(0,"utf8")); console.log(data.items[0].id)' <<<"$response")"
  source="$(request GET "/regional/demo/indicators/$first_id/source")"

  assert_json_contains "$source" "sourceLabel"
  assert_json_contains "$source" "verifiedBy"
}

reset_smoke() {
  local response
  response="$(request POST "/regional/demo/reset" '{}')"

  assert_json_contains "$response" "RESET"
  assert_json_contains "$response" "verifiedIndicators"
}

case "${1:-}" in
  login-smoke)
    login_smoke
    ;;
  indicators-smoke)
    indicators_smoke
    ;;
  reset-smoke)
    reset_smoke
    ;;
  briefing-smoke)
    login_smoke
    indicators_smoke
    reset_smoke
    ;;
  *)
    usage
    exit 1
    ;;
esac

echo "OK: regional demo ${1:-usage} passed"
