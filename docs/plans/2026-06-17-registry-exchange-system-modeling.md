# Registry And Exchange System Modeling Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Use TDD for each model/service change.

**Goal:** Add the minimum registry/trading-system boundary model needed to move beyond the current dashboard PoC without claiming a production exchange. The first implementation phase should make CCER transfer-in, executed trades, clearing/delivery results, and registry holding changes explicit.

**Architecture:** Keep the existing backend service boundary for now. Add a trading-context read/write model beside the current registry entities, with explicit links back to registry holdings and credit transactions. The dashboard remains a read model; it should consume finalized results, not infer business causality from UI fixtures.

**Non-Goals:** No order book, matching engine, bid/ask depth, listed-agreement order workflow, bank settlement, cash account ledger, fee collection, invoice workflow, official operator-management module, or production regulatory-warning engine in phase 1.

## Source Alignment

- `source_of_truth/extracted-text/2023-voluntary-emission-reduction-trading-management-measures-trial.txt` separates registry ownership/lifecycle from trading and settlement services.
- `source_of_truth/extracted-text/2025-national-ghg-voluntary-emission-reduction-trading-client-manual.txt` requires trading account and registry account concepts, CCER transfer-in/out flows, trading-account holdings, trade records, and settlement/result queries.
- `docs/regional-carbon-market/terminology-guardrails.md` defines the current extracted subsystem as a regional registry plus executed OTC metadata PoC, not a full trading system.
- `docs/regional-carbon-market/dashboard-sot-compliance-review.md` records the current closed-out dashboard fixes and the remaining model gaps.

## Phase 1 Scope

Model these concepts first:

| Model | Purpose | Phase 1 Boundary |
| --- | --- | --- |
| `RegistryAccountBinding` | Links a registry-side holder/company to a trading-system participant/account. | Store binding and status only; no official account-opening workflow. |
| `TradingInstrument` | Represents a tradable CCER subject derived from registry/project/credit metadata. | Maintain listed metadata for executed-trade reference only; no quote screen or listing workflow UI. |
| `CcerTransferToTradingAccount` | Records registry-origin transfer-in to a trading account/platform context. | Transfer-in intent/result and registry reference; no bank/funds movement. |
| `TradingAccountHolding` | Represents trading-context CCER holding available after transfer-in or delivery. | Quantity, frozen/delivered flags where needed; no multi-market position engine. |
| `ClearingResult` | Captures finalized trade settlement/delivery outcome for an executed OTC trade. | Delivery status and references only; no cash clearing or bank integration. |
| `RegistryHoldingChange` | Records the registry-side holding change caused by transfer-in, transfer-out, delivery, or retirement. | Explicit audit trail linked to existing credit transactions/blocks. |

## Execution Tasks

### Task 1: Entity And Enum Design

**Files:**
- Create or modify backend shared entities under `backend/services/libs/shared/src/entities/`
- Update module repository registration where required
- Add focused entity metadata tests if the repo has an existing pattern

**Steps:**
1. Inspect existing entity naming, audit columns, enum patterns, migrations/sync behavior, and repository injection style.
2. Define enums for binding status, instrument status, transfer status, holding status, clearing status, and registry holding change reason.
3. Add entities with stable foreign-key/reference fields back to company, project, credit block, credit transaction, and `MarketTradeExecutionEntity` where available.
4. Avoid naming fields as if they represent bank cash, official exchange accounts, or live order-book state.

**Verification:**
```bash
cd backend/services
yarn test regional-market --runInBand
```

### Task 2: Transfer-In Service Contract

**Files:**
- Add service under `backend/services/libs/shared/src/regional-market/`
- Add unit tests beside existing regional-market specs

**Steps:**
1. Implement a service method that records a `CcerTransferToTradingAccount` from registry context to trading context.
2. Validate account binding exists and is active.
3. Create or update `TradingAccountHolding` only after the transfer is finalized.
4. Create a linked `RegistryHoldingChange` record for the registry-side movement.
5. Keep cash settlement and trading-platform bank accounts out of this service.

**Verification:**
```bash
cd backend/services
yarn test regional-market --runInBand
```

### Task 3: Executed OTC Trade Delivery Contract

**Files:**
- Modify `backend/services/libs/shared/src/regional-market/market-trade-execution.service.ts`
- Add/extend focused tests for settled and non-final statuses

**Steps:**
1. Keep `MarketTradeExecutionEntity` as executed OTC metadata, not an order.
2. Add a delivery/finalization method that creates `ClearingResult` for an executed OTC trade.
3. On finalized delivery, move quantity from seller trading holding to buyer trading holding.
4. Record registry-facing delivery evidence through `RegistryHoldingChange`.
5. Ensure dashboard projections count only finalized trade/delivery states agreed for the current PoC.

**Verification:**
```bash
cd backend/services
yarn test regional-market --runInBand
```

### Task 4: Dashboard Projection Update

**Files:**
- Modify `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx` only if labels or fields change
- Update API DTO typing in `web/src/Pages/CommandCenter/regionalMarketApi.ts`

**Steps:**
1. Add optional fields showing whether trade metrics are backed by clearing/delivery results.
2. Keep current dashboard labels focused on executed OTC metadata and registry lifecycle.
3. Do not add UI implying order entry, matching, market quotes, bank settlement, or official trading-account screens.
4. Keep static fixture generation aligned with any new read-model fields.

**Verification:**
```bash
cd backend/services
yarn test regional-market --runInBand

cd web
yarn build
```

### Task 5: Smoke Fixture And Static Fixture Sync

**Files:**
- Modify `scripts/regional-market-smoke.sh`
- Modify `scripts/generate-regional-dashboard-static-fixture.mjs`
- Modify `scripts/regional-dashboard-static-fixture.test.sh`
- Modify `docs/regional-carbon-market/demo-flow.md`

**Steps:**
1. Extend deterministic smoke data with binding, transfer-in, holding, clearing result, and registry holding-change rows.
2. Keep the existing 50-step story as the visible dashboard fixture unless a documented version bump is made.
3. Ensure self-contained fixture output consumes the same causality and terminology as full-stack smoke.
4. Add assertions that pending, failed, or reconciliation-required records do not affect finalized dashboard metrics.

**Verification:**
```bash
scripts/regional-market-smoke.sh seed-dashboard-demo
scripts/regional-market-smoke.sh dashboard-demo-smoke
node scripts/generate-regional-dashboard-static-fixture.mjs
bash scripts/regional-dashboard-static-fixture.test.sh
```

### Task 6: Documentation And Review Gate

**Files:**
- Modify `docs/regional-carbon-market/terminology-guardrails.md`
- Modify `docs/regional-carbon-market/dashboard-sot-compliance-review.md`
- Modify this plan with execution status

**Steps:**
1. Record which SOT gap each new model closes.
2. Keep unresolved items explicit: no matching engine, no order book, no bank settlement, no official listed-agreement workflow.
3. Ask DS for a focused review after implementation.
4. Ask Gemini/Poe Gemini for an independent review after tests pass.

**Verification:**
```bash
cd backend/services
yarn test regional-market --runInBand
yarn build

cd web
yarn build
```

## Acceptance Criteria

- The dashboard PoC can still be described as “regional registry lifecycle + executed OTC metadata + offline cash settlement.”
- The code has explicit models for account binding, transfer-in, trading holding, clearing/delivery result, and registry holding change.
- Finalized metrics exclude pending, failed, reconciliation-required, and non-delivered records.
- The self-contained fixture and full-stack branch use one causality story and one terminology boundary.
- Documentation does not claim official trading-system, order-book, matching, clearing-engine, bank-settlement, product-listing UI, or exchange account-balance capabilities until those are actually implemented and reviewed.
