# Regional Dashboard Full Projection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/regional/dashboard/summary` produce real dashboard-ready data for project registration, issued credits, OTC trades, and retired credits from deterministic database data instead of relying on frontend static fallback for the demo path.

**Architecture:** Keep the dashboard as a read-model projection inside `RegionalMarketProjectionService`. Query existing registry entities/views and return an explicit per-section status so `dataStatus: "real"` is only used when project, issuance, trade, and retirement projections all succeed. Use deterministic smoke seed commands only for projection/demo verification; do not build a trading engine, order book, cash ledger, or full national workflow rewrite.

**Tech Stack:** NestJS, TypeORM repositories/views, Jest, Postgres, bash smoke scripts, existing React command center.

## Consensus From DS And Gemini

- Fix `dataStatus` first. Current `real` means only trade storage is readable; the new meaning must require all implemented projection sections to succeed.
- Do not use `market_trade_execution_entity` seed alone as full smoke. Keep it as trade-only smoke.
- Use `CreditBlockRetirementsViewEntity` or equivalent retirement projection with explicit `Completed` filtering.
- `totalIssuedCredits` must represent lifecycle issued credits, not current balance. Prefer `ProjectEntity.creditIssued` or completed issued transactions, and lock the choice with tests.
- OTC average price should be weighted: `SUM(totalPrice) / SUM(amount)`, not simple `AVG(unitPrice)`.
- Define active project statuses before counting projects. First pass: count only `AUTHORIZED` / `AUTHORISED`.
- Keep `supervisoryAlerts` and `regionalMetrics` out of scope or mark them as section-level `not_implemented` / `real_empty`; do not claim the entire visual dashboard is fully real.
- Avoid scope creep: no order book, cash settlement, CAD Trust, AEF reporting, map modeling, regulatory rule engine, or ledger rewrite.

## Execution Flow

### Task 0: Schema And Seed Feasibility Probe

**Files:**
- Read: `backend/services/libs/shared/src/entities/projects.entity.ts`
- Read: `backend/services/libs/shared/src/entities/credit.transactions.entity.ts`
- Read: `backend/services/libs/shared/src/entities/credit.blocks.entity.ts`
- Read: `backend/services/libs/shared/src/view-entities/credit.block.retirements.view.entity.ts`
- Modify later if needed: `scripts/regional-market-smoke.sh`

**Steps:**
1. Inspect required non-null columns and enum values for `ProjectEntity`, `CreditTransactionsEntity`, `CreditBlocksEntity`, `Company`, and `Country`.
2. In a clean smoke DB, manually test the minimum insert set needed for:
   - one authorized project;
   - one issued-credit source record;
   - one OTC trade;
   - one completed retirement;
   - one non-completed retirement for negative filtering.
3. Record the exact seed dependencies before implementing projection queries.
4. Do not proceed if seed data requires invoking unstable full workflow endpoints.

**Verification:**
```bash
scripts/regional-market-smoke.sh prepare-db
psql -h 127.0.0.1 -p 5432 -U cy -d carbondev -c '\d project_entity'
```

### Task 1: Projection Status Contract

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`
- Modify: `web/src/Pages/CommandCenter/regionalMarketApi.ts`

**Steps:**
1. Add a `sectionStatus` object to dashboard summary, with keys:
   - `projects`
   - `issuance`
   - `trades`
   - `retirements`
   - `supervisoryAlerts`
   - `regionalMetrics`
2. Set `dataStatus: "real"` only when projects, issuance, trades, and retirements all succeed.
3. Mark `supervisoryAlerts` and `regionalMetrics` as `not_implemented` or `real_empty`, and keep arrays empty.
4. Add tests showing trade-only availability does not produce full `real`.

**Verification:**
```bash
cd backend/services
yarn test regional-market-projection.service.spec.ts --runInBand
```

### Task 2: Project Registration Projection

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.module.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`

**Steps:**
1. Inject the repository/view needed for project read projection.
2. Define active status as `AUTHORIZED` / `AUTHORISED` for first pass.
3. Return fixed DTO fields for `recentProjectRegistrations`:
   - `id`
   - `refId`
   - `name`
   - `ownerName`
   - `method`
   - `credits`
   - `createdTime`
4. Add tests for both active spelling variants and exclusion of non-active statuses.

**Verification:**
```bash
cd backend/services
yarn test regional-market-projection.service.spec.ts --runInBand
```

### Task 3: Issuance Projection

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.module.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`

**Steps:**
1. Choose one canonical source for `totalIssuedCredits`:
   - preferred: completed issued transactions if available;
   - fallback: `ProjectEntity.creditIssued` if transaction semantics are unreliable.
2. Add a test where issued = 1000, transferred = 300, retired = 100, and `totalIssuedCredits` remains 1000.
3. Do not sum current credit block balances as lifecycle issued credits.

**Verification:**
```bash
cd backend/services
yarn test regional-market-projection.service.spec.ts --runInBand
```

### Task 4: Trade Projection Hardening

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/market-trade-execution.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/market-trade-execution.service.spec.ts`
- Modify if needed: `scripts/regional-market-smoke.sh`

**Steps:**
1. Change average OTC price to weighted average: `SUM(totalPrice) / SUM(amount)`.
2. Filter trade aggregation to settled/offline completed records if status data exists.
3. Keep `seed-trade` and `trade-smoke` labelled as trade-only smoke.
4. Add a test with two trades of different amount and unit price to prove weighted average.

**Verification:**
```bash
cd backend/services
yarn test market-trade-execution.service.spec.ts regional-market-projection.service.spec.ts --runInBand
```

### Task 5: Retirement Projection

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.module.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`

**Steps:**
1. Use `CreditBlockRetirementsViewEntity` if it has the fields needed.
2. Apply explicit `Completed` status filtering in the projection query.
3. Add a test where completed retirement is counted and pending/rejected/cancelled records are excluded.

**Verification:**
```bash
cd backend/services
yarn test regional-market-projection.service.spec.ts --runInBand
```

### Task 6: Full Dashboard Demo Seed And Smoke

**Files:**
- Modify: `scripts/regional-market-smoke.sh`
- Modify: `docs/regional-carbon-market/demo-flow.md`
- Optionally create: `backend/services/src/regional-market-api/regional-dashboard-demo-seed.spec.ts`

**Steps:**
1. Add `seed-dashboard-demo` for a clean smoke DB.
2. Seed deterministic project, issuance, trade, and retirement records.
3. Add `dashboard-demo-smoke` to assert exact expected values:
   - `dataStatus: "real"`
   - `activeProjectCount > 0`
   - `totalIssuedCredits > 0`
   - `transferVolume > 0`
   - `retiredCredits > 0`
   - `recentProjectRegistrations.length > 0`
   - `recentTrades.length > 0`
4. Document that clean DB is required for exact aggregate assertions.

**Verification:**
```bash
scripts/regional-market-smoke.sh prepare-db
scripts/regional-market-smoke.sh seed-dashboard-demo
scripts/regional-market-smoke.sh dashboard-demo-smoke
```

### Task 7: Final Verification And Review Gates

**Steps:**
1. Run focused backend tests:
   ```bash
   cd backend/services
   yarn test regional-market-projection.service.spec.ts market-trade-execution.service.spec.ts regional-market-api.module.integration.spec.ts regional.market.api.integration.spec.ts --runInBand
   ```
2. Run backend build:
   ```bash
   cd backend/services
   yarn build
   ```
3. Run web build:
   ```bash
   cd web
   yarn build
   ```
4. Run live DB smoke:
   ```bash
   scripts/regional-market-smoke.sh seed-dashboard-demo
   scripts/regional-market-smoke.sh dashboard-demo-smoke
   ```
5. Request DS review.
6. Request Poe Gemini 3.1 Pro review.
7. Only commit after both agree there is no blocker.

