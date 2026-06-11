# Regional Carbon Market Extraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract a demonstrable regional carbon asset registry plus OTC transaction settlement subsystem from the UNDP National Carbon Registry codebase and connect it to the command-center dashboard.

**Architecture:** Keep the first extracted system as a registry core, not a full exchange. Reuse the existing project, company, user, ledger, credit-block, transfer, retirement, audit, and serial-number paths, then add a thin regional market facade and dashboard projection layer for market-style metrics. Do not add order matching, cash ledger, DVP settlement, market data depth, or exchange clearing in this phase.

**Tech Stack:** NestJS 9, TypeORM, PostgreSQL/QLDB abstractions already present in `backend/services`, React 18, Vite 6, Ant Design 4, ApexCharts, local command-center dashboard at `/command-center`.

## Working Directory

All work must happen in:

```bash
cd /Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction
```

Use the branch:

```bash
git branch --show-current
```

Expected: `feature/regional-carbon-market-extraction`

## Extraction Principles

- Frame the subsystem as `Regional carbon asset registry + OTC transaction settlement PoC`.
- Preserve project lifecycle, credit issuance, credit-block splitting, serial numbers, transfer, retirement, audit, company, and user identity.
- Add market-style trade records and dashboard projections as new read/facade layers.
- Avoid a full exchange in this branch: no order book, matching engine, cash account, fee ledger, fund freezing, or clearing batch.
- Prefer small commits after each stable slice.
- Keep main worktree untouched.

## Task 1: Baseline Verification And Dependency Map

**Files:**
- Read: `notes/session-logs/2026-06-11-regional-carbon-market-extraction-handoff.md`
- Read: `backend/services/src/national-api/national.api.module.ts`
- Read: `backend/services/libs/shared/src/shared.module.ts`
- Read: `backend/services/libs/shared/src/programme-ledger/programme-ledger.service.ts`
- Read: `backend/services/libs/shared/src/credit-transactions-management/credit-transactions-management.service.ts`
- Read: `backend/services/libs/shared/src/credit-blocks-management/credit-blocks-management.service.ts`
- Create: `docs/regional-carbon-market/dependency-map.md`

**Step 1: Confirm branch and cleanliness**

Run:

```bash
git status --short --branch
```

Expected: branch is `feature/regional-carbon-market-extraction`; no modified files except new plan files if already created.

**Step 2: Build baseline**

Run:

```bash
cd web && yarn build
cd ../backend/services && yarn build
```

Expected: both builds pass. Vite may warn about large chunks.

**Step 3: Write the dependency map**

Create `docs/regional-carbon-market/dependency-map.md` with:

- included controllers;
- included services;
- included entities;
- optional modules to avoid in first PoC;
- hidden dependencies discovered from constructor injection;
- serial number dependency notes;
- dashboard data needs.

**Step 4: Commit**

Run:

```bash
git add docs/plans/2026-06-11-regional-carbon-market-extraction.md docs/regional-carbon-market/dependency-map.md
git commit -m "docs: map regional carbon market extraction boundary"
```

## Task 2: Add A Dedicated Regional API Module Shell

**Files:**
- Create: `backend/services/src/regional-market-api/regional.market.api.module.ts`
- Create: `backend/services/src/regional-market-api/regional.market.api.controller.ts`
- Create: `backend/services/src/regional-market-api/regional.market.api.service.ts`
- Modify: `backend/services/src/main.ts`
- Test: `backend/services/src/regional-market-api/regional.market.api.controller.spec.ts`

**Step 1: Write a failing module/controller test**

Create a spec asserting the health or metadata endpoint returns a registry/OTC subsystem identity, for example:

```ts
expect(await controller.getInfo()).toMatchObject({
  subsystem: "regional-carbon-market",
  mode: "registry-otc-settlement",
});
```

**Step 2: Run the test**

Run:

```bash
cd backend/services
yarn test regional.market.api.controller.spec.ts --runInBand
```

Expected: FAIL because the files do not exist yet.

**Step 3: Implement the module shell**

Add:

- `RegionalMarketAPIModule` importing only the required shared modules at first;
- `RegionalMarketAPIController` with `GET /info`;
- `RegionalMarketAPIService` returning subsystem metadata.

Modify `backend/services/src/main.ts` to support:

```ts
RUN_MODULE=regional-market-api
```

with HTTP base:

```ts
regional
```

**Step 4: Verify**

Run:

```bash
cd backend/services
yarn test regional.market.api.controller.spec.ts --runInBand
yarn build
```

Expected: test and build pass.

**Step 5: Commit**

Run:

```bash
git add backend/services/src/main.ts backend/services/src/regional-market-api
git commit -m "feat: add regional market api module shell"
```

## Task 3: Create A Minimal Regional Shared Module

**Files:**
- Create: `backend/services/libs/shared/src/regional-market/regional-market.module.ts`
- Create: `backend/services/libs/shared/src/regional-market/regional-market.service.ts`
- Create: `backend/services/libs/shared/src/regional-market/regional-market.service.spec.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.module.ts`

**Step 1: Write a failing provider test**

The test should compile `RegionalMarketModule` and assert `RegionalMarketService` can be resolved.

**Step 2: Run the test**

Run:

```bash
cd backend/services
yarn test regional-market.service.spec.ts --runInBand
```

Expected: FAIL until module/service exist.

**Step 3: Implement minimal module imports**

Import only the modules needed by the extracted subsystem:

- `CompanyModule`
- `UserModule`
- `ProjectManagementModule`
- `DocumentManagementModule`
- `ProgrammeLedgerModule`
- `CreditBlocksManagementModule`
- `CreditTransactionsManagementModule`
- `SerialNumberManagementModule`
- `AuditLogsModule`
- `UtilModule`
- `LedgerDbModule` if required transitively

Avoid importing the full `SharedModule` into the new regional module once dependency injection is stable. This is the first real cut toward a smaller subsystem boundary.

**Step 4: Verify**

Run:

```bash
cd backend/services
yarn test regional-market.service.spec.ts --runInBand
yarn build
```

**Step 5: Commit**

Run:

```bash
git add backend/services/libs/shared/src/regional-market backend/services/src/regional-market-api/regional.market.api.module.ts
git commit -m "feat: define regional market shared module"
```

## Task 4: Add Registry Lifecycle Facade Endpoints

**Files:**
- Modify: `backend/services/src/regional-market-api/regional.market.api.controller.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.service.ts`
- Test: `backend/services/src/regional-market-api/regional.market.api.controller.spec.ts`

**Step 1: Write failing tests for facade methods**

Cover these API-level operations:

- query projects;
- get project by ID;
- query credit balance;
- query transfers;
- query retirements.

Mock `RegionalMarketService` and assert the controller delegates correctly.

**Step 2: Implement controller endpoints**

Add regional facade routes under `/regional`, for example:

- `POST /regional/projects/query`
- `POST /regional/projects/getById`
- `POST /regional/credits/balance`
- `POST /regional/settlements/transfers/query`
- `POST /regional/retirements/query`

Map internally to existing project and credit transaction services.

**Step 3: Verify**

Run:

```bash
cd backend/services
yarn test regional.market.api.controller.spec.ts --runInBand
yarn build
```

**Step 4: Commit**

Run:

```bash
git add backend/services/src/regional-market-api backend/services/libs/shared/src/regional-market
git commit -m "feat: expose regional registry lifecycle facade"
```

## Task 5: Preserve Project Creation, Approval, And Issuance Path

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.service.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.controller.ts`
- Test: `backend/services/libs/shared/src/regional-market/regional-market.service.spec.ts`

**Step 1: Write service tests with mocks**

Mock `DocumentManagementService` and `ProgrammeLedgerService` to verify facade methods call the existing workflow path rather than duplicating ledger logic.

Cover:

- project creation request;
- project approval-stage update;
- credit issuance.

**Step 2: Implement facade methods**

Wrap existing calls:

- project creation via `DocumentManagementService`;
- stage updates via existing document/ledger path;
- issuance via `ProgrammeLedgerService.issueCredits(...)` or existing document workflow where the repo expects it.

Keep the facade thin. Do not reimplement credit issuance calculations or serial number rules.

**Step 3: Verify**

Run:

```bash
cd backend/services
yarn test regional-market.service.spec.ts --runInBand
yarn build
```

**Step 4: Commit**

Run:

```bash
git add backend/services/src/regional-market-api backend/services/libs/shared/src/regional-market
git commit -m "feat: wrap regional project approval and issuance workflow"
```

## Task 6: Add OTC Trade Execution Record

**Files:**
- Create: `backend/services/libs/shared/src/entities/market.trade.execution.entity.ts`
- Modify: relevant TypeORM module imports where entities are registered
- Create: `backend/services/libs/shared/src/regional-market/market-trade-execution.service.ts`
- Create: `backend/services/libs/shared/src/regional-market/market-trade-execution.service.spec.ts`

**Step 1: Write failing tests for trade record creation**

Test that an OTC execution record can be created from:

- transfer transaction ID or credit block ID;
- seller company ID;
- buyer company ID;
- project reference;
- serial number;
- credit amount;
- negotiated unit price;
- total price;
- trade time;
- settlement status.

**Step 2: Create entity**

Add fields:

- `id`
- `creditTransactionId`
- `creditBlockId`
- `sellerCompanyId`
- `buyerCompanyId`
- `projectRefId`
- `serialNumber`
- `amount`
- `unitPrice`
- `totalPrice`
- `currency`
- `tradeTime`
- `settlementStatus`
- `createdTime`
- `updatedTime`

Keep the record as market metadata layered over registry transfer, not a replacement for `CreditTransactionsEntity`.

**Step 3: Implement service**

Provide methods:

- `createFromTransfer(...)`
- `queryTrades(...)`
- `getTradeSummary(...)`

**Step 4: Verify**

Run:

```bash
cd backend/services
yarn test market-trade-execution.service.spec.ts --runInBand
yarn build
```

**Step 5: Commit**

Run:

```bash
git add backend/services/libs/shared/src/entities/market.trade.execution.entity.ts backend/services/libs/shared/src/regional-market
git commit -m "feat: record regional otc trade executions"
```

## Task 7: Add OTC Transfer Plus Trade Facade

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.service.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.controller.ts`
- Test: `backend/services/libs/shared/src/regional-market/regional-market.service.spec.ts`
- Test: `backend/services/src/regional-market-api/regional.market.api.controller.spec.ts`

**Step 1: Write failing tests**

Assert the facade:

1. calls existing `CreditTransactionsManagementService.transferCredits(...)`;
2. creates a `MarketTradeExecutionEntity` record;
3. returns both registry transaction and trade metadata.

**Step 2: Implement endpoint**

Add:

```text
POST /regional/otc-trades/execute
```

Payload should include registry transfer fields plus market metadata:

- seller;
- buyer;
- amount;
- project;
- credit block or serial number fields expected by existing service;
- negotiated price;
- currency;
- trade time.

**Step 3: Preserve offline funds assumption**

Return a response field such as:

```json
{ "cashSettlementMode": "offline" }
```

Do not add fund freezing or cash-account logic.

**Step 4: Verify**

Run:

```bash
cd backend/services
yarn test regional-market.service.spec.ts regional.market.api.controller.spec.ts --runInBand
yarn build
```

**Step 5: Commit**

Run:

```bash
git add backend/services/src/regional-market-api backend/services/libs/shared/src/regional-market
git commit -m "feat: execute regional otc trade settlement"
```

## Task 8: Add Dashboard Projection API

**Files:**
- Create: `backend/services/libs/shared/src/entities/regional.market.projection.entity.ts`
- Create: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Create: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.controller.ts`

**Step 1: Write failing projection tests**

Cover summary metrics needed by the command center:

- total issued credits;
- active project count;
- transfer volume;
- retired credits;
- average OTC price;
- recent project registrations;
- recent trades;
- supervisory alerts.

**Step 2: Implement read model**

Create a projection service that queries existing registry and trade tables, or reads from a projection entity if direct aggregation is too costly. Keep the controller surface stable even if the backing implementation changes later.

**Step 3: Add endpoint**

Add:

```text
GET /regional/dashboard/summary
```

Return a shape designed for `CarbonTradingCommandCenter.tsx`, not raw ledger entities.

**Step 4: Verify**

Run:

```bash
cd backend/services
yarn test regional-market-projection.service.spec.ts regional.market.api.controller.spec.ts --runInBand
yarn build
```

**Step 5: Commit**

Run:

```bash
git add backend/services/src/regional-market-api backend/services/libs/shared/src/entities/regional.market.projection.entity.ts backend/services/libs/shared/src/regional-market
git commit -m "feat: add regional market dashboard projection"
```

## Task 9: Connect Command Center To Projection API With Mock Fallback

**Files:**
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Create: `web/src/Pages/CommandCenter/regionalMarketApi.ts`
- Modify: `web/src/Config/apiConfig.ts` if required
- Test/build: `web`

**Step 1: Extract current mock data behind an adapter**

Create a small API adapter that returns the same UI shape whether the backend call succeeds or mock fallback is used.

**Step 2: Wire dashboard load state**

Fetch:

```text
GET /regional/dashboard/summary
```

Show existing command-center visuals with real data when available. Keep mock data as fallback for demo resilience.

**Step 3: Avoid UI redesign**

Do not convert the dashboard into a landing page. Preserve:

- China map;
- rolling project table;
- rolling historical trade table;
- supervisory alerts;
- market/opening/trade metrics;
- command-screen style.

**Step 4: Verify**

Run:

```bash
cd web
yarn build
```

Start local preview if needed:

```bash
yarn dev --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:3030/command-center
```

Check that the dashboard renders with no overlapping text and falls back cleanly if backend is unavailable.

**Step 5: Commit**

Run:

```bash
git add web/src/Pages/CommandCenter web/src/Config/apiConfig.ts
git commit -m "feat: connect command center to regional market projection"
```

## Task 10: Add Seed / Demo Scenario

**Files:**
- Create: `backend/services/src/regional-market-api/regional.market.demo.ts` or a repo-consistent setup/importer file
- Create: `docs/regional-carbon-market/demo-flow.md`
- Optional Modify: `testing/api/carbon.env.json`
- Optional Create: `testing/api/regional_market_demo.csv` or Postman-compatible API samples

**Step 1: Define demo flow**

Document this scenario:

1. create organization/account holder;
2. create user;
3. register project;
4. approve project;
5. issue credits;
6. create credit block;
7. execute OTC transfer;
8. request retirement;
9. approve retirement;
10. view dashboard projection.

**Step 2: Implement repeatable seed or API samples**

Use existing setup/import conventions where possible. Keep seed data regional and demonstrable, but do not hardcode it into production services.

**Step 3: Verify**

Run the backend build and, if a database is available, execute the flow against local API:

```bash
cd backend/services
yarn build
RUN_MODULE=regional-market-api RUN_PORT=3001 yarn start:dev
```

Then call:

```text
GET http://127.0.0.1:3001/regional/info
GET http://127.0.0.1:3001/regional/dashboard/summary
```

**Step 4: Commit**

Run:

```bash
git add docs/regional-carbon-market/demo-flow.md backend/services/src/regional-market-api testing/api
git commit -m "docs: add regional market demo flow"
```

## Task 11: Final Verification

**Files:**
- All changed files

**Step 1: Check status**

Run:

```bash
git status --short --branch
```

Expected: only intentional changes staged/unstaged before final commit, or clean after final commit.

**Step 2: Backend verification**

Run:

```bash
cd backend/services
yarn test --runInBand
yarn build
```

If full test suite is too slow or contains pre-existing failures, record exact failures in the final handoff and at minimum run all new regional market specs plus `yarn build`.

**Step 3: Frontend verification**

Run:

```bash
cd web
yarn build
```

Expected: build passes; Vite chunk warning is acceptable if unchanged from baseline.

**Step 4: Manual route verification**

Run backend:

```bash
cd backend/services
RUN_MODULE=regional-market-api RUN_PORT=3001 yarn start:dev
```

Run frontend:

```bash
cd web
yarn dev --host 127.0.0.1
```

Verify:

- `http://127.0.0.1:3001/regional/info`
- `http://127.0.0.1:3001/regional/dashboard/summary`
- `http://127.0.0.1:3030/command-center`

**Step 5: Write completion handoff**

Create:

```text
notes/session-logs/2026-06-11-regional-carbon-market-extraction-completion.md
```

Include:

- final subsystem boundary;
- routes added;
- entities added;
- tests run;
- known limitations;
- remaining steps for a real exchange.

**Step 6: Final commit**

Run:

```bash
git add .
git commit -m "docs: record regional market extraction completion"
```

## Expected End State

- New `regional-market-api` backend module can run independently through `RUN_MODULE=regional-market-api`.
- Extracted backend surface exposes registry lifecycle, issuance, OTC transfer/settlement, retirement, and dashboard projection endpoints.
- Existing ledger and serial-number logic remain the source of truth.
- Market trade price/history is represented by a new entity layered over credit transactions.
- Command-center dashboard can use backend projection data with mock fallback.
- The subsystem is demonstrably useful as a regional carbon asset registry and OTC settlement PoC, while clearly not claiming to be a complete exchange.
