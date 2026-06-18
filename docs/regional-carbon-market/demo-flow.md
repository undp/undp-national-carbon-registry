# Regional Carbon Market Demo Flow

This demo presents the extracted subsystem as a regional carbon asset registry plus OTC settlement PoC. It does not demonstrate a continuous exchange, order book, cash ledger, or clearing engine.

## Runtime

Local smoke prerequisites:

- `pg_isready`, `psql`, `createdb`, and `curl` are available on `PATH`.
- A local Postgres server is reachable.
- Database settings can be overridden with `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `DB_EVENTS_NAME`, and `DB_PASSWORD`.
- The default smoke values are `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USER=cy`, `DB_NAME=carbondev`, and `DB_EVENTS_NAME=carbondevEvents`.

Prepare the local Postgres smoke databases:

```bash
scripts/regional-market-smoke.sh check-db
scripts/regional-market-smoke.sh prepare-db
```

Print the regional API startup command for the current database environment:

```bash
scripts/regional-market-smoke.sh start-cmd
```

Protected regional workflow routes require an authenticated request user. For a local PoC without the national auth stack, start the API with explicit `REGIONAL_MARKET_DEMO_MODE=true`. The script prints that command with `RUN_MODULE=regional-market-api`, `RUN_PORT=3001`, and the active `DB_*` settings.

The smoke script does not start or stop the API process. Run the printed startup command in a separate terminal, wait for `Nest application successfully started`, then run the smoke command below.

Start the web dashboard:

```bash
cd web
VITE_REGIONAL_MARKET_API_BASE=http://127.0.0.1:3001 yarn dev --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:3030/command-center
```

The command center header shows the current data mode: `实时数据` for real projection data, `演示数据` for backend fallback, `连接中` while loading, and `API 不可用` when the regional API cannot be reached.

The current real projection scope covers account-holder counts, project registration rows, issued-credit totals, OTC trade metrics, and completed retirement totals. The map markers, supervisory prompt text, and footer status text remain static demo UI until their data models and interactions are designed.

### Self-contained Railway dashboard

For a Railway preview that does not need Postgres or the Nest regional API, deploy only the `web` service. The frontend now defaults `VITE_REGIONAL_MARKET_API_BASE` to the same origin, so `GET /regional/dashboard/summary` is served from the static fixture at `web/public/regional/dashboard/summary`.

The fixture is generated from the same 50-step dashboard story used by the smoke flow: 15 account/project rows, 10 issuance rows, 15 OTC trades, and 10 completed retirements. Regenerate it after changing the story:

```bash
node scripts/generate-regional-dashboard-static-fixture.mjs
bash scripts/regional-dashboard-static-fixture.test.sh
```

The self-contained preview must consume this same fixture and the same terminology guardrails as the full-stack branch. It may demonstrate the registry lifecycle and executed OTC metadata flow, but it must not claim official trading-system capabilities such as order books, matching, clearing, bank settlement, product listing, CCER transfer to trading platform, trading-account holdings, or exchange account balances.

Only set `VITE_REGIONAL_MARKET_API_BASE` when the dashboard should use a live backend, for example:

```bash
VITE_REGIONAL_MARKET_API_BASE=https://regional-api.example.org
```

## Scenario

1. Create or import an organization account holder.
2. Create or import a user attached to the organization.
3. Submit an initial project document through `POST /regional/projects/documents`.
4. Approve or reject project workflow actions through `POST /regional/projects/documents/action`.
5. Issue credits through `POST /regional/projects/credits/issue` when the project and verification data are ready.
6. Query balances through `POST /regional/credits/balance`.
7. Execute an OTC trade through `POST /regional/otc-trades/execute`.
8. Query transfers through `POST /regional/settlements/transfers/query`.
9. Query retirements through `POST /regional/retirements/query`.
10. Read dashboard projection data through `GET /regional/dashboard/summary`.

## Settlement Framing

The registry transfer changes carbon-credit ownership. Cash movement is assumed to happen offline. The OTC trade endpoint returns:

```json
{
  "cashSettlementMode": "offline",
  "settlementStatus": "SETTLED_OFFLINE"
}
```

If the registry transfer succeeds but the OTC market metadata cannot be recorded, the response is explicitly marked for reconciliation:

```json
{
  "cashSettlementMode": "offline",
  "settlementStatus": "RECONCILIATION_REQUIRED",
  "reconciliationRequired": true
}
```

This is intentional for the PoC. A production exchange would require a separate trading core for order matching, cash accounts, fund freezing, fees, clearing, and market data.

## API Smoke Checks

```bash
scripts/regional-market-smoke.sh smoke
```

The smoke command verifies:

- `GET /regional/info` returns `subsystem: "regional-carbon-market"`.
- `GET /regional/dashboard/summary` returns `dataStatus: "real"` when the project, issuance, trade, and retirement projections are all connected.
- `POST /regional/projects/query` reaches a protected route in explicit demo mode and returns a `data` field.

To verify repository-backed market trade aggregation:

```bash
scripts/regional-market-smoke.sh seed-trade
scripts/regional-market-smoke.sh trade-smoke
```

This inserts a deterministic `SMOKE-TX-1` row into `market_trade_execution_entity` and verifies the dashboard projection reports `transferVolume: 300`, `otcTradeCount: 1`, and `averageOtcPrice: 42`. Use a clean smoke database for exact aggregate assertions.

To verify the full dashboard projection from a first-row demo seed:

```bash
scripts/regional-market-smoke.sh seed-dashboard-demo
scripts/regional-market-smoke.sh dashboard-demo-smoke
```

This inserts deterministic `SMOKE-*` rows for:

- fifteen active account holders from the existing `company` table roles;
- fifteen authorised project registrations;
- ten completed issuance transactions at 1,500 credits each, for 15,000 issued credits;
- fifteen 300-credit OTC trades at unit price 42;
- ten buyer-side completed 150-credit retirements plus ten pending 50-credit retirements that should not contribute to the completed retirement aggregate.

The smoke check verifies that `/regional/dashboard/summary` is fully projection-backed (`dataStatus: "real"`, `projectionAvailable: true`) and that the seeded accounts, projects, trades, issued credits, transfer volume, and completed retirement totals appear in the dashboard data. On a clean smoke database, the expected aggregate values are `totalAccounts: 15`, `totalIssuedCredits: 15000`, `activeProjectCount: 15`, `transferVolume: 4500`, `retiredCredits: 1500`, `otcTradeCount: 15`, and `averageOtcPrice: 42`.

Expected `info` response:

```json
{
  "subsystem": "regional-carbon-market",
  "mode": "registry-otc-settlement",
  "cashSettlementMode": "offline"
}
```

Expected dashboard response shape:

```json
{
  "dataStatus": "real",
  "projectionAvailable": true,
  "projectionErrors": [],
  "sectionStatus": {
    "projects": "real",
    "issuance": "real",
    "trades": "real",
    "retirements": "real",
    "accounts": "real"
  },
  "accountSummary": {
    "totalAccounts": 15,
    "accountTypes": [
      { "label": "市场参与主体", "count": 15, "value": "15 家" },
      { "label": "地方主管机构", "count": 1, "value": "1 家" },
      { "label": "项目业主", "count": 10, "value": "10 家" },
      { "label": "核证机构", "count": 4, "value": "4 家" }
    ]
  },
  "metrics": {
    "totalIssuedCredits": 15000,
    "activeProjectCount": 15,
    "transferVolume": 4500,
    "retiredCredits": 1500,
    "averageOtcPrice": 42,
    "otcTradeCount": 15,
    "otcTradeValue": 189000
  },
  "recentProjectRegistrations": ["10 most recent project rows"],
  "recentTrades": ["10 most recent trade rows"],
  "supervisoryAlerts": [],
  "regionalMetrics": ["full city aggregates with availableBalance"]
}
```

When any projection repository or service is unavailable, the backend returns `dataStatus: "fallback"` and `projectionAvailable: false` with section-level status details. The dashboard treats that as a full demo-data fallback instead of rendering zero-valued API metrics beside mock tables.

## Empty-To-Full Dashboard Flow Test

Use the staged flow smoke when you need to prove that an empty dashboard can become a populated dashboard one data group at a time:

```bash
scripts/regional-market-smoke.sh reset-dashboard-demo
scripts/regional-market-smoke.sh seed-dashboard-accounts
scripts/regional-market-smoke.sh seed-dashboard-project
scripts/regional-market-smoke.sh seed-dashboard-issuance
scripts/regional-market-smoke.sh seed-dashboard-trade
scripts/regional-market-smoke.sh seed-dashboard-retirement
scripts/regional-market-smoke.sh seed-dashboard-pending-retirement
```

The one-command API regression is:

```bash
scripts/regional-market-smoke.sh dashboard-flow-smoke
```

It verifies these stages against `GET /regional/dashboard/summary`:

- empty: account, project, issuance, transfer, retirement, and trade metrics are zero.
- accounts: `totalAccounts` becomes `15`; other dashboard business metrics remain zero.
- project: `activeProjectCount` becomes `15` and `recentProjectRegistrations` returns the 10 most recent seeded projects.
- issuance: `totalIssuedCredits` becomes `15000`.
- trade: `transferVolume` becomes `4500`, `otcTradeCount` becomes `15`, and `recentTrades` returns the 10 most recent seeded trades.
- retirement: `retiredCredits` becomes `1500`.
- pending-retirement-excluded: inserting fifteen pending 50-credit retirements leaves `retiredCredits` at `1500`.

For UI verification, start the web dashboard and open `http://127.0.0.1:3030/command-center` after the staged flow reaches the final state. The page should show `实时数据`, `15 家` account holders, `15 个` registered projects, `15,000 吨` registered credits, `4,500 吨` trade volume, `18.90 万元` trade value, `42.00 元/吨` average price, `SMOKE-PRJ-*` rows in the project table, and `2026-06-11 / 300 / 12,600.00 / 42.00 / OTC 转让` rows in the trade table. Supervisory prompt text, map markers, and the footer remain static by design.

## Demo Data Notes

Use existing `testing/api` setup files for organizations, users, project creation, and credit transfer where possible. Replace placeholder IDs in `testing/api/regional_market_demo.json` with IDs generated by the local database or setup import.
