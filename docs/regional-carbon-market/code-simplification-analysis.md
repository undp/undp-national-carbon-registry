# Regional Demo Code Simplification Analysis

Date: 2026-06-18
Branch: `feature/regional-carbon-market-extraction`
PR: <https://github.com/undp/undp-national-carbon-registry/pull/362>

## Purpose

This document records the pre-simplification audit requested after the Phase 0-3 demo gate:

1. check the current implementation against the revised demo assertion baseline;
2. check whether matched assertions have enough regression coverage for later refactoring;
3. identify code bloat causes and propose a safe simplification plan;
4. decide whether an official Codex `code-simplifier` is suitable;
5. reconcile independent DS and Kimi review conclusions.

Authoritative assertion baseline:

- `/Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md`

Supporting gate evidence:

- `notes/phase-gates/2026-06-17-phase-0-gate-record.md`
- `notes/phase-gates/2026-06-18-phase-1-gate-record.md`
- `notes/phase-gates/2026-06-18-phase-2-gate-record.md`
- `notes/phase-gates/2026-06-18-phase-3-gate-record.md`

## Executive Summary

The repository implementation is sufficient for the Phase 0-3 demo gate, but it is not yet in the right shape for aggressive code reduction.

Core S12/S8/S10 demo behavior, truth labels, red-line terminology, role hardening, reset/replay, audit logging, and golden-path E2E coverage are present. The main simplification risk is not that the demo is missing its core path; the risk is that several safeguards are coarse-grained and the largest files concentrate too many concerns.

The next stage should focus solely on code reduction and optimization, but only after adding targeted regression coverage around frontend behavior and fallback data. The first simplification target is the monolithic command-center frontend, followed by backend demo-state extraction and shared regional math deduplication.

## Size And Scope Findings

Line-count checks were run from the worktree with `node_modules`, build output, and `.git` excluded where applicable.

| Scope | Count / Finding |
| --- | --- |
| Full repo text/code-ish count | about 400,570 lines for `ts/tsx/js/mjs/cjs/scss/css/json/md/sh`; this includes existing app code, docs, data, and generated/reference-like files. |
| PR total against `origin/main` | 120 files, 31,501 insertions, 30 deletions. |
| PR code/script subset | 52 files, 12,933 insertions, 30 deletions. |
| PR docs/notes | 39 files, 8,806 insertions. |
| PR SOT/source references | 28 files, 8,992 insertions. |
| Existing large data file | `backend/services/countries.json` is 9,001 lines and is data, not regional-demo logic. |

Largest regional-demo/runtime hotspots:

| File | Lines | Simplification Relevance |
| --- | ---: | --- |
| `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx` | 2,923 | Highest priority. Monolithic UI, state, fallback data, handlers, map/charts, operator controls. |
| `web/src/Pages/CommandCenter/commandCenter.scss` | 2,134 | Highest priority. Large bespoke style sheet with component-specific and responsive rules mixed together. |
| `backend/services/src/regional-market-api/regional.market.api.service.ts` | 1,065 | High priority. Demo state, constants, transition rules, audit, and API orchestration are in one service. |
| `scripts/regional-market-smoke.sh` | 735 | Medium priority. Seed setup, SQL, curl assertions, and flow orchestration are mixed. |
| `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts` | 731 | Medium priority. Projection logic is tested, but some math overlaps fixture/frontend helpers. |
| `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts` | 683 | Large but useful regression coverage. Do not reduce until projection helpers are extracted. |

Not all counted lines are candidates for code simplification. `source_of_truth/` and `notes/` are evidence/provenance, not runtime code. They may be moved to LFS or an external evidence bundle later, but that is a repository-size decision, not a code-simplification task.

## Assertion Match Assessment

### Matched Assertions

The following assertion groups are matched for repository-gate purposes:

| Assertion Area | Status | Evidence |
| --- | --- | --- |
| R-A scope and non-production boundary | Matched | Demo wording and red-line scan avoid production exchange, real clearing, real bank lending, and legal-contract claims. |
| R-B terminology guardrails | Matched | `scripts/redline-term-scan.sh` passes; allowlist mechanism exists. |
| R-C truth layers | Matched | S12 indicators carry real-public metadata; S8/S10 carry simulated/demo truth labels. |
| R-D roles and reset/replay | Mostly matched | Government, enterprise, finance, and operator roles exist; reset/replay exists; backend write scoping uses explicit `actorRole`. |
| R-E S12 cockpit | Mostly matched | S12 source cards and source detail are exposed and tested; verified-only filtering exists. |
| R-F S8 demo flow | Matched | Transfer, listing, deal, contract preview, status certificate, and supervision return are implemented and tested. |
| R-G S10 finance flow | Matched | Valuation formula, financing-intent application, simulated review, and pledge lock are implemented and tested. |
| R-H supervision return | Mostly matched | Real public data and simulated operating signals are separated in API and UI. |
| R-I SOT/entity mapping | Mostly matched | Core concepts are documented and represented in TypeScript/demo state; no illegal clearing/registry finality claims. |
| R-J API and stack | Mostly matched | React + Vite + NestJS + TypeORM/PostgreSQL baseline preserved; `/regional/demo/...` routes are created via regional module prefix. |
| R-K tests/builds | Mostly matched | Backend tests, web/backend builds, red-line scan, offline smoke, and repeated Playwright golden path pass. |
| R-L phased delivery | Mostly matched | Phase 0-3 gate records exist and no code blocker remains. |

### Partial Or Unmatched Items

These are not blockers for the existing PR gate, but they must guide simplification and follow-up work.

| ID | Verdict | Reason |
| --- | --- | --- |
| R-D-003 | Partial | The demo is effectively a single command-center experience. `CarbonTradingCommandCenter.tsx` contains S8/S10 prototype labels, but there is no complete 12-system blueprint menu where every non-golden-path module renders a standard `正式期建设` placeholder. |
| R-E-004 | Partial | The frontend still defines hard-coded S12 fallback values in `fallbackDemoIndicators` inside `CarbonTradingCommandCenter.tsx`. The API path exists, and the shape is consistent, but fallback data is not generated/imported from a single fixture source. |
| R-H-004 | Partial coverage | Runtime logic distinguishes real projection from fallback/demo playback, but there is no focused frontend regression test proving real `dataStatus=real` projection is not overridden by demo playback. |
| R-I-001 | Partial | Registry/trading contexts are distinguished by demo types and state arrays, but `RegistryAccount` / `TradingAccount` are not first-class persisted objects. This is acceptable for phase-zero but should not be represented as production-grade domain modeling. |
| R-J-004 | Partial | Reset/replay is safe and invalid transitions are blocked, but write operations are not fully idempotent with request keys. Repeating a valid transfer/listing can create additional demo objects until the state machine blocks later steps. |
| R-K-006 | Partial | Static dashboard fixture and operator guide exist, but Docker Compose does not yet prove a full no-network stack with `regional-market-api`, frontend proxying, seed/reset, and PostgreSQL running together. |
| R-K-007 | Operational gap | Target-machine CPU/browser/projector/offline rehearsal remains outside repo verification. |
| R-K-008 | Partial coverage | Operator recovery controls are role-gated in UI, but there is no automated test asserting the operator panel is absent for government/enterprise/finance roles. |
| R-L-004 | Partial | Stable-demo code assets exist, but fallback recordings and two target-machine rehearsal rounds remain operational deliverables outside git. |

## Test Coverage Assessment

### Strong Coverage

Current coverage is strong for backend behavior and golden-path integration:

- `backend/services/src/regional-market-api/regional-demo-edge.spec.ts`
  - audit events;
  - missing and unauthorized `actorRole`;
  - operator-only reset;
  - invalid transitions;
  - insufficient quantity;
  - repeated reset.
- `backend/services/src/regional-market-api/regional-demo-integration.spec.ts`
  - S8 transfer/listing/deal;
  - S10 valuation/application/review;
  - pledge lock;
  - supervision return;
  - reset.
- `backend/services/src/regional-market-api/regional.market.api.integration.spec.ts`
  - route-level DTO validation and demo endpoints.
- `backend/services/src/regional-market-api/regional.market.api.dto.spec.ts`
  - S8/S10 DTO validation and review-result validation.
- `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`
  - real/fallback projection status;
  - active project filtering;
  - issued-credit aggregation;
  - completed-retirement filtering;
  - account aggregation;
  - regional trade metrics.
- `backend/services/libs/shared/src/regional-market/market-trade-execution.service.spec.ts`
  - OTC trade execution records;
  - recent trade queries;
  - settled-offline-only summaries.
- `scripts/e2e/regional-demo-golden-path.spec.cjs`
  - S12 source view;
  - S8 full path;
  - S10 review path;
  - pledge-lock transfer block;
  - operator quick-fill/reset.
- Static/smoke scripts:
  - `scripts/redline-term-scan.test.sh`;
  - `scripts/regional-dashboard-static-fixture.test.sh`;
  - `scripts/regional-demo-frontend-smoke.test.sh`;
  - `scripts/regional-demo-seed-smoke.test.sh`;
  - `scripts/regional-market-smoke.test.sh`;
  - `scripts/web-basic-auth-config.test.sh`.

### Tests To Add Before Simplification

The first reduction phase should not start until these tests exist:

| Priority | Test | Why |
| --- | --- | --- |
| P0 | Frontend unit/component test for `dataStatus=real` not being overridden by demo playback | Protects R-H-004 while splitting `CarbonTradingCommandCenter.tsx`. |
| P0 | Frontend test that operator controls are hidden for `GOVERNMENT`, `ENTERPRISE`, and `FINANCE` | Protects R-K-008 while extracting `OperatorRecoveryPanel`. |
| P0 | Frontend test that API-provided S12 indicators replace fallback constants | Protects R-E-004 and enables fixture single-sourcing. |
| P0 | API-client test for `regionalMarketApi.ts` write payloads including `actorRole` | Protects Phase 3 role hardening during client extraction. |
| P1 | Static fixture consumption test for built web app at `/regional/dashboard/summary` | Protects offline/fallback behavior. |
| P1 | Integration test for `POST /regional/demo/trading/deals` followed by contract/status certificate `GET`s | Locks artifact retrieval before backend service split. |
| P1 | Idempotency/replayability tests for repeated transfer/listing/deal/application requests | Clarifies R-J-004 semantics before adding idempotency keys or preserving current behavior. |
| P1 | Docker Compose offline startup smoke with regional API + web + database | Turns R-K-006 from file-presence smoke into actual deployment proof. |

## Code Bloat Root Causes

### 1. Frontend Monolith

`CarbonTradingCommandCenter.tsx` mixes these concerns:

- dashboard summary loading;
- regional map and projection rendering;
- fallback S12 and demo data constants;
- S12 indicator/source panel;
- S8 state machine actions;
- S10 financing flow actions;
- supervision summary rendering;
- operator recovery controls;
- role switching;
- local fallback behavior.

This is the largest simplification target. Refactoring it without tests is risky because the current E2E tests cover the happy path but not every branching condition.

### 2. Oversized Bespoke SCSS

`commandCenter.scss` is large because it contains page layout, repeated cards, repeated tags, responsive rules, operator controls, map visuals, and demo panels in one stylesheet. Splitting components without splitting styles will leave the main maintenance problem intact.

### 3. Backend Demo Service Mixes State And Orchestration

`regional.market.api.service.ts` currently owns:

- demo constants;
- in-memory state;
- state transitions;
- role guards;
- audit logging;
- source lookup;
- finance valuation;
- supervision aggregation;
- reset.

It is test-covered, but simplification should extract a small state-machine/store module before changing behavior.

### 4. Duplicated Regional Math And Fixtures

Some projection/math concepts exist across:

- `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`;
- `scripts/generate-regional-dashboard-static-fixture.mjs`;
- `web/src/Pages/CommandCenter/regionalSnapshotMath.ts`.

This duplication is manageable for the demo but expensive during optimization because fixture, backend, and UI can drift.

### 5. Shell Smoke Scripts Contain Too Much

`scripts/regional-market-smoke.sh` combines setup, seed data, SQL, API calls, and assertions. This makes it hard to reduce or reuse. It should become a thin runner over seed SQL files and focused assertion helpers.

### 6. SOT Evidence Is Useful But Heavy

`source_of_truth/` is not runtime code. It provides review provenance. For repository size reduction, consider moving large PDFs/HTML snapshots to LFS or an external evidence bundle and keeping extracted text plus hashes in git. This is separate from code simplification.

## Simplification Plan

### Phase A: Add Safety Tests

Before code movement:

1. Add frontend tests around real/fallback data mode, operator visibility, and S12 API replacement of fallback.
2. Add API-client tests for `actorRole` payloads.
3. Add fixture fallback consumption test.
4. Add idempotency/replayability characterization tests.

Exit gate:

- `cd backend/services && yarn test regional-market --runInBand`
- frontend test command for new component tests;
- `bash scripts/redline-term-scan.sh`;
- Playwright golden path once after test additions.

### Phase B: Single-Source Demo Data

Move component-level fallback data out of `CarbonTradingCommandCenter.tsx`:

- create generated JSON fixtures for S12 indicators, registry holdings, and supervision summary;
- import or fetch them through a small fallback data provider;
- keep the API DTO shape identical to static fixture shape.

Expected outcome:

- direct progress on R-E-004;
- smaller component;
- less drift between backend constants and frontend fallback.

### Phase C: Split Frontend UI

Extract:

- `DemoRoleSwitcher`;
- `S12IndicatorPanel`;
- `S8TradeFlow`;
- `S10FinanceFlow`;
- `SupervisionReturnPanel`;
- `OperatorRecoveryPanel`;
- `RegionalDashboardPanel`;
- `useRegionalDemoState`;
- `useRegionalDashboardSummary`.

CSS should be split with these components. Do not only move JSX while leaving all selectors in one global SCSS file.

### Phase D: Extract Backend Demo State Machine

Split `regional.market.api.service.ts` into:

- `regional.demo.fixtures.ts`;
- `regional.demo.state.store.ts`;
- `regional.demo.state-machine.ts`;
- `regional.demo.audit.ts`;
- `regional.market.api.service.ts` as a thin API orchestration layer.

Preserve existing public method signatures until tests pass.

### Phase E: Deduplicate Regional Math

Extract shared helpers for:

- governance band/scoring;
- available balance;
- weighted average price;
- single-count trade volume;
- city metric rollups.

Use the same helpers in backend projection tests and fixture generation. Frontend should consume only display-ready fields unless it truly needs client-side projection.

### Phase F: Deployment Smoke Upgrade

Upgrade `scripts/regional-demo-offline-smoke.sh` from file-presence smoke to a real offline stack proof:

- `docker compose up` with `regional-market-api`, database, and web;
- verify `/regional/dashboard/summary`;
- verify static fallback when API is unavailable;
- verify operator guide reset path.

## Codex `code-simplifier` Assessment

No official built-in Codex tool or skill named `code-simplifier` was found:

- local search under `~/.codex` found no `code-simplifier` skill/tool;
- the current official Codex manual documents Agent Skills, custom prompts, `/review`, GitHub code review, and refactoring/testing workflows;
- the manual does not document an official capability named `code-simplifier`.

Recommended Codex workflow:

1. Create a repo-specific custom prompt or skill named something like `regional-demo-simplification`.
2. Use Codex `/review` for simplification review, not automated rewriting.
3. Execute one narrow refactor at a time:
   - add/confirm tests;
   - move one component/module;
   - run targeted tests;
   - run red-line scan;
   - run the relevant E2E if UI behavior changed.
4. Keep Kimi/DS read-only review gates for each simplification phase.

Do not use an undocumented “official code-simplifier” as an authority. Treat simplification as a normal refactor workflow with explicit tests and review gates.

## DS And Kimi Independent Review Consensus

### DS Evaluation

DS conclusion:

- repository code-level assertions are broadly matched;
- operational gaps remain for target-machine rehearsal and fallback videos;
- strongest simplification risk is lack of component-level tests for the large frontend;
- recommended adding frontend/API client tests before simplification;
- no official `code-simplifier` was identified; use Codex review/custom-prompt workflow.

### Kimi Evaluation

Kimi conclusion:

- the implementation meets the Phase 0-3 repo gate but has partial assertion matches that matter for simplification;
- the main partials are:
  - no full 12-system placeholder shell;
  - frontend hard-coded S12 fallback values;
  - domain concepts represented as in-memory demo types, not full entities/accounts;
  - replayability is reset/state-machine based, not full write idempotency;
  - Docker/static fallback is not a complete full-stack offline proof;
  - operator-only visibility and real-data non-override need focused frontend tests;
- recommended tests first, then frontend split, backend state-machine split, math deduplication, and offline smoke upgrade;
- no official `code-simplifier` exists.

### Consensus

Both reviewers agree:

1. The current PR is acceptable as the phase-zero demo gate.
2. Code reduction should be the sole focus of the next engineering stage.
3. The first step is not deleting code; it is adding missing regression tests.
4. The biggest code-reduction target is `CarbonTradingCommandCenter.tsx` and `commandCenter.scss`.
5. Backend simplification should preserve the current tested state-machine behavior.
6. SOT/source evidence and large PDFs are repository-size concerns, not runtime code bloat.
7. Codex can help with refactoring, review, and test generation, but there is no documented official `code-simplifier` tool to delegate the whole simplification safely.

## Recommended Next Backlog

1. Add frontend regression tests:
   - real projection is not overridden by demo playback;
   - operator controls hidden from non-operator roles;
   - API S12 data replaces fallback data;
   - `actorRole` payloads are emitted by API client helpers.
2. Move frontend fallback data to generated fixtures and remove hard-coded S12 values from the component.
3. Split `CarbonTradingCommandCenter.tsx` into focused demo/dashboard components and hooks.
4. Split `commandCenter.scss` alongside the components.
5. Extract backend demo state-machine/store/audit modules.
6. Deduplicate regional math across backend projection, fixture generator, and frontend helper.
7. Upgrade offline smoke to prove real Docker Compose startup.
8. Re-run DS/Kimi review after each simplification batch.

## Non-Goals For The Simplification Stage

- Do not change the revised business assertions without a new gate record.
- Do not remove red-line terminology scanning.
- Do not remove source provenance unless there is a separate LFS/external-evidence decision.
- Do not rewrite S8/S10 behavior while splitting files.
- Do not treat physical rehearsal or fallback video creation as code refactors.
