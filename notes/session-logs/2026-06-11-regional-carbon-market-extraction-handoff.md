# Handoff: Regional Carbon Market Subsystem Extraction From UNDP National Carbon Registry

Date: 2026-06-11
Repository: `/Users/cy/carbon/undp-national-carbon-registry`
Primary user intent: extract a demonstrable regional carbon trading / registry subsystem from the UNDP National Carbon Registry repo, align it with the custom command-center dashboard, and preserve enough implementation context for a new session to continue without re-discovery.

## 1. Executive Summary

The repo is best treated as a regulated carbon registry / ledger system, not as a full exchange. It can support a PoC for:

- organization / user onboarding,
- project registration,
- approval / authorization,
- emission-reduction credit issuance,
- credit block creation,
- OTC-style transfer,
- retirement / cancellation,
- dashboard aggregation.

It does not natively support a complete exchange:

- no order book,
- no matching engine,
- no market order / limit order model,
- no cash account,
- no fund freezing,
- no DVP clearing,
- no settlement batch,
- no trading fee model,
- no real market data service.

Recommended framing for the first implementable subsystem:

> Regional carbon asset registry + OTC transaction settlement PoC.

Do not frame the first extraction as a complete exchange. If a full regional exchange is later required, build a separate Trading Core in front of the registry.

## 2. User Requirements Captured During This Session

The user asked to determine whether, starting from the UNDP repo:

1. the project registration / emission-reduction registration / trading / settlement logic can be extracted;
2. that logic can align with the dashboard data and make the overall project flow basically work;
3. the extraction plan is feasible after review by DeepSeek and Gemini;
4. a detailed handoff should be written so a new session can continue and actually extract the subsystem.

Earlier context also established that the dashboard should support:

- real China map and regional labels,
- rolling project-registration table,
- rolling historical-trade table,
- supervisory alerts,
- opening / market / trade metrics,
- mock data now, later API-backed data.

## 3. Current Frontend Demo State

A command-center dashboard demo was added in the web app.

Changed / added files:

- `web/src/App.tsx`
  - adds route `/command-center`.
- `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
  - dashboard implementation.
- `web/src/Pages/CommandCenter/commandCenter.scss`
  - dashboard styling, globe, map, tables, panels, responsive layout.
- `web/src/types/china-map-geojson.d.ts`
  - local type shim for China map package.
- `web/package.json`
  - dependency changes for map/dashboard rendering.
- `web/yarn.lock`
  - dependency lock changes.
- `web/tsconfig.tsbuildinfo`
  - build cache changed.

Dev server status from prior session:

- Command used: `yarn dev --host 127.0.0.1` inside `web/`.
- URL: `http://127.0.0.1:3030/command-center`.
- The server was running in an exec session at the time of handoff; new sessions should verify with `lsof -i :3030` or restart if needed.

Frontend design notes:

- The dashboard should look like a regulated market command screen, not a marketing site.
- The China map must remain geographically recognizable and fit inside the globe boundary.
- The globe should not be visually empty; keep subtle landmass / graticule texture.
- Latitude and longitude lines should read as curved globe grid lines, not flat horizontal / vertical chart grid lines.
- Font size must be controlled because earlier iterations were too large relative to the screen.
- Rolling tables are expected for project registrations and historical trades.

## 4. Repo Modules Already Identified For Backend Extraction

Core API entry:

- `backend/services/src/national-api/national.api.module.ts`
  - imports `SharedModule`, `CoreModule`;
  - registers `ProjectManagementController`, `DocumentManagementController`, `CreditTransactionsManagementController`, `AnalyticsController`, `CompanyController`, `UserController`, etc.

Project API:

- `backend/services/src/national-api/project-management.controller.ts`
  - `@Controller("projectManagement")`
  - `POST projectManagement/query`
  - `POST projectManagement/getProjectById`
  - `GET projectManagement/logs`

Credit transaction API:

- `backend/services/src/national-api/credit.transactions.management.controller.ts`
  - `@Controller("creditTransactionsManagement")`
  - `POST creditTransactionsManagement/transfer`
  - `POST creditTransactionsManagement/retireRequest`
  - `POST creditTransactionsManagement/performRetireAction`
  - `POST creditTransactionsManagement/queryBalance`
  - `POST creditTransactionsManagement/queryTransfers`
  - `POST creditTransactionsManagement/queryRetirements`

Project query / details service:

- `backend/services/libs/shared/src/project-management/project-management.service.ts`
  - primarily query/details/logs;
  - does not appear to be the primary project creation path.

Project creation / document / approval workflow:

- `backend/services/libs/shared/src/document-management/document-management.service.ts`
  - contains project creation and workflow logic;
  - calls `programmeLedgerService.createProject(...)`;
  - calls `programmeLedgerService.updateProjectProposalStage(...)`;
  - calls `programmeLedgerService.issueCredits(...)`.

Ledger service:

- `backend/services/libs/shared/src/programme-ledger/programme-ledger.service.ts`
  - `createProject` around line 94;
  - `updateProjectProposalStage` around line 131;
  - `issueCredits` around line 308;
  - `transferCredits` around line 505;
  - `addRetireRequest` around line 626;
  - `retirementRequestAction` around line 711.

Credit block service:

- `backend/services/libs/shared/src/credit-blocks-management/credit-blocks-management.service.ts`
  - `transferCreditAmountFromBlocks` around line 17;
  - `getNewCreditBlock` around line 184;
  - handles splitting / generation of credit blocks;
  - depends on serial-number behavior.

Credit transaction service:

- `backend/services/libs/shared/src/credit-transactions-management/credit-transactions-management.service.ts`
  - `transferCredits` around line 57;
  - `createRetireRequest` around line 181;
  - `creditRetirementAction` around line 280;
  - `queryCreditBalances` around line 487;
  - `queryTransfers` around line 531;
  - `queryRetirements` around line 574.

Key entities:

- `backend/services/libs/shared/src/entities/projects.entity.ts`
  - class name: `ProjectEntity`;
  - important fields: `refId`, `serialNumber`, `title`, `companyId`, `independentCertifiers`, `projectProposalStage`, `sector`, `sectoralScope`, `activities`, `creditEst`, `creditBalance`, `creditRetired`, `creditTransferred`, `creditIssued`, `creditChange`.
- `backend/services/libs/shared/src/entities/credit.blocks.entity.ts`
  - class name: `CreditBlocksEntity`;
  - important fields: `creditBlockId`, `txRef`, `txData`, `txType`, `txTime`, `transactionRecords`, `previousOwnerCompanyId`, `ownerCompanyId`, `projectRefId`, `serialNumber`, `vintage`, `creditAmount`, `reservedCreditAmount`, `isNotTransferred`.
- `backend/services/libs/shared/src/entities/credit.transactions.entity.ts`
  - class name: `CreditTransactionsEntity`;
  - important fields: `id`, `senderId`, `recieverId` (note existing spelling), `type`, `status`, `creditBlockId`, `serialNumber`, `amount`, `projectRefId`, retirement fields.
- `backend/services/libs/shared/src/entities/company.entity.ts`
  - class name: `Company`;
  - needed for organization / account holder / project developer / verifier roles.
- `backend/services/libs/shared/src/entities/user.entity.ts`
  - class name: `User`;
  - needed for login / role / company association.
- `backend/services/libs/shared/src/entities/programme.entity.ts`
  - older national-registry programme model;
  - keep as reference or compatibility, but the PoC should prefer the project / credit-block path.

## 5. External Architecture Review Summary

DeepSeek and Gemini were asked to review the same extraction plan from the perspective of carbon registry / trading system architecture.

Shared conclusions:

- The extraction boundary is reasonable for a registry / carbon asset lifecycle subsystem.
- The repo can support asset issuance, transfer, and retirement better than it can support market trading.
- Organization / user / role management must be included or reconstructed.
- Serial number management must be preserved because traceability and credit block splitting depend on it.
- Dashboard metrics should come from an aggregation / projection layer, not from direct heavy joins over ledger tables.
- A new market-trade execution model is required for price, amount, average price, and historical trade metrics.
- A full regional exchange requires new services and cannot be created by extraction alone.

DeepSeek-specific emphasis:

- Add account / balance views because a ledger alone is not enough for operational queries.
- Preserve audit/compliance logs.
- Be careful with hidden NestJS dependency-injection dependencies.
- Lock a known repo commit/tag before extraction.
- Position the first system as "carbon credit registry + OTC transaction settlement", not a continuous auction exchange.

Gemini-specific emphasis:

- UNDP Registry is a regulated asset registry, not a high-frequency trading center.
- Original `CreditTransactionsManagementService` is closer to asset transfer / OTC settlement than market trading.
- For PoC, assume funds are settled offline and the system only performs carbon asset transfer.
- Add `MarketTradeExecutionEntity`, mapped 1:1 or 1:N to `CreditTransactionsEntity`.
- Avoid querying raw registry tables directly from the dashboard; use scheduled projection or materialized views.
- For production trading, use a dual-core architecture:
  - Trading Core for order book, matching, funds, market data, clearing;
  - Registry Core for project, issuance, credit block, transfer, retirement, audit.

## 6. Recommended Subsystem Boundary

### Include In The Extracted Registry Core

Backend modules / concepts to include:

- `NationalAPIModule` as source of controller registration patterns.
- `ProjectManagementController` and service for query/details.
- `DocumentManagementController` and `DocumentManagementService` only insofar as they support project creation / approval / issuance. Consider simplifying the workflow for PoC.
- `CreditTransactionsManagementController` and service.
- `ProgrammeLedgerService` as the central asset ledger service.
- `CreditBlocksManagementService`.
- company / user modules needed for account holder identity and role checks.
- serial number generation / serial number management dependencies.
- audit log entities and services if needed by existing service calls.

Domain concepts to include:

- organization account,
- user,
- project,
- project approval stage,
- credit issuance,
- credit block,
- transfer transaction,
- retirement request,
- retirement action,
- audit log,
- dashboard projection.

### Do Not Include In First PoC

Do not implement these in the first extraction:

- full exchange matching engine;
- continuous order book;
- order cancellation / amendment;
- intraday clearing;
- fund ledger;
- bank integration;
- fee deduction;
- market surveillance;
- K-line / ten-level order book;
- Article 6.2 / ITMO / corresponding adjustment details unless specifically required.

For a regional Chinese-style demonstration, keep the first PoC as voluntary reduction credit registry + OTC transfer + dashboard.

## 7. Target Business Flow For PoC

The first backend flow should be:

```text
1. Admin creates / approves organizations.
2. Project developer creates a project.
3. Authority / admin approves the project.
4. Admin or authorized role issues credits for the project.
5. System creates credit blocks with serial numbers and ownership.
6. Seller and buyer execute an OTC trade through a new trade API.
7. Trade API records price/amount in MarketTradeExecution.
8. Trade API calls existing transfer logic to move credit block ownership.
9. Buyer optionally retires credits.
10. Dashboard projection aggregates projects, issuance, trades, retirements, and map/industry metrics.
```

Important interpretation:

- "Trading" in PoC means agreement-based OTC execution.
- "Settlement" in PoC means carbon asset ownership change in the ledger.
- Fund settlement is assumed offline or mocked.

## 8. New Backend Models Required For Dashboard Alignment

### MarketTradeExecutionEntity

Required because existing credit transactions do not store price or monetary amount.

Suggested fields:

- `tradeId`
- `sellerCompanyId`
- `buyerCompanyId`
- `projectRefId`
- `creditBlockId`
- `serialNumber`
- `volume`
- `unitPrice`
- `totalAmount`
- `currency`
- `tradeTime`
- `tradeType`
  - e.g. `OTC`, later `AUCTION`, `MATCHED`
- `assetTransactionId`
  - link to `CreditTransactionsEntity.id`
- `status`
  - e.g. `PENDING`, `SETTLED`, `FAILED`, `CANCELLED`
- `createdBy`
- `createdTime`
- `updatedTime`

### DashboardMetricsEntity Or Projection Tables

Options:

- one wide table for command-center metrics;
- multiple projection tables by dashboard section;
- database materialized views if the stack supports it cleanly.

Suggested projection groups:

- `dashboard_market_summary`
  - opening subject counts, cumulative trades, cumulative volume, cumulative registered amount, today volume, today amount, average price.
- `dashboard_project_registration`
  - rolling list of project registrations / issuance records.
- `dashboard_trade_history`
  - rolling historical trades.
- `dashboard_region_stats`
  - province/city volume and registered reduction amount.
- `dashboard_industry_stats`
  - sector / industry distribution.
- `dashboard_alerts`
  - regulatory alerts, e.g. pending verification, near-expiry obligations, unusual movement.

### Optional AccountBalanceProjection

Recommended for stability:

- `companyId`
- `availableCreditAmount`
- `reservedCreditAmount`
- `retiredCreditAmount`
- `transferredCreditAmount`
- `lastLedgerTxTime`

This avoids making the dashboard or trade screens compute balances from raw block records every time.

## 9. Dashboard Metric Mapping

| Dashboard metric | Native source | Need new model? | Notes |
| --- | --- | --- | --- |
| 开户主体总数 | `Company` | No | Count by role/state. |
| 项目业主数量 | `Company` / `ProjectEntity.companyId` | No | Can count unique project developers. |
| 项目数量 | `ProjectEntity` | No | Filter approved/active as needed. |
| 登记减排量 | `ProjectEntity.creditIssued` or `CreditBlocksEntity.creditAmount` | No, but projection recommended | Define whether "登记" means issued, registered, or current valid. |
| 当前余额 | `CreditBlocksEntity`, `Company.creditBalance` | No, but projection recommended | Existing `Company.creditBalance` may need validation. |
| 转让量 | `CreditTransactionsEntity` | No | Transfer amount by status/time. |
| 注销量 | `CreditTransactionsEntity` / `CreditBlocksEntity` | No | Depends on retirement status semantics. |
| 交易数量 | `MarketTradeExecutionEntity` | Yes | Existing transfer count is not market trade count. |
| 成交额 | `MarketTradeExecutionEntity.totalAmount` | Yes | Not in registry. |
| 成交均价 | `MarketTradeExecutionEntity.unitPrice` / weighted average | Yes | Weighted average by volume. |
| 历史成交 | `MarketTradeExecutionEntity` | Yes | Link to transfer for audit. |
| 行业分类 | `ProjectEntity.sector`, `sectoralScope` | No | Normalize labels for demo. |
| 区域地图 | `ProjectEntity` / `Company.provinces`, `regions` | No, but may need mock enrichment | Current project entity lacks rich geolocation; use company provinces or add PoC region field. |
| 监管提示 | workflow + trade + dashboard rule engine | Optional new projection | For demo, mock or derive simple rules. |

## 10. Minimum API Contract For PoC

Implement as a new small API surface. It may wrap existing services rather than exposing the full original API.

Suggested route namespace:

- `/regional-market/*`
- or `/carbon-market/*`

### Auth / Organization

- `POST /regional-market/mock-login`
- `GET /regional-market/organizations`
- `POST /regional-market/organizations`
- `GET /regional-market/organizations/:id`

For demo, mock login and fixed roles are acceptable.

### Project Registration

- `POST /regional-market/projects`
- `GET /regional-market/projects`
- `GET /regional-market/projects/:refId`
- `POST /regional-market/projects/:refId/approve`

Implementation:

- use or wrap `DocumentManagementService` for actual creation if feasible;
- for PoC, it is acceptable to simplify and call `ProgrammeLedgerService.createProject` directly with a valid `ProjectEntity` shape.

### Credit Issuance / Registration

- `POST /regional-market/projects/:refId/issue`
- `GET /regional-market/credits/balances`
- `GET /regional-market/credits/blocks`

Implementation:

- call `ProgrammeLedgerService.issueCredits(...)`;
- preserve serial-number and credit-block logic.

### OTC Trade / Asset Settlement

- `POST /regional-market/trades/execute`

Request body:

```json
{
  "sellerCompanyId": 1001,
  "buyerCompanyId": 1002,
  "projectRefId": "PRJ-001",
  "creditBlockId": "CB-001",
  "volume": 5000,
  "unitPrice": 86.14,
  "currency": "CNY",
  "tradeTime": 1781130000000
}
```

Implementation:

1. validate seller owns available credits;
2. write `MarketTradeExecutionEntity` as `PENDING`;
3. call `CreditTransactionsManagementService.transferCredits(...)` or lower-level ledger transfer;
4. update `MarketTradeExecutionEntity` to `SETTLED` and store the resulting transaction id;
5. trigger or enqueue dashboard projection refresh.

### Retirement

- `POST /regional-market/retirements/request`
- `POST /regional-market/retirements/:id/approve`
- `GET /regional-market/retirements`

Implementation:

- wrap `createRetireRequest` and `creditRetirementAction`.

### Dashboard

- `GET /regional-market/dashboard/summary`
- `GET /regional-market/dashboard/project-registrations`
- `GET /regional-market/dashboard/trade-history`
- `GET /regional-market/dashboard/region-stats`
- `GET /regional-market/dashboard/industry-stats`
- `GET /regional-market/dashboard/alerts`

The frontend `/command-center` should consume these endpoints later. Until then, keep local mock data structurally aligned with these response shapes.

## 11. Recommended Implementation Plan For New Session

### Phase 0: Stabilize Working Context

1. Run:

   ```bash
   git status --short
   ```

2. Do not revert existing dashboard work unless explicitly asked.
3. Verify backend installs/builds in the current environment.
4. Record current commit hash:

   ```bash
   git rev-parse HEAD
   ```

5. Identify package manager commands for backend tests/builds from root `package.json` and backend package files.

### Phase 1: Dependency Mapping

Use `rg` before editing.

Commands:

```bash
rg -n "class ProgrammeLedgerService|createProject|issueCredits|transferCredits|addRetireRequest|retirementRequestAction" backend/services/libs/shared/src
rg -n "class CreditTransactionsManagementService|transferCredits|createRetireRequest|creditRetirementAction" backend/services/libs/shared/src
rg -n "class CreditBlocksManagementService|transferCreditAmountFromBlocks|getNewCreditBlock" backend/services/libs/shared/src
rg -n "class DocumentManagementService|createProject|issueCredits|updateProjectProposalStage" backend/services/libs/shared/src
rg -n "SerialNumber|serialNumber|@undp/serial-number-gen" backend/services/libs/shared/src backend/services/src
```

Deliverable:

- a dependency map listing all providers/entities/enums/DTOs needed by the extracted flow.

### Phase 2: Create Regional Market Boundary

Recommended backend shape:

- create a new module near the API layer, e.g.
  - `backend/services/src/national-api/regional-market.controller.ts`, or
  - `backend/services/src/regional-api/*` if a cleaner app boundary is preferred.

For fastest PoC, add a controller under `national-api` and register it in `NationalAPIModule`. For cleaner extraction, create a new Nest module that imports only required shared providers.

Do not fork or rewrite the existing ledger logic first. Wrap it.

### Phase 3: Add Market Trade Entity And Service

Add:

- `backend/services/libs/shared/src/entities/market.trade.execution.entity.ts`
- `backend/services/libs/shared/src/market-trade-execution/market-trade-execution.service.ts`
- DTOs for `ExecuteTradeDto`, `TradeExecutionQueryDto`.

Register the entity/provider wherever `SharedModule` registers TypeORM entities and shared services.

Core method:

```ts
executeOtcTrade(dto: ExecuteTradeDto): Promise<MarketTradeExecutionEntity>
```

It should write the trade record and call the existing credit-transfer path.

### Phase 4: Add Dashboard Projection Service

Add a service such as:

- `backend/services/libs/shared/src/dashboard-projection/dashboard-projection.service.ts`

It should aggregate:

- companies,
- projects,
- credit blocks,
- credit transactions,
- market trade executions.

First implementation can compute live from tables for small PoC data. Add projection tables or cached materialized views once API shapes stabilize.

### Phase 5: Wire Frontend Dashboard To API

Current dashboard is mock-driven. Replace or wrap mock arrays with API calls matching:

- `/regional-market/dashboard/summary`
- `/regional-market/dashboard/project-registrations`
- `/regional-market/dashboard/trade-history`
- `/regional-market/dashboard/region-stats`
- `/regional-market/dashboard/alerts`

Keep demo fallback JSON so the screen works without backend.

### Phase 6: Seed Demo Data

Create deterministic seed data:

- 5-8 organizations:
  - authority/admin,
  - project developers,
  - emitting enterprises,
  - verifier.
- 10-20 projects:
  - renewable energy,
  - forestry carbon sink,
  - energy saving renovation,
  - industrial waste heat recovery.
- issued credit blocks:
  - amounts similar to current dashboard mock values.
- 20-50 trade executions:
  - unit prices around 83-87 CNY/t;
  - dates around 2026-06-03 to 2026-06-10 to align with current dashboard.
- 3-5 retirement records.

### Phase 7: Verification

Minimum checks:

- backend build passes;
- unit tests for trade execution:
  - success transfer;
  - insufficient balance;
  - partial block transfer / block split;
  - trade record links to asset transaction;
  - rollback/failure leaves no fake settled trade.
- dashboard endpoint smoke tests;
- frontend build passes;
- `/command-center` renders nonblank and tables roll.

## 12. Acceptance Criteria

The extracted PoC is acceptable when these work end to end:

1. A project developer exists as a company and user.
2. A project can be created or seeded.
3. A project can be approved.
4. Credits can be issued for that project.
5. A seller owns a credit block.
6. An OTC trade can be executed with volume and price.
7. The credit ownership changes in the registry.
8. A market trade record stores price and total amount.
9. A buyer can retire credits.
10. Dashboard summary reflects:
    - project count,
    - registered / issued credit amount,
    - trade count,
    - traded volume,
    - total amount,
    - weighted average price,
    - historical trades,
    - region stats,
    - industry stats.

## 13. Main Engineering Risks

### Hidden Dependency Injection Risk

NestJS providers may depend on shared services, repositories, config, logger, event emitters, or auth guards not obvious from the top-level service name.

Mitigation:

- map constructor dependencies before moving files;
- initially wrap existing services instead of copying them;
- only physically extract after the flow passes.

### Legacy Model Ambiguity

The repo contains both older `Programme` concepts and newer `ProjectEntity` / project-management concepts.

Mitigation:

- use `ProjectEntity` + credit-block flow for regional PoC;
- keep `Programme` only when an existing method requires compatibility.

### Registry Vs Exchange Scope Creep

Stakeholders may expect "trading system" to mean full exchange.

Mitigation:

- label the first version as OTC transaction settlement;
- document that matching, funds, clearing, and market data are Phase 2+ Trading Core features.

### Credit Block Splitting And Serial Number Integrity

Partial transfers require block splitting and serial-number traceability.

Mitigation:

- reuse `CreditBlocksManagementService.transferCreditAmountFromBlocks`;
- preserve serial number dependencies;
- test partial transfer cases.

### Dashboard Consistency

Dashboard values can drift if computed directly from multiple mutable tables.

Mitigation:

- define projection refresh rules;
- use a dashboard projection service/table;
- make API response shapes stable before optimizing.

### Transactional Integrity

A trade execution has two sides:

- market record with price;
- asset transfer record / ledger mutation.

Mitigation:

- perform both in one DB transaction if possible;
- otherwise write `PENDING` first and only mark `SETTLED` after asset transfer succeeds;
- expose failed trade records for audit.

### Authorization Mismatch

UNDP roles such as DNA / project developer / independent certifier may not map directly to a regional market.

Mitigation:

- introduce a PoC role mapping layer:
  - regulator/admin,
  - project owner,
  - buyer/emitting enterprise,
  - verifier,
  - viewer.

## 14. Recommended Full-System Architecture After PoC

Use dual-core architecture.

### Registry Core

Based on extracted UNDP logic:

- organization and user,
- project registration,
- verification / approval,
- issuance,
- credit block ownership,
- transfer settlement,
- retirement,
- audit and reporting.

### Trading Core

New service, not extracted from UNDP:

- `MarketOrder`
- `OrderBook`
- `MatchingEngine`
- `TradeExecution`
- `FundAccount`
- `FundTransaction`
- `AssetReservation`
- `SettlementBatch`
- `FeeScheme`
- `MarketData`
- `RiskControl`

Registry Core should be the authoritative asset ledger. Trading Core should manage orders, funds, and market activity, then call Registry Core for final asset settlement.

## 15. Suggested Document Set For Complete Regional System

If the user later asks for formal requirements and design docs, create:

1. `REGIONAL_CARBON_MARKET_PRD.md`
   - roles,
   - workflows,
   - functional requirements,
   - non-functional requirements,
   - dashboard requirements,
   - regulatory/audit requirements.

2. `REGISTRY_CORE_DESIGN.md`
   - extracted UNDP modules,
   - domain model,
   - service boundaries,
   - state transitions,
   - API contracts,
   - transaction handling.

3. `TRADING_CORE_DESIGN.md`
   - order lifecycle,
   - matching,
   - funds,
   - clearing,
   - settlement,
   - risk controls.

4. `DASHBOARD_DATA_CONTRACT.md`
   - endpoint response shapes,
   - metric definitions,
   - projection refresh rules,
   - mock/demo seed data.

5. `MIGRATION_AND_EXTRACTION_PLAN.md`
   - extraction steps,
   - dependency map,
   - test plan,
   - cutover plan,
   - known risks.

## 16. Useful Commands For New Session

Start with:

```bash
git status --short
git rev-parse HEAD
rg --files backend/services/src/national-api backend/services/libs/shared/src | rg '(project-management|credit|programme-ledger|document-management|company|user|serial)'
```

Find key backend methods:

```bash
rg -n "createProject|updateProjectProposalStage|issueCredits|transferCredits|addRetireRequest|retirementRequestAction" backend/services/libs/shared/src backend/services/src/national-api
```

Find controllers:

```bash
rg -n "@Controller|@Post|@Get" backend/services/src/national-api/project-management.controller.ts backend/services/src/national-api/credit.transactions.management.controller.ts
```

Run frontend dashboard:

```bash
cd web
yarn dev --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:3030/command-center
```

Build frontend:

```bash
cd web
yarn build
```

## 17. Open Questions For Next Session

1. Should the PoC backend modify the existing `national-api` app, or create a new `regional-api` app/module?
2. Should project creation reuse full `DocumentManagementService`, or use a simplified direct ledger wrapper for PoC?
3. Should dashboard projections be computed live at first, or should projection tables be added immediately?
4. What exact regional scope should demo data represent: Beijing, national voluntary market, or a named province/city cluster?
5. Is fund settlement explicitly out of scope for the first demo, or should a mocked fund ledger be added?
6. Should the dashboard continue to use mock fallback after API wiring?
7. Should Article 6.2 / ITMO / corresponding adjustment concepts be hidden entirely from the regional PoC?

## 18. Strong Recommendation

For the next implementation session, do not begin by copying large portions of the UNDP backend into a new subsystem. Begin by wrapping the existing services with a narrow `RegionalMarketModule` / controller and adding only the missing market-trade and dashboard-projection pieces.

The fastest safe path is:

```text
Existing registry services
-> narrow regional-market API wrapper
-> new MarketTradeExecution entity/service
-> dashboard projection service
-> seed demo data
-> connect /command-center to API
```

Only after this flow works should the team physically split the subsystem into a standalone service or repo.

