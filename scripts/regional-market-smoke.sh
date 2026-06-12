#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-cy}"
DB_NAME="${DB_NAME:-carbondev}"
DB_EVENTS_NAME="${DB_EVENTS_NAME:-${DB_NAME}Events}"
API_BASE="${REGIONAL_MARKET_API_BASE:-http://127.0.0.1:3001}"

usage() {
  cat <<USAGE
Usage: scripts/regional-market-smoke.sh <command>

Commands:
  check-db     Verify Postgres is reachable.
  prepare-db   Create ${DB_NAME} and ${DB_EVENTS_NAME} if they do not exist.
  start-cmd    Print the regional API startup command for this DB.
  smoke        Verify /regional/info, /regional/dashboard/summary, and a demo protected query.
  seed-trade   Insert a deterministic OTC trade row into market_trade_execution_entity.
  trade-smoke  Verify the seeded OTC trade is reflected in dashboard aggregation.

Environment:
  DB_HOST=${DB_HOST}
  DB_PORT=${DB_PORT}
  DB_USER=${DB_USER}
  DB_NAME=${DB_NAME}
  DB_EVENTS_NAME=${DB_EVENTS_NAME}
  REGIONAL_MARKET_API_BASE=${API_BASE}
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

database_exists() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -Atqc \
    "select 1 from pg_database where datname = '$1'" | grep -q 1
}

check_db() {
  require_cmd pg_isready
  pg_isready -h "$DB_HOST" -p "$DB_PORT"
}

prepare_db() {
  require_cmd createdb
  require_cmd psql
  check_db

  if ! database_exists "$DB_NAME"; then
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo "Created database: $DB_NAME"
  else
    echo "Database exists: $DB_NAME"
  fi

  if ! database_exists "$DB_EVENTS_NAME"; then
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_EVENTS_NAME"
    echo "Created database: $DB_EVENTS_NAME"
  else
    echo "Database exists: $DB_EVENTS_NAME"
  fi
}

print_start_cmd() {
  cat <<CMD
cd "$ROOT_DIR/backend/services"
REGIONAL_MARKET_DEMO_MODE=true \\
RUN_MODULE=regional-market-api \\
RUN_PORT=3001 \\
DB_HOST=$DB_HOST \\
DB_PORT=$DB_PORT \\
DB_USER=$DB_USER \\
DB_NAME=$DB_NAME \\
DB_PASSWORD=\${DB_PASSWORD:-} \\
yarn start:dev
CMD
}

smoke() {
  require_cmd curl

  curl -fsS "$API_BASE/regional/info" | grep -q '"subsystem":"regional-carbon-market"'
  echo "OK: /regional/info"
  curl -fsS "$API_BASE/regional/dashboard/summary" | grep -q '"dataStatus":"real"'
  echo "OK: /regional/dashboard/summary"
  curl -fsS \
    -H "Content-Type: application/json" \
    -d '{"page":1,"size":5}' \
    "$API_BASE/regional/projects/query" | grep -q '"data"'
  echo "OK: /regional/projects/query"
}

seed_trade() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from market_trade_execution_entity where "creditTransactionId" = 'SMOKE-TX-1';
insert into market_trade_execution_entity (
  "creditTransactionId",
  "creditBlockId",
  "sellerCompanyId",
  "buyerCompanyId",
  "projectRefId",
  "serialNumber",
  amount,
  "unitPrice",
  "totalPrice",
  currency,
  "tradeTime",
  "settlementStatus"
) values (
  'SMOKE-TX-1',
  'SMOKE-CB-1',
  10,
  20,
  'SMOKE-PRJ-1',
  'SMOKE-SN-1',
  300,
  42,
  12600,
  'CNY',
  '2026-06-11T00:00:00.000Z',
  'SETTLED_OFFLINE'
);
SQL

  echo "OK: seeded market_trade_execution_entity"
}

trade_smoke() {
  require_cmd curl

  local summary
  summary="$(curl -fsS "$API_BASE/regional/dashboard/summary")"
  echo "$summary" | grep -q '"dataStatus":"real"'
  echo "$summary" | grep -q '"transferVolume":300'
  echo "$summary" | grep -q '"otcTradeCount":1'
  echo "$summary" | grep -q '"averageOtcPrice":42'
  echo "OK: seeded trade reflected in dashboard aggregation"
}

case "${1:-}" in
  check-db)
    check_db
    ;;
  prepare-db)
    prepare_db
    ;;
  start-cmd)
    print_start_cmd
    ;;
  smoke)
    smoke
    ;;
  seed-trade)
    seed_trade
    ;;
  trade-smoke)
    trade_smoke
    ;;
  *)
    usage
    exit 1
    ;;
esac
