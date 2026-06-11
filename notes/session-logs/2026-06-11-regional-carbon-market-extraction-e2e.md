# Regional Carbon Market Extraction E2E Usability Verification

Date: 2026-06-11
Worktree: `/Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction`
Branch: `feature/regional-carbon-market-extraction`

## Verification Scope

Task 11 verifies that the extracted regional carbon market PoC can run as:

- a standalone `regional-market-api` Nest module;
- a command-center dashboard connected to `/regional/dashboard/summary`;
- a dashboard that still renders with mock fallback data when the regional API is unavailable.

## Commands Run

Backend focused tests:

```bash
cd backend/services
yarn test regional-market.service.spec.ts regional.market.api.controller.spec.ts market-trade-execution.service.spec.ts regional-market-projection.service.spec.ts --runInBand
```

Result: 4 suites passed, 20 tests passed.

Backend build:

```bash
cd backend/services
yarn build
```

Result: Nest build passed.

Frontend build:

```bash
cd web
yarn build
```

Result: Vite build passed. Existing large chunk warning remains.

## Runtime Issues Found And Fixed

### Node 25 Auth Dependency Loading

Initial regional API startup failed before the regional module started:

```text
TypeError: Cannot read properties of undefined (reading 'prototype')
```

Root cause: `backend/services/src/main.ts` statically imported national/auth modules even when `RUN_MODULE=regional-market-api`. Under Node `v25.8.1`, the `@nestjs/jwt -> jsonwebtoken -> jwa -> buffer-equal-constant-time` dependency chain touched `SlowBuffer.prototype.equal`.

Fix: changed `main.ts` to dynamically import runtime modules inside the `RUN_MODULE` switch. The regional API no longer loads national/auth dependencies during startup.

### Shared Server UtilModule Assumption

After dynamic import, regional API startup failed at:

```text
Nest could not select the given module (it does not exist in current context)
```

Root cause: `backend/services/src/server.ts` unconditionally called `useContainer(nestApp.select(UtilModule), ...)`, but the extracted regional API intentionally avoids the heavy `UtilModule`.

Fix: skip `UtilModule` class-validator binding for `RegionalMarketAPIModule`.

### Dashboard Projection Without Trade Repository

`GET /regional/dashboard/summary` initially returned 500:

```text
MarketTradeExecution repository is not available
```

Root cause: the minimal regional module can run without TypeORM repository registration. The projection service had a `MarketTradeExecutionService` provider, but no repository-backed storage.

Fix: `RegionalMarketProjectionService` now falls back to empty metrics and empty recent trades when trade storage is unavailable. A regression test was added.

## API Smoke Results

Regional API command:

```bash
cd backend/services
RUN_MODULE=regional-market-api RUN_PORT=3001 yarn start:dev
```

Startup evidence:

- mapped `/regional/info`;
- mapped `/regional/projects/query`;
- mapped `/regional/projects/getById`;
- mapped `/regional/credits/balance`;
- mapped `/regional/settlements/transfers/query`;
- mapped `/regional/retirements/query`;
- mapped `/regional/projects/documents`;
- mapped `/regional/projects/documents/action`;
- mapped `/regional/projects/credits/issue`;
- mapped `/regional/otc-trades/execute`;
- mapped `/regional/dashboard/summary`;
- reported `Nest application successfully started`.

`GET /regional/info`:

```json
{
  "subsystem": "regional-carbon-market",
  "mode": "registry-otc-settlement",
  "cashSettlementMode": "offline"
}
```

`GET /regional/dashboard/summary`:

```json
{
  "metrics": {
    "totalIssuedCredits": 0,
    "activeProjectCount": 0,
    "transferVolume": 0,
    "retiredCredits": 0,
    "averageOtcPrice": 0,
    "otcTradeCount": 0,
    "otcTradeValue": 0
  },
  "recentProjectRegistrations": [],
  "recentTrades": [],
  "supervisoryAlerts": [],
  "regionalMetrics": []
}
```

## Browser Usability Results

API-backed dashboard command:

```bash
cd web
VITE_REGIONAL_MARKET_API_BASE=http://127.0.0.1:3001 yarn dev --host 127.0.0.1
```

Vite selected `http://127.0.0.1:3031/` because port 3030 was occupied.

Headless Chrome DOM check for:

```text
http://127.0.0.1:3031/command-center
```

Observed:

- header `区域温室气体自愿减排交易数据平台`;
- panels `开户情况`, `减排量登记情况`, `市场行情`, `当日成交数据`, `监管提示`, `历史成交情况`;
- China map SVG with `cc-china-map` and province paths;
- API-backed zero metrics rendered as `0 吨`, `0 个`, and `0.00 元/吨`;
- rolling project and historical trade tables still render fallback rows when projection arrays are empty.

Fallback dashboard command:

```bash
cd web
VITE_REGIONAL_MARKET_API_BASE=http://127.0.0.1:3999 yarn dev --host 127.0.0.1
```

Vite selected `http://127.0.0.1:3030/`.

Headless Chrome DOM check for:

```text
http://127.0.0.1:3030/command-center
```

Observed:

- header and all command-center panels rendered;
- mock project row `海上风电场减排项目` rendered;
- mock historical trade row `2026-06-10` rendered;
- mock metrics rendered, including `13,844,658 吨` and `48,500 吨`;
- no Vite error overlay appeared in the dumped DOM.

## Known Limitations

- Headless Chrome did not exit by itself because the dashboard intentionally has a live clock interval; the DOM was captured successfully and the process was killed after timeout.
- E2E did not execute a real project issuance or OTC transfer against a database. It verified standalone regional API startup, smoke endpoints, dashboard projection, and dashboard fallback behavior.
- With the minimal regional module, dashboard projection uses empty metrics until TypeORM repositories or a materialized projection store are wired into the regional runtime.
