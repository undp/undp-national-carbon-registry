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
  seed-dashboard-demo
               Insert deterministic project, issuance, OTC trade, and retirement rows.
  dashboard-demo-smoke
               Verify dashboard projection reflects the deterministic full demo seed.
  reset-dashboard-demo
               Remove deterministic SMOKE dashboard rows.
  seed-dashboard-accounts
               Insert deterministic account-holder rows only.
  seed-dashboard-project
               Insert one authorised project row with zero issued credits.
  seed-dashboard-issuance
               Update the seeded project to 1000 issued credits and insert issuance trace.
  seed-dashboard-trade
               Insert one deterministic OTC trade row.
  seed-dashboard-retirement
               Insert one completed retirement row.
  seed-dashboard-pending-retirement
               Insert one pending retirement row that must not affect retiredCredits.
  dashboard-flow-smoke
               Run staged empty-to-full dashboard API assertions.

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

seed_dashboard_demo() {
  require_cmd psql
  reset_dashboard_demo
  seed_dashboard_accounts
  seed_dashboard_project
  seed_dashboard_issuance
  seed_dashboard_trade
  seed_dashboard_retirement
  seed_dashboard_pending_retirement
  echo "OK: seeded dashboard demo project, issuance, trade, and retirement rows"
}

reset_dashboard_demo() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from market_trade_execution_entity
where "creditTransactionId" = 'SMOKE-TX-1'
   or "creditTransactionId" like 'SMOKE-TX-FULL-%';
delete from credit_transactions_entity
where id like 'SMOKE-ISSUE-%'
   or id like 'SMOKE-RETIRE-%'
   or id like 'SMOKE-RETIRE-PENDING-%';
delete from project_entity where "refId" like 'SMOKE-PRJ-%';
delete from company where "companyId" between 900001 and 900015;
SQL

  echo "OK: reset dashboard demo rows"
}

seed_dashboard_accounts() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from company where "companyId" between 900001 and 900015;
insert into company (
  "companyId",
	  name,
	  "companyRole",
	  state,
	  "createdTime",
	  provinces,
	  regions
	)
	select
	  900000 + n,
  case
    when n <= 10 then 'Smoke Project Developer ' || n
    when n <= 14 then 'Smoke Independent Certifier ' || (n - 10)
    else 'Smoke Regional Authority'
  end,
  case
    when n <= 10 then 'PD'
    when n <= 14 then 'IC'
    else 'DNA'
	  end::company_companyrole_enum,
	  '1',
	  1780272000000 + n,
	  ARRAY['河南省']::varchar[],
	  ARRAY[
	    case n
	      when 1 then '信阳市'
	      when 2 then '南阳市'
	      when 3 then '三门峡市'
	      when 4 then '开封市'
	      when 5 then '许昌市'
	      when 6 then '周口市'
	      when 7 then '商丘市'
	      when 8 then '驻马店市'
	      when 9 then '洛阳市'
	      when 10 then '郑州市'
	      when 11 then '安阳市'
	      when 12 then '新乡市'
	      when 13 then '焦作市'
	      when 14 then '平顶山市'
	      when 15 then '濮阳市'
	      else '郑州市'
	    end
	  ]::varchar[]
	from generate_series(1, 15) as n;
SQL

  echo "OK: seeded dashboard account rows"
}

seed_dashboard_project() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from project_entity where "refId" like 'SMOKE-PRJ-%';
insert into project_entity (
  "refId",
  "serialNumber",
  title,
  "companyId",
  "independentCertifiers",
  "projectProposalStage",
  sector,
  "sectoralScope",
  "txType",
  "txRef",
  "txTime",
  "createTime",
  "updateTime",
  "creditEst",
  "creditBalance",
  "creditRetired",
  "creditTransferred",
  "creditIssued",
  "creditChange"
)
select
  'SMOKE-PRJ-' || n,
  'SMOKE-SN-' || n,
  'Smoke Regional Solar Project ' || n,
  900000 + n,
  ARRAY[900010]::bigint[],
  case when n % 2 = 0 then 'AUTHORIZED' else 'AUTHORISED' end::project_entity_projectproposalstage_enum,
  case when n % 3 = 0 then 'Forestry' else 'Energy' end,
  case when n % 3 = 0 then 'Afforestation' else 'Renewable energy' end,
  '0',
  'SMOKE-TXREF-' || n,
  1780272000000 + n,
  1780272000000 + n,
  1780272000000 + n,
  1500,
  0,
  0,
  0,
  0,
  0
from generate_series(1, 15) as n;
SQL

  echo "OK: seeded dashboard project row"
}

seed_dashboard_issuance() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from credit_transactions_entity where id like 'SMOKE-ISSUE-%';
update project_entity
set "creditIssued" = case when "refId" like 'SMOKE-PRJ-%' then
      case
        when regexp_replace("refId", '^SMOKE-PRJ-', '')::int <= 10 then 1500
        else 0
      end
    else "creditIssued" end,
    "creditBalance" = case
      when regexp_replace("refId", '^SMOKE-PRJ-', '')::int <= 10 then 1500
      else 0
    end,
    "creditChange" = case
      when regexp_replace("refId", '^SMOKE-PRJ-', '')::int <= 10 then 1500
      else 0
    end,
    "updateTime" = 1780272000000
where "refId" like 'SMOKE-PRJ-%';
insert into credit_transactions_entity (
  id,
  "senderId",
  "recieverId",
  type,
  status,
  "creditBlockId",
  "serialNumber",
  amount,
  "projectRefId",
  "retirementType",
  remarks,
  country,
  "organizationName",
  "createTime"
)
select
  'SMOKE-ISSUE-' || n,
  null,
  900000 + n,
  'Issued'::credit_transactions_entity_type_enum,
  'Completed'::credit_transactions_entity_status_enum,
  'SMOKE-CB-' || n,
  'SMOKE-SN-' || n,
  1500,
  'SMOKE-PRJ-' || n,
  null,
  'Smoke issuance ' || n,
  'CN',
  'Smoke Organization ' || n,
  1780272000000 + n
from generate_series(1, 10) as n;
SQL

  echo "OK: seeded dashboard issuance row"
}

seed_dashboard_retirement() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from credit_transactions_entity where id like 'SMOKE-RETIRE-%';
insert into credit_transactions_entity (
  id,
  "senderId",
  "recieverId",
  type,
  status,
  "creditBlockId",
  "serialNumber",
  amount,
  "projectRefId",
  "retirementType",
  remarks,
  country,
  "organizationName",
  "createTime"
)
with retirement_plan(n, retirement_sender_id, project_n) as (
  values
    (1, 900010, 1),
    (2, 900009, 2),
    (3, 900014, 3),
    (4, 900011, 4),
    (5, 900012, 5),
    (6, 900013, 6),
    (7, 900015, 7),
    (8, 900015, 8),
    (9, 900010, 9),
    (10, 900009, 10)
)
select
  'SMOKE-RETIRE-' || n,
  retirement_sender_id,
  0,
  'Retired'::credit_transactions_entity_type_enum,
  'Completed'::credit_transactions_entity_status_enum,
  'SMOKE-CB-' || project_n,
  'SMOKE-SN-' || project_n,
  150,
  'SMOKE-PRJ-' || project_n,
  'Voluntary Cancellations'::credit_transactions_entity_retirementtype_enum,
  'Smoke completed retirement ' || n,
  'CN',
  'Smoke Organization ' || n,
  1780358400000 + n
from retirement_plan;
SQL

  echo "OK: seeded dashboard completed retirement row"
}

seed_dashboard_pending_retirement() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from credit_transactions_entity where id like 'SMOKE-RETIRE-PENDING-%';
insert into credit_transactions_entity (
  id,
  "senderId",
  "recieverId",
  type,
  status,
  "creditBlockId",
  "serialNumber",
  amount,
  "projectRefId",
  "retirementType",
  remarks,
  country,
  "organizationName",
  "createTime"
)
select
  'SMOKE-RETIRE-PENDING-' || n,
  900010,
  0,
  'Retired'::credit_transactions_entity_type_enum,
  'Pending'::credit_transactions_entity_status_enum,
  'SMOKE-CB-' || n,
  'SMOKE-SN-' || n,
  50,
  'SMOKE-PRJ-' || n,
  'Voluntary Cancellations'::credit_transactions_entity_retirementtype_enum,
  'Smoke pending retirement excluded from dashboard ' || n,
  'CN',
  'Smoke Organization ' || n,
  1780444800000 + n
from generate_series(1, 10) as n;
SQL

  echo "OK: seeded dashboard pending retirement row"
}

seed_dashboard_trade() {
  require_cmd psql

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
delete from market_trade_execution_entity where "creditTransactionId" like 'SMOKE-TX-FULL-%';
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
)
with trade_plan(n, seller_id, buyer_id, project_n) as (
  values
    (1, 900001, 900010, 1),
    (2, 900002, 900009, 2),
    (3, 900003, 900014, 3),
    (4, 900004, 900011, 4),
    (5, 900005, 900012, 5),
    (6, 900006, 900013, 6),
    (7, 900007, 900015, 7),
    (8, 900008, 900015, 8),
    (9, 900001, 900009, 1),
    (10, 900002, 900010, 2),
    (11, 900005, 900014, 5),
    (12, 900007, 900011, 7),
    (13, 900004, 900012, 4),
    (14, 900003, 900013, 3),
    (15, 900008, 900010, 8)
)
select
  'SMOKE-TX-FULL-' || n,
  'SMOKE-CB-' || project_n,
  seller_id,
  buyer_id,
  'SMOKE-PRJ-' || project_n,
  'SMOKE-SN-' || project_n,
  300,
  42,
  12600,
  'CNY',
  ('2026-06-11T00:00:00.000Z'::timestamptz + (n || ' minutes')::interval),
  'SETTLED_OFFLINE'
from trade_plan;
SQL

  echo "OK: seeded dashboard trade row"
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

dashboard_demo_smoke() {
  require_cmd curl
  require_cmd node

  local summary
  summary="$(curl -fsS "$API_BASE/regional/dashboard/summary")"
  SUMMARY_JSON="$summary" node <<'NODE'
const summary = JSON.parse(process.env.SUMMARY_JSON);
const failures = [];
const metrics = summary.metrics || {};

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(summary.dataStatus === "real", "dataStatus should be real");
assert(summary.projectionAvailable === true, "projectionAvailable should be true");
assert(metrics.totalIssuedCredits >= 15000, "totalIssuedCredits should include seeded 15000 credits");
assert(metrics.activeProjectCount >= 15, "activeProjectCount should include seeded authorised projects");
assert(metrics.transferVolume >= 4500, "transferVolume should include seeded 4500-credit OTC trades");
assert(metrics.retiredCredits >= 1500, "retiredCredits should include seeded completed retirements");
assert(metrics.averageOtcPrice > 0, "averageOtcPrice should be projected");
assert(metrics.otcTradeCount >= 15, "otcTradeCount should include seeded OTC trades");
assert(summary.accountSummary?.totalAccounts >= 15, "accountSummary should include seeded account holders");
assert(
  summary.accountSummary?.accountTypes?.some((item) => item.label === "项目业主" && item.count >= 10),
  "accountSummary should include seeded project developers"
);
assert(
  summary.accountSummary?.accountTypes?.some((item) => item.label === "核证机构" && item.count >= 4),
  "accountSummary should include seeded independent certifiers"
);
assert(Array.isArray(summary.recentProjectRegistrations), "recentProjectRegistrations should be an array");
assert(
  summary.recentProjectRegistrations.length === 10,
  "recentProjectRegistrations should return the 10 most recent seeded projects"
);
assert(Array.isArray(summary.recentTrades), "recentTrades should be an array");
assert(
  summary.recentTrades.length === 10,
  "recentTrades should return the 10 most recent seeded OTC trades"
);
const regionalMetrics = summary.regionalMetrics || [];
const regionalIssued = regionalMetrics.reduce((total, metric) => total + Number(metric.issuedCredits || 0), 0);
const regionalSold = regionalMetrics.reduce((total, metric) => total + Number(metric.soldCredits || 0), 0);
const regionalBought = regionalMetrics.reduce((total, metric) => total + Number(metric.boughtCredits || 0), 0);
const regionalRetired = regionalMetrics.reduce((total, metric) => total + Number(metric.retiredCredits || 0), 0);
const zhengzhou = regionalMetrics.find((metric) => metric.city === "郑州市");

assert(regionalIssued === metrics.totalIssuedCredits, "regional issued credits should equal totalIssuedCredits");
assert(regionalSold === metrics.transferVolume, "regional sold credits should equal transferVolume");
assert(regionalBought === metrics.transferVolume, "regional bought credits should equal transferVolume");
assert(regionalRetired === metrics.retiredCredits, "regional retired credits should equal retiredCredits");
assert(Boolean(zhengzhou), "regionalMetrics should include Zhengzhou");
assert(zhengzhou?.issuedCredits === 1500, "Zhengzhou issuedCredits should be 1500");
assert(zhengzhou?.boughtCredits === 900, "Zhengzhou boughtCredits should be 900");
assert(zhengzhou?.retiredCredits === 300, "Zhengzhou retiredCredits should be 300");
assert(zhengzhou?.availableBalance === 2100, "Zhengzhou availableBalance should be 2100");

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
NODE
  echo "OK: seeded full dashboard demo projection is available"
}

assert_dashboard_stage() {
  require_cmd curl
  require_cmd node

  local stage="$1"
  local expected_accounts="$2"
  local expected_projects="$3"
  local expected_issued="$4"
  local expected_transfer="$5"
  local expected_retired="$6"
  local expected_trades="$7"
  local expected_recent_projects="$8"
  local expected_recent_trades="$9"

  local summary
  summary="$(curl -fsS "$API_BASE/regional/dashboard/summary")"
  SUMMARY_JSON="$summary" \
  STAGE="$stage" \
  EXPECTED_ACCOUNTS="$expected_accounts" \
  EXPECTED_PROJECTS="$expected_projects" \
  EXPECTED_ISSUED="$expected_issued" \
  EXPECTED_TRANSFER="$expected_transfer" \
  EXPECTED_RETIRED="$expected_retired" \
  EXPECTED_TRADES="$expected_trades" \
  EXPECTED_RECENT_PROJECTS="$expected_recent_projects" \
  EXPECTED_RECENT_TRADES="$expected_recent_trades" \
  node <<'NODE'
const summary = JSON.parse(process.env.SUMMARY_JSON);
const metrics = summary.metrics || {};
const failures = [];
const expected = {
  accounts: Number(process.env.EXPECTED_ACCOUNTS),
  projects: Number(process.env.EXPECTED_PROJECTS),
  issued: Number(process.env.EXPECTED_ISSUED),
  transfer: Number(process.env.EXPECTED_TRANSFER),
  retired: Number(process.env.EXPECTED_RETIRED),
  trades: Number(process.env.EXPECTED_TRADES),
  recentProjects: Number(process.env.EXPECTED_RECENT_PROJECTS),
  recentTrades: Number(process.env.EXPECTED_RECENT_TRADES),
};

function assertEqual(actual, expectedValue, label) {
  if (actual !== expectedValue) {
    failures.push(`${label}: expected ${expectedValue}, got ${actual}`);
  }
}

if (summary.dataStatus !== "real") failures.push(`dataStatus: expected real, got ${summary.dataStatus}`);
if (summary.projectionAvailable !== true) failures.push("projectionAvailable: expected true");
for (const section of ["projects", "issuance", "trades", "retirements", "accounts"]) {
  if (summary.sectionStatus?.[section] !== "real") {
    failures.push(`sectionStatus.${section}: expected real, got ${summary.sectionStatus?.[section]}`);
  }
}

assertEqual(summary.accountSummary?.totalAccounts ?? 0, expected.accounts, "accountSummary.totalAccounts");
assertEqual(metrics.activeProjectCount ?? 0, expected.projects, "metrics.activeProjectCount");
assertEqual(metrics.totalIssuedCredits ?? 0, expected.issued, "metrics.totalIssuedCredits");
assertEqual(metrics.transferVolume ?? 0, expected.transfer, "metrics.transferVolume");
assertEqual(metrics.retiredCredits ?? 0, expected.retired, "metrics.retiredCredits");
assertEqual(metrics.otcTradeCount ?? 0, expected.trades, "metrics.otcTradeCount");
assertEqual(summary.recentProjectRegistrations?.length ?? 0, expected.recentProjects, "recentProjectRegistrations.length");
assertEqual(summary.recentTrades?.length ?? 0, expected.recentTrades, "recentTrades.length");

if (failures.length) {
  console.error(`Dashboard stage ${process.env.STAGE} failed`);
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
NODE
  echo "OK: dashboard flow stage ${stage}"
}

dashboard_flow_smoke() {
  reset_dashboard_demo
  assert_dashboard_stage "empty" 0 0 0 0 0 0 0 0

  seed_dashboard_accounts
  assert_dashboard_stage "accounts" 15 0 0 0 0 0 0 0

  seed_dashboard_project
  assert_dashboard_stage "project" 15 15 0 0 0 0 10 0

  seed_dashboard_issuance
  assert_dashboard_stage "issuance" 15 15 15000 0 0 0 10 0

  seed_dashboard_trade
  assert_dashboard_stage "trade" 15 15 15000 4500 0 15 10 10

  seed_dashboard_retirement
  assert_dashboard_stage "retirement" 15 15 15000 4500 1500 15 10 10

  seed_dashboard_pending_retirement
  assert_dashboard_stage "pending-retirement-excluded" 15 15 15000 4500 1500 15 10 10
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
  seed-dashboard-demo)
    seed_dashboard_demo
    ;;
  dashboard-demo-smoke)
    dashboard_demo_smoke
    ;;
  reset-dashboard-demo)
    reset_dashboard_demo
    ;;
  seed-dashboard-accounts)
    seed_dashboard_accounts
    ;;
  seed-dashboard-project)
    seed_dashboard_project
    ;;
  seed-dashboard-issuance)
    seed_dashboard_issuance
    ;;
  seed-dashboard-trade)
    seed_dashboard_trade
    ;;
  seed-dashboard-retirement)
    seed_dashboard_retirement
    ;;
  seed-dashboard-pending-retirement)
    seed_dashboard_pending_retirement
    ;;
  dashboard-flow-smoke)
    dashboard_flow_smoke
    ;;
  *)
    usage
    exit 1
    ;;
esac
