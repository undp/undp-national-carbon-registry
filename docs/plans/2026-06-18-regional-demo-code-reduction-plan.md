# Regional Demo Code Reduction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce and simplify the regional phase-zero demo code while preserving every accepted demo assertion and existing golden-path behavior.

**Architecture:** This is a refactor-only stage. Start by adding characterization tests around the current high-risk behavior, then remove duplication and split large files in small reversible steps. Keep S12/S8/S10 behavior, truth labels, red-line terminology, role scoping, offline fallback, and reset/replay semantics unchanged unless a characterization test and a new gate record explicitly approve a change.

**Tech Stack:** React + Vite + SCSS frontend, NestJS + TypeORM backend, Jest backend tests, shell smoke tests, Playwright E2E through `scripts/e2e/playwright.config.cjs`.

## Source Inputs

- `docs/regional-carbon-market/code-simplification-analysis.md`
- `/Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md`
- `docs/plans/2026-06-17-phase-zero-demo-agentic-workflow.md`
- `docs/plans/2026-06-17-phase-zero-demo-development-plan.md`
- `docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md`
- `docs/regional-carbon-market/terminology-guardrails.md`
- PR: <https://github.com/undp/undp-national-carbon-registry/pull/362>

## Reviewer Consensus

### DS Draft

DS proposed the right high-level sequence:

1. add characterization tests first;
2. remove dead or redundant code only after tests pass;
3. optimize in small phases;
4. run Kimi, DS, and Poe Gemini gates before committing the simplification stage.

However, the DS draft is **not adoptable as-is** because it used non-existent paths and commands:

- non-existent paths such as `src/regional/extraction/legacy-helpers.ts`, `src/regional/pipeline/phase-zero-pipeline.ts`, and `tests/characterization/regional-extraction.characterization.test.ts`;
- root-level `npm test`, even though this repository has no root `package.json`;
- `zod` and `complexity-report`, neither of which are current dependencies.

### Codex Evaluation

The corrected plan must use only real repo files and current test commands. It must not add an unsupported test stack just to simplify code. The existing strongest gates are backend Jest, shell smoke scripts, web build, and Playwright.

### Gemini Evaluation

Poe Gemini agreed that the DS draft should not be adopted directly. Gemini recommended a corrected plan using these real hotspots:

- `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- `web/src/Pages/CommandCenter/commandCenter.scss`
- `backend/services/src/regional-market-api/regional.market.api.service.ts`
- `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- `scripts/regional-market-smoke.sh`

### Consensus

Use DS's high-level phase order, but replace all paths, commands, and dependencies with repository-real equivalents. The first implementation phase must add characterization coverage before moving code.

## Non-Goals

- Do not change the revised assertion baseline.
- Do not add new business features.
- Do not change S8/S10 state-machine semantics without characterization tests and explicit gate approval.
- Do not remove red-line terminology scanning.
- Do not migrate frontend/backend frameworks.
- Do not treat `source_of_truth/`, large PDFs, videos, or phase notes as runtime code simplification. Those are provenance/repository-size decisions.
- Do not introduce `zod`, `complexity-report`, or a new frontend test framework unless a separate dependency decision is approved.
- Do not use an undocumented “official code-simplifier.” Use Codex review/custom prompts plus this plan.

## Global Verification Commands

Run the relevant subset after each task and the full set at phase gates.

```bash
bash scripts/redline-term-scan.sh
bash scripts/regional-demo-frontend-smoke.test.sh
bash scripts/regional-demo-offline-smoke.sh
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn build
cd web && yarn build
```

For Playwright checks, start the web dev server first:

```bash
cd web && yarn dev --host 127.0.0.1
```

Then, from the repo root:

```bash
NODE_PATH="/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules/.bin/playwright test \
  -c scripts/e2e/playwright.config.cjs \
  scripts/e2e/regional-demo-golden-path.spec.cjs
```

After web builds, restore generated metadata if needed:

```bash
git restore -- web/tsconfig.tsbuildinfo
rm -rf test-results
```

## Phase 1: Characterization Tests First

**Goal:** Lock current behavior before splitting files.

### Task 1.1: Add E2E Characterization For Operator Visibility

**Files:**

- Create: `scripts/e2e/regional-demo-characterization.spec.cjs`
- Modify only if needed: `scripts/e2e/playwright.config.cjs`

**Steps:**

1. Add a Playwright test that opens `/command-center`.
2. Assert `操作员恢复台` is not visible in the default government role.
3. Click `企业`, assert `操作员恢复台` is still not visible.
4. Click `金融`, assert `操作员恢复台` is still not visible.
5. Click `操作`, assert `操作员恢复台`, `一键补齐S8`, `一键补齐S10`, and `复位演示` are visible.

**Run:**

```bash
NODE_PATH="/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules/.bin/playwright test \
  -c scripts/e2e/playwright.config.cjs \
  scripts/e2e/regional-demo-characterization.spec.cjs
```

**Expected:** PASS.

**Commit:**

```bash
git add scripts/e2e/regional-demo-characterization.spec.cjs
git commit -m "test: characterize regional demo operator controls"
```

### Task 1.2: Add E2E Characterization For Real/Fallback Dashboard Mode

**Files:**

- Modify: `scripts/e2e/regional-demo-characterization.spec.cjs`

**Steps:**

1. Add a test that uses the existing static dashboard fixture served at `/regional/dashboard/summary`.
2. Assert the page renders the real-data mode label `实时数据` when the summary reports `dataStatus: "real"`.
3. Assert the page still renders demo truth-layer labels separately: `真实公开数据` and `模拟运营信号`.
4. Assert no automatic demo playback label replaces the real dashboard mode.

**Run:** same Playwright command from Task 1.1.

**Expected:** PASS.

**Commit:**

```bash
git add scripts/e2e/regional-demo-characterization.spec.cjs
git commit -m "test: characterize regional demo real data mode"
```

### Task 1.3: Add API-Client Payload Characterization Through Playwright Request Capture

**Files:**

- Modify: `scripts/e2e/regional-demo-characterization.spec.cjs`

**Steps:**

1. Intercept `/regional/demo/registry/transfers-to-trading`.
2. Trigger the S8 transfer button.
3. Assert the captured request JSON contains `actorRole`.
4. Repeat for:
   - `/regional/demo/trading/listings`;
   - `/regional/demo/trading/deals`;
   - `/regional/demo/finance/valuations`;
   - `/regional/demo/finance/applications`;
   - `/regional/demo/finance/applications/*/review`;
   - `/regional/demo/reset`.
5. Fulfill intercepted requests with minimal valid response payloads matching `web/src/Pages/CommandCenter/regionalMarketApi.ts`.

**Run:** same Playwright command from Task 1.1.

**Expected:** PASS and each write request includes explicit `actorRole`.

**Commit:**

```bash
git add scripts/e2e/regional-demo-characterization.spec.cjs
git commit -m "test: characterize regional demo write payload roles"
```

### Task 1.4: Add Backend Characterization For Deal Artifacts

**Files:**

- Modify: `backend/services/src/regional-market-api/regional-demo-integration.spec.ts`

**Steps:**

1. Extend the S8/S10 integration test to call `getDemoContractPreview(deal.deal.id)` immediately after `confirmDemoTradingDeal`.
2. Assert title is `演示合同预览`.
3. Assert `legalEffect` includes `不具法律效力`.
4. Call `getDemoStatusCertificate(deal.deal.id)`.
5. Assert title is `模拟成交状态凭证`.
6. Assert `settlementBoundary` does not imply real clearing or bank settlement.

**Run:**

```bash
cd backend/services && yarn test regional-demo-integration --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add backend/services/src/regional-market-api/regional-demo-integration.spec.ts
git commit -m "test: characterize regional demo deal artifacts"
```

### Task 1.5: Add Backend Characterization For Replayability Semantics

**Files:**

- Modify: `backend/services/src/regional-market-api/regional-demo-edge.spec.ts`

**Steps:**

1. Add a test that documents current repeated transfer/listing behavior.
2. Assert reset is repeatable and restores initial supervision summary.
3. Assert repeated deal confirmation against the same listing remains blocked.
4. Do **not** add idempotency keys in this task. This task records current behavior only.

**Run:**

```bash
cd backend/services && yarn test regional-demo-edge --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add backend/services/src/regional-market-api/regional-demo-edge.spec.ts
git commit -m "test: characterize regional demo replay behavior"
```

## Phase 2: Single-Source Frontend Demo Fixtures

**Goal:** Remove hard-coded S12/demo fallback data from the monolithic component without changing behavior.

### Task 2.1: Extract Frontend Demo Fixtures

**Files:**

- Create: `web/src/Pages/CommandCenter/regionalDemoFixtures.ts`
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Test: `scripts/e2e/regional-demo-characterization.spec.cjs`

**Steps:**

1. Move `fallbackDemoIndicators`, `fallbackDemoSession`, `fallbackRegistryHoldings`, and `fallbackSupervisionSummary` from `CarbonTradingCommandCenter.tsx` to `regionalDemoFixtures.ts`.
2. Export the same values with the same names.
3. Import them into `CarbonTradingCommandCenter.tsx`.
4. Do not change values, labels, or truth statuses.

**Run:**

```bash
cd web && yarn build
bash scripts/regional-demo-frontend-smoke.test.sh
```

Then run the characterization Playwright spec.

**Expected:** PASS.

**Commit:**

```bash
git add web/src/Pages/CommandCenter/regionalDemoFixtures.ts web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx
git commit -m "refactor: extract regional demo fallback fixtures"
```

### Task 2.2: Add Static Fixture Shape Check For Frontend Fixtures

**Files:**

- Create: `scripts/regional-demo-fixture-shape.test.mjs`
- Modify: `scripts/regional-demo-frontend-smoke.test.sh`

**Steps:**

1. Add a Node script that reads:
   - `web/public/regional/dashboard/summary`;
   - `web/src/Pages/CommandCenter/regionalDemoFixtures.ts` as source text.
2. Assert fixture source contains the expected truth statuses:
   - `REAL_PUBLIC_DATA`;
   - `SIMULATED_DEMO_DATA`;
   - `SIMULATED_DEMO_DOCUMENT`;
   - `INTERNAL_DEMO_LOGIC`.
3. Assert the static summary still reports `dataStatus: "real"`.
4. Wire this script into `scripts/regional-demo-frontend-smoke.test.sh`.

**Run:**

```bash
node scripts/regional-demo-fixture-shape.test.mjs
bash scripts/regional-demo-frontend-smoke.test.sh
```

**Expected:** PASS.

**Commit:**

```bash
git add scripts/regional-demo-fixture-shape.test.mjs scripts/regional-demo-frontend-smoke.test.sh
git commit -m "test: cover regional demo fixture shape"
```

## Phase 3: Split Command Center UI In Thin Vertical Slices

**Goal:** Reduce `CarbonTradingCommandCenter.tsx` while keeping CSS and JSX behavior stable.

### Task 3.1: Extract Demo Role Switcher

**Files:**

- Create: `web/src/Pages/CommandCenter/components/DemoRoleSwitcher.tsx`
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Test: `scripts/e2e/regional-demo-characterization.spec.cjs`

**Steps:**

1. Move the role-switch button group into `DemoRoleSwitcher.tsx`.
2. Pass current session role and `onSwitchRole` as props.
3. Keep labels unchanged: `政府`, `企业`, `金融`, `操作`.
4. Keep class names unchanged to avoid CSS churn.

**Run:**

```bash
cd web && yarn build
bash scripts/regional-demo-frontend-smoke.test.sh
```

Then run Playwright characterization spec.

**Expected:** PASS.

**Commit:**

```bash
git add web/src/Pages/CommandCenter/components/DemoRoleSwitcher.tsx web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx
git commit -m "refactor: extract regional demo role switcher"
```

### Task 3.2: Extract Operator Recovery Panel

**Files:**

- Create: `web/src/Pages/CommandCenter/components/OperatorRecoveryPanel.tsx`
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Test: `scripts/e2e/regional-demo-characterization.spec.cjs`

**Steps:**

1. Move the `操作员恢复台` section into `OperatorRecoveryPanel.tsx`.
2. Keep rendering responsibility outside the component: parent still decides `demoSession.user.role === "OPERATOR"`.
3. Props:
   - `onFillS8`;
   - `onFillS10`;
   - `onReset`;
   - `disabledReason` if needed.
4. Keep button labels unchanged.

**Run:** web build, frontend smoke, Playwright characterization spec.

**Expected:** PASS.

**Commit:**

```bash
git add web/src/Pages/CommandCenter/components/OperatorRecoveryPanel.tsx web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx
git commit -m "refactor: extract regional demo operator panel"
```

### Task 3.3: Extract S12 Indicator Panel

**Files:**

- Create: `web/src/Pages/CommandCenter/components/S12IndicatorPanel.tsx`
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Test: `scripts/e2e/regional-demo-characterization.spec.cjs`

**Steps:**

1. Move S12 heading, indicator cards, source details, and truth labels into `S12IndicatorPanel.tsx`.
2. Keep API fetching and state in the parent for this task.
3. Pass selected indicator/source and callbacks through props.
4. Preserve visible text:
   - `S12 真实公开指标驾驶舱`;
   - `真实公开数据`;
   - source year/caliber/methodology fields.

**Run:** web build, frontend smoke, Playwright characterization spec, golden path once.

**Expected:** PASS.

**Commit:**

```bash
git add web/src/Pages/CommandCenter/components/S12IndicatorPanel.tsx web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx
git commit -m "refactor: extract regional demo s12 panel"
```

### Task 3.4: Extract S8 And S10 Flow Panels

**Files:**

- Create: `web/src/Pages/CommandCenter/components/S8TradeFlowPanel.tsx`
- Create: `web/src/Pages/CommandCenter/components/S10FinanceFlowPanel.tsx`
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Test: `scripts/e2e/regional-demo-golden-path.spec.cjs`

**Steps:**

1. Move S8 rendering and button markup into `S8TradeFlowPanel.tsx`.
2. Move S10 rendering and button markup into `S10FinanceFlowPanel.tsx`.
3. Keep handler functions in the parent for this task.
4. Pass DTO-like display state and callbacks through props.
5. Preserve button labels and disabled behavior.

**Run:** web build, frontend smoke, Playwright golden path.

**Expected:** PASS.

**Commit:**

```bash
git add web/src/Pages/CommandCenter/components/S8TradeFlowPanel.tsx web/src/Pages/CommandCenter/components/S10FinanceFlowPanel.tsx web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx
git commit -m "refactor: extract regional demo s8 s10 panels"
```

### Task 3.5: Split SCSS By Component Without Renaming Selectors

**Files:**

- Create: `web/src/Pages/CommandCenter/styles/_demo-role-switcher.scss`
- Create: `web/src/Pages/CommandCenter/styles/_operator-recovery-panel.scss`
- Create: `web/src/Pages/CommandCenter/styles/_s12-indicator-panel.scss`
- Create: `web/src/Pages/CommandCenter/styles/_s8-s10-flow-panels.scss`
- Modify: `web/src/Pages/CommandCenter/commandCenter.scss`

**Steps:**

1. Move only the selectors belonging to extracted components.
2. Import partials from `commandCenter.scss`.
3. Do not rename selectors in this task.
4. Keep responsive rules with their owning component partial if the selector is component-specific.

**Run:**

```bash
cd web && yarn build
bash scripts/regional-demo-frontend-smoke.test.sh
```

Run Playwright golden path once.

**Expected:** PASS and no visual text overlap introduced.

**Commit:**

```bash
git add web/src/Pages/CommandCenter/styles web/src/Pages/CommandCenter/commandCenter.scss
git commit -m "refactor: split regional command center styles"
```

## Phase 4: Extract Backend Demo State Without Behavior Changes

**Goal:** Make `regional.market.api.service.ts` smaller while preserving method signatures and tests.

### Task 4.1: Extract Demo Fixtures

**Files:**

- Create: `backend/services/src/regional-market-api/regional.demo.fixtures.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.service.ts`
- Test: `backend/services/src/regional-market-api/regional-demo-integration.spec.ts`

**Steps:**

1. Move demo users, role-to-account mapping, indicators, and initial state construction into `regional.demo.fixtures.ts`.
2. Export only what the service needs.
3. Keep returned IDs and labels identical.

**Run:**

```bash
cd backend/services && yarn test regional-demo-integration --runInBand
cd backend/services && yarn test regional-demo-edge --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add backend/services/src/regional-market-api/regional.demo.fixtures.ts backend/services/src/regional-market-api/regional.market.api.service.ts
git commit -m "refactor: extract regional demo backend fixtures"
```

### Task 4.2: Extract Demo Audit Helper

**Files:**

- Create: `backend/services/src/regional-market-api/regional.demo.audit.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.service.ts`
- Test: `backend/services/src/regional-market-api/regional-demo-edge.spec.ts`

**Steps:**

1. Move audit action type and audit-record creation into `regional.demo.audit.ts`.
2. Keep `listDemoAuditLogs()` behavior unchanged.
3. Preserve audit IDs and truth status.

**Run:**

```bash
cd backend/services && yarn test regional-demo-edge --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add backend/services/src/regional-market-api/regional.demo.audit.ts backend/services/src/regional-market-api/regional.market.api.service.ts
git commit -m "refactor: extract regional demo audit helper"
```

### Task 4.3: Extract State Transition Helpers

**Files:**

- Create: `backend/services/src/regional-market-api/regional.demo.state-machine.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.service.ts`
- Test:
  - `backend/services/src/regional-market-api/regional-demo-integration.spec.ts`
  - `backend/services/src/regional-market-api/regional-demo-edge.spec.ts`

**Steps:**

1. Move pure guard helpers into `regional.demo.state-machine.ts`:
   - role allow check;
   - transferable holding check;
   - listing availability check;
   - deal confirmability check;
   - finance review lock check.
2. Keep thrown error codes/messages identical.
3. Do not change public service method signatures.

**Run:**

```bash
cd backend/services && yarn test regional-demo-integration --runInBand
cd backend/services && yarn test regional-demo-edge --runInBand
cd backend/services && yarn test regional-market --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add backend/services/src/regional-market-api/regional.demo.state-machine.ts backend/services/src/regional-market-api/regional.market.api.service.ts
git commit -m "refactor: extract regional demo state guards"
```

## Phase 5: Deduplicate Regional Projection Helpers

**Goal:** Reduce drift between backend projection, static fixture generation, and frontend display helpers.

### Task 5.1: Extract Backend Projection Math

**Files:**

- Create: `backend/services/libs/shared/src/regional-market/regional-market-math.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`

**Steps:**

1. Move pure math helpers from `regional-market-projection.service.ts` to `regional-market-math.ts`.
2. Start only with helpers used exclusively in backend TypeScript.
3. Do not try to import TypeScript helpers into Node `.mjs` scripts in this task.
4. Add direct unit coverage for the extracted helpers in the existing projection spec.

**Run:**

```bash
cd backend/services && yarn test regional-market-projection --runInBand
cd backend/services && yarn test regional-market --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add backend/services/libs/shared/src/regional-market/regional-market-math.ts backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts
git commit -m "refactor: extract regional projection math helpers"
```

### Task 5.2: Document Cross-Runtime Math Duplication Decision

**Files:**

- Modify: `docs/regional-carbon-market/code-simplification-analysis.md`

**Steps:**

1. Record whether to keep `.mjs` fixture math duplicated for now or move it to a shared plain JS module.
2. If keeping duplication, list the tests that protect drift.
3. If moving to a shared JS module, create a separate follow-up plan before changing runtime imports.

**Run:**

```bash
bash scripts/regional-dashboard-static-fixture.test.sh
cd backend/services && yarn test regional-market-projection --runInBand
```

**Expected:** PASS.

**Commit:**

```bash
git add docs/regional-carbon-market/code-simplification-analysis.md
git commit -m "docs: record regional math simplification decision"
```

## Phase 6: Smoke Script Reduction

**Goal:** Make `scripts/regional-market-smoke.sh` easier to maintain without changing checks.

### Task 6.1: Extract Smoke Script Helpers

**Files:**

- Create: `scripts/regional-smoke-utils.sh`
- Modify: `scripts/regional-market-smoke.sh`
- Test: `scripts/regional-market-smoke.test.sh`

**Steps:**

1. Move repeated shell helpers into `scripts/regional-smoke-utils.sh`.
2. Source the helper from `regional-market-smoke.sh`.
3. Keep CLI command names unchanged.
4. Do not move seed SQL in this task.

**Run:**

```bash
bash scripts/regional-market-smoke.test.sh
```

**Expected:** PASS.

**Commit:**

```bash
git add scripts/regional-smoke-utils.sh scripts/regional-market-smoke.sh
git commit -m "refactor: extract regional smoke script helpers"
```

### Task 6.2: Characterize Offline Smoke Limitations

**Files:**

- Modify: `scripts/regional-demo-offline-smoke.sh`
- Modify: `docs/demo-operator-guide.md`
- Modify: `docs/regional-carbon-market/code-simplification-analysis.md`

**Steps:**

1. Keep current file-presence and fixture smoke behavior.
2. Add clear output text that this is a repository package smoke, not a full target-machine Docker rehearsal.
3. Update docs to avoid overstating no-network Docker proof.

**Run:**

```bash
bash scripts/regional-demo-offline-smoke.sh
```

**Expected:** PASS and output wording is explicit.

**Commit:**

```bash
git add scripts/regional-demo-offline-smoke.sh docs/demo-operator-guide.md docs/regional-carbon-market/code-simplification-analysis.md
git commit -m "docs: clarify regional demo offline smoke scope"
```

## Phase 7: Phase Gate And Review

**Goal:** Confirm code reduction preserved the demo.

### Task 7.1: Full Local Verification

Run:

```bash
bash scripts/redline-term-scan.sh
bash scripts/regional-demo-frontend-smoke.test.sh
bash scripts/regional-demo-offline-smoke.sh
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn build
cd web && yarn build
```

Run Playwright golden path and characterization specs:

```bash
NODE_PATH="/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules/.bin/playwright test \
  -c scripts/e2e/playwright.config.cjs \
  scripts/e2e/regional-demo-golden-path.spec.cjs \
  scripts/e2e/regional-demo-characterization.spec.cjs
```

Expected:

- all commands pass;
- generated artifacts cleaned;
- `git diff --check` passes.

### Task 7.2: Kimi Read-Only Review

Prepare prompt:

- changed files;
- assertion preservation summary;
- local verification output;
- known non-goals.

Decision required:

- `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCKED`.

### Task 7.3: DS Review

Ask DS to review whether the simplification actually reduced complexity and preserved assertions.

Decision required:

- `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCKED`.

### Task 7.4: Poe Gemini Review

Ask Poe Gemini to independently review the same evidence bundle.

Decision required:

- `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCKED`.

### Task 7.5: Gate Record

**Files:**

- Create: `notes/phase-gates/2026-06-18-code-reduction-gate-record.md`

Include:

- scope;
- line-count before/after for hotspot files;
- verification commands and results;
- Kimi verdict;
- DS verdict;
- Poe Gemini verdict;
- carried non-blockers;
- rollback point.

**Commit:**

```bash
git add notes/phase-gates/2026-06-18-code-reduction-gate-record.md
git commit -m "docs: record regional demo code reduction gate"
```

## Stop Conditions

Stop and ask for review before proceeding if any of these occur:

- a characterization test fails unexpectedly;
- a simplification requires changing visible Chinese demo copy;
- a simplification changes a red-line allowlist entry;
- a backend error code or DTO response shape changes;
- Playwright golden path fails after a UI split;
- a task needs a new dependency;
- a task touches `source_of_truth/` or large binary assets;
- Kimi, DS, or Poe Gemini returns `BLOCKED`.

## Rollback Rule

Do not use destructive git commands automatically.

If a task fails and cannot be fixed quickly:

1. identify the last task commit;
2. prefer a normal revert commit for that task;
3. rerun the task's verification command;
4. document the revert in the gate record.

## Expected Outcome

The target outcome is smaller, more maintainable regional demo code with behavior preserved:

- `CarbonTradingCommandCenter.tsx` reduced by moving fixtures and panels out;
- `commandCenter.scss` split into component partials;
- backend demo service reduced by moving fixtures/audit/state guards out;
- projection helpers made easier to test and reuse;
- smoke scripts made easier to maintain;
- assertions and red-line wording preserved by automated tests and reviewer gates.
