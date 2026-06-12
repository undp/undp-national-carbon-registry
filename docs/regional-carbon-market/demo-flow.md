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
- `GET /regional/dashboard/summary` returns `dataStatus: "real"` when trade storage is connected.
- `POST /regional/projects/query` reaches a protected route in explicit demo mode and returns a `data` field.

To verify repository-backed market trade aggregation on a clean smoke database:

```bash
scripts/regional-market-smoke.sh seed-trade
scripts/regional-market-smoke.sh trade-smoke
```

This inserts a deterministic `SMOKE-TX-1` row into `market_trade_execution_entity` and verifies the dashboard projection reports `transferVolume: 300`, `otcTradeCount: 1`, and `averageOtcPrice: 42`. Use a clean smoke database for exact aggregate assertions.

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
  "metrics": {
    "totalIssuedCredits": 0,
    "activeProjectCount": 0,
    "transferVolume": 0,
    "retiredCredits": 0,
    "averageOtcPrice": 0
  },
  "recentProjectRegistrations": [],
  "recentTrades": [],
  "supervisoryAlerts": [],
  "regionalMetrics": []
}
```

When trade storage is unavailable, the backend returns `dataStatus: "fallback"` and `projectionAvailable: false`. The dashboard treats that as a full demo-data fallback instead of rendering zero-valued API metrics beside mock tables.

## Demo Data Notes

Use existing `testing/api` setup files for organizations, users, project creation, and credit transfer where possible. Replace placeholder IDs in `testing/api/regional_market_demo.json` with IDs generated by the local database or setup import.
