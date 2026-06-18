# Phase Zero Demo Development Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the revised phase-zero demo in staged increments: S12 verified public-data cockpit, S8 demonstration registry/trading flow, S10 financing-intent flow, supervision return dashboard, and offline-safe deployment.

**Architecture:** Use the current repository stack and the revised SOT boundary. The demo separates real public S12 indicators from seeded/simulated S8/S10 operating signals, and separates registry-side holdings from trading-side demo state.

**Tech Stack:** React + Vite + NestJS + TypeORM + PostgreSQL, with new demo APIs under `/regional/demo/...`.

**Planning Source:** Drafted after a read-only Kimi Code agent review using local engineering skills, especially `codebase-design`, `domain-modeling`, and `tdd`. Kimi read the PRD/TDD PDFs, revised assertion baseline, terminology guardrails, SOT review docs, worktree git status, and current regional-market code structure.

---

## 1. Inputs And Status

### Authoritative Inputs

- `documention/demo-assertions-revised-baseline.md` in the main checkout.
- `docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md`.
- `docs/regional-carbon-market/terminology-guardrails.md`.
- `docs/regional-carbon-market/dashboard-sot-compliance-review.md`.
- `docs/regional-carbon-market/demo-flow.md`.
- `docs/plans/2026-06-17-registry-exchange-system-modeling.md`.
- `source_of_truth/README.md`.
- `design_prd/阶段零-Demo实施方案-prd.pdf`.
- `design_prd/Demo阶段技术设计TDD.pdf`.

### Worktree Decision

Use `.worktrees/regional-carbon-market-extraction/` as the implementation workspace.

Rationale:

- The main checkout currently contains mostly untracked PRD, assertion, video, and note inputs.
- This worktree already contains the regional-market backend, dashboard frontend, smoke scripts, SOT docs, terminology docs, and revised implementation baseline.
- Do not start implementation in the main checkout unless the branch/worktree strategy is deliberately changed.

### Current Worktree Impact

Existing work in the worktree should be treated as the development base, not thrown away:

- `backend/services/libs/shared/src/regional-market/market-trade-execution.service.ts`
- `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- `backend/services/libs/shared/src/regional-market/regional-market.module.ts`
- `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- `web/src/Pages/CommandCenter/regionalMarketApi.ts`
- `web/src/Pages/CommandCenter/regionalSnapshotMath.ts`
- `scripts/regional-market-smoke.sh`
- `scripts/command-center-regional-snapshot.test.mjs`

---

## 2. Non-Negotiable Boundaries

### Technical Route

- Use React + Vite for frontend work.
- Use NestJS + TypeORM for backend work.
- Use PostgreSQL as the demo database.
- During development and CI/CD previews, Supabase PostgreSQL may be used as the managed PostgreSQL database if it is configured through environment variables and kept separate from any production or sensitive dataset.
- Add new demo APIs under `/regional/demo/...`.
- Do not introduce Vue, Pinia, Prisma, or SQLite into the main implementation path.

### Development Environment Baseline

Use a two-tier environment strategy:

| Stage | Recommended Environment | Purpose | Constraint |
| --- | --- | --- | --- |
| Development / CI preview | Railway deployment + Supabase PostgreSQL | Continuous demo, remote review, CI/CD preview, feature verification | Requires network; not the final offline guarantee |
| Formal demo / fallback | Local Docker Compose + local PostgreSQL or database dump + static fixture fallback | On-site resilience, weak-network or no-network execution | Must be verified in Phase 3 |

For development UI checks, use ordinary laptop viewports first:

- `1440x900`
- `1536x864`
- `1920x1080`

Phase 3 still needs target-machine verification for CPU architecture, browser, network condition, projector resolution, and offline startup.

### SOT And Terminology Route

Must not claim or imply:

- official CCER trading;
- real registry settlement;
- real clearing;
- bank lending or disbursement;
- legal electronic contract validity;
- production exchange capability;
- order book, matching engine, five-level market depth, or continuous auction;
- official government warning or official ESG rating.

Preferred wording:

- `区域绿色权益演示资产`
- `演示登记账户`
- `演示交易账户`
- `演示合同预览`
- `模拟成交状态凭证`
- `融资测算`
- `质押意向申请`
- `模拟审批结果`
- `内部研判指标`

---

## 3. Phase 0: Baseline Lock And Development Gate

**Target:** 1 week.

**Outcome:** The team can start implementation without reopening PRD/TDD conflicts.

### Backend Tasks

- Create the final demo domain model baseline document:
  `docs/regional-carbon-market/domain-model-baseline.md`.
- Define the entity set and status enums before coding:
  `DemoRegionIndicator`, `DemoOrganization`, `DemoUser`, `RegistryAccount`, `RegistryHolding`, `TradingAccount`, `TransferToTradingAccount`, `TradingInstrument`, `TradingAccountHolding`, `Listing`, `TradeDeal`, `DemoContractPreview`, `ClearingResult`, `RegistryHoldingChange`, `FinanceApplication`, `PledgeLock`, `DemoEsgAssessment`, `DemoAuditLog`.
- Review reuse boundaries in:
  `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
  and
  `backend/services/libs/shared/src/regional-market/market-trade-execution.service.ts`.
- Prepare module registration plan in:
  `backend/services/libs/shared/src/regional-market/regional-market.module.ts`.

### Frontend Tasks

- Audit `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx` for reusable dashboard and label components.
- Define route/menu structure for government, enterprise, finance, and operator roles.
- Define a standard `PlaceholderView` for non-golden-path modules.
- Define shared truth-status labels:
  `真实公开数据`, `模拟运营信号`, `内部研判`, `演示数据`.

### Data Tasks

- Confirm the S12 indicator source catalog:
  `docs/regional-carbon-market/s12-indicator-source-catalog.md`.
- Confirm at least 3 verified public indicators for Henan/Zhengzhou.
- Define seed/reset scope:
  verified S12 indicators persist; demo transaction and finance state resets.

### Test And Gate Tasks

- Add a red-line terminology scan script:
  `scripts/redline-term-scan.sh`.
- Keep the existing backend regression gate:
  `cd backend/services && yarn test regional-market --runInBand`.
- Keep build gates:
  `cd backend/services && yarn build`
  and
  `cd web && yarn build`.

### Phase 0 Acceptance

- Revised baseline and assertion docs are linked from the worktree.
- Domain model baseline is reviewed.
- API contract document exists.
- S12 source catalog exists with source, year, caliber, methodology note, and verification state.
- Red-line scan has a documented allowlist mechanism for explicit negations only.

---

## 4. Phase 1: Two-Week Briefing Version

**Target:** 2 weeks after Phase 0.

**Outcome:** A credible briefing demo with real public S12 data and clearly labelled S8/S10 prototype flow.

### Backend Tasks

- Add demo session APIs:
  - `POST /regional/demo/session/login`
  - `POST /regional/demo/session/switch-role`
  - `GET /regional/demo/session/me`
- Add S12 indicator APIs:
  - `GET /regional/demo/indicators`
  - `GET /regional/demo/indicators/:id/source`
- Add seed scripts for:
  - `gov_demo`
  - `enterprise_demo`
  - `finance_demo`
  - initial verified S12 indicators
- Add reset skeleton:
  - `POST /regional/demo/reset`
- Add minimal S8/S10 prototype APIs only if the frontend needs dynamic content; otherwise use static fixture with clear labels.

### Frontend Tasks

- Add regional demo login or role-switch entry.
- Add role-aware shell:
  government, enterprise, finance, operator.
- Add S12 briefing cockpit:
  KPI cards, source detail panel, verified indicator labels.
- Reuse the current regional command center as a supporting screen, not the S12 truth source.
- Add S8/S10 labelled prototype screens:
  no real transaction, no loan, no clearing, no legal contract.

### Data Tasks

- Import at least 3 verified public indicators.
- Add source metadata:
  source label, URL or document, source year, caliber, methodology note, verifier, verification time.
- Keep seed IDs stable for replay.

### Tests

- Backend:
  - login/switch-role tests;
  - indicator API tests;
  - verified-only indicator tests;
  - reset skeleton smoke.
- Frontend:
  - build test;
  - source panel smoke;
  - role switch smoke.
- E2E:
  - government login;
  - S12 indicator visible;
  - source details visible;
  - placeholder route does not error.

### Phase 1 Acceptance

- Government role can show real verified S12 indicators with source details.
- Enterprise/finance pages are clearly labelled as prototypes or demo data.
- Non-golden-path menu items render a stable placeholder.
- Reset restores briefing state.
- Backend build, frontend build, seed smoke, and minimal E2E pass.

---

## 5. Phase 2: Complete Demo Version

**Target:** 5-6 week complete demo window.

**Outcome:** Full four-act demo: S12 real data, S8 demo transaction state machine, S10 financing-intent state machine, and government return dashboard.

### Backend Tasks

Implement the demo domain in vertical slices.

Slice 1: Registry And Transfer

- Add registry-side demo holding APIs:
  - `GET /regional/demo/registry/holdings`
  - `POST /regional/demo/registry/transfers-to-trading`
- Persist transfer records and demo holding changes.
- Block transfer of unavailable quantities.

Slice 2: Trading Holding And Listing

- Add trading holding API:
  - `GET /regional/demo/trading/holdings`
- Add listing API:
  - `POST /regional/demo/trading/listings`
- Block listing before transfer-in.
- Block listing above available trading quantity.

Slice 3: Demo Deal And Documents

- Add deal API:
  - `POST /regional/demo/trading/deals`
- Add retrieval APIs:
  - `GET /regional/demo/trading/deals/:id/contract-preview`
  - `GET /regional/demo/trading/deals/:id/status-certificate`
- Create or enqueue contract preview and status certificate on deal confirmation.
- Use `演示合同预览` and `模拟成交状态凭证`; never use real settlement receipt wording.

Slice 4: Finance Intent

- Add finance APIs:
  - `GET /regional/demo/finance/profile/:enterpriseId`
  - `POST /regional/demo/finance/valuations`
  - `POST /regional/demo/finance/applications`
  - `POST /regional/demo/finance/applications/:id/review`
- Implement valuation formula:
  demo asset quantity x demo price x discount factor.
- Implement simulated review result.
- Mark demo asset as `PLEDGE_LOCKED` where applicable.
- Do not model real disbursement.

Slice 5: Supervision Summary

- Add:
  - `GET /regional/demo/supervision/summary`
- Return separate sections for:
  - real public indicators;
  - simulated trading activity;
  - simulated financing intent;
  - internal assessment tags.
- Include `truthStatus` or equivalent on every summary block.

### Frontend Tasks

- Complete S12 cockpit:
  source details, dual-control card, region labels, internal assessment labels.
- Complete S8 flow:
  registry holding list, transfer to trading account, listing form, buyer-side confirmation, deal view, contract preview, status certificate, return summary.
- Complete S10 flow:
  enterprise profile, valuation, financing-intent form, finance review workbench, simulated review result, pledge lock label.
- Complete government return dashboard:
  real public data separated from simulated activity.
- Add operator-only quick fill:
  listing form, financing form, reset, jump to act.

### Data Tasks

- Expand verified S12 indicators to 5-8 where available.
- Seed fictional demo organizations and users.
- Seed registry holdings and trading accounts.
- Seed a clean initial state and a replayable golden path.
- Generate static fixture fallback from the same story.

### Tests

- Backend unit:
  state-machine transitions, invalid transitions, valuation formula, truth-layer labels, red-line fields.
- Backend integration:
  S12 indicators, transfer-in, listing, deal confirmation, document retrieval, finance application, finance review, reset.
- Dashboard smoke:
  current 50-story fixture remains coherent.
- Static fixture smoke:
  fixture output matches API shape.
- Playwright:
  government S12 source drilldown;
  enterprise S8 full path;
  finance S10 review path;
  government return dashboard.
- Build:
  backend and web.

### Phase 2 Acceptance

- S8 golden path is clickable end to end.
- S10 financing-intent path is clickable end to end.
- Government dashboard receives S8/S10 demo signals while preserving S12 real-data separation.
- Reset restores all golden path data.
- Playwright golden path passes twice in a row.
- No red-line terminology appears in affirmative user-facing text.

---

## 6. Phase 3: Stable Demo And Offline Deployment

**Target:** 7-8 week stable-demo window.

**Outcome:** The demo can run offline on the target machine with fallback recordings and operator recovery paths.

### Backend Tasks

- Add audit logging for:
  login, role switch, reset, transfer, listing, deal, finance application, review.
- Harden role scoping:
  enterprise cannot review finance applications;
  finance cannot mutate registry holdings;
  government summary is read-only.
- Add edge-case tests:
  invalid status transitions, repeated reset, insufficient quantity, unauthorized role.
- Prepare offline deployment package:
  Docker Compose, backend image, frontend image, Postgres image or tar, seed/reset scripts.

### Frontend Tasks

- Add offline/fallback indicators.
- Add static fixture fallback when API is unavailable.
- Optimize projector layout at 1920x1080.
- Add operator controls behind operator role or operator mode.
- Prepare recording-switch entry or operator instruction.

### Data And Operations Tasks

- Prepare clean database dump.
- Prepare fallback fixture.
- Prepare alternate golden accounts.
- Write operator guide:
  click path, expected values, reset steps, fallback video steps, troubleshooting.
- Produce one fallback recording per act.

### Tests

- Offline smoke:
  disconnect network, load images, start Docker Compose, seed, run smoke.
- E2E:
  repeat Playwright golden path twice.
- Visual checks:
  1920x1080 projector viewport;
  no clipped buttons;
  no overlapping KPI text;
  no unlabeled simulated data.
- Manual rehearsal:
  at least two rounds on the target machine or equivalent environment.

### Phase 3 Acceptance

- Full demo works with no internet.
- Static fallback works when backend is unavailable.
- Operator can reset and recover from wrong input.
- Fallback recordings are playable.
- Two rehearsal rounds are completed and issues are recorded.

---

## 7. Dependency Order

```text
Phase 0
  baseline docs
  domain model
  API contract
  S12 source catalog
  red-line scan

Phase 1
  session API + role shell
  S12 verified indicators
  S12 cockpit MVP
  placeholders
  seed/reset skeleton

Phase 2
  registry holding
  transfer to trading
  trading holding
  listing
  deal
  contract preview + status certificate
  finance valuation
  financing intent
  simulated review + pledge lock
  supervision return
  full E2E

Phase 3
  audit and role hardening
  offline package
  static fallback
  projector polish
  operator guide
  rehearsal and recordings
```

Parallelizable work:

- S12 data sourcing and frontend S12 layout.
- Placeholder shell and backend session API.
- Docker Compose polish and seed/reset scripts.
- Operator guide drafting and E2E script authoring.

Strictly sequential work:

- transfer before listing;
- listing before deal;
- deal before contract/certificate retrieval;
- S8/S10 write flows before supervision return dashboard;
- stable API before Playwright golden path freeze.

---

## 8. Testing Gates

### Always Run Before Claiming Phase Completion

```bash
cd backend/services && yarn build
cd backend/services && yarn test regional-market --runInBand
cd web && yarn build
```

### Add During Phase 1

```bash
scripts/regional-demo-seed-smoke.sh
npx playwright test tests/briefing-login.spec.ts
```

### Add During Phase 2

```bash
cd backend/services && yarn test regional-demo-integration --runInBand
bash scripts/regional-dashboard-static-fixture.test.sh
npx playwright test tests/regional-demo-golden-path.spec.ts
```

### Add During Phase 3

```bash
npx playwright test tests/regional-demo-golden-path.spec.ts --repeat-each=2
bash scripts/regional-demo-offline-smoke.sh
```

---

## 9. Documents To Create Next

Create these before or during Phase 0:

- `docs/regional-carbon-market/domain-model-baseline.md`
- `docs/regional-carbon-market/api-contract.md`
- `docs/regional-carbon-market/s12-indicator-source-catalog.md`
- `docs/regional-carbon-market/ui-copy-guardrails.md`
- `docs/regional-carbon-market/terminology-mapping.md`
- `docs/plans/2026-06-17-phase-zero-demo-task-board.md`
- `scripts/redline-term-scan.sh`

Update these as implementation progresses:

- `docs/plans/2026-06-17-registry-exchange-system-modeling.md`
- `docs/regional-carbon-market/demo-flow.md`
- `docs/regional-carbon-market/dashboard-sot-compliance-review.md`
- `docs/regional-carbon-market/terminology-guardrails.md`

---

## 10. Open Questions Before Coding

Kimi's independent read-only assessment found the plan is sufficient to start, but three items must be resolved at the beginning of Phase 0:

1. Which 3 S12 public indicators are guaranteed verified first, and what public sources support them?
2. Initial development target is Railway + Supabase PostgreSQL, with ordinary laptop viewports for CI/CD previews. What is the later formal-demo target machine, CPU architecture, browser, network condition, and projector resolution?
3. Is all implementation work officially happening in `.worktrees/regional-carbon-market-extraction/`, with the main checkout reserved for PRD/design inputs?

Do not begin Phase 1 feature work until item 1 and item 3 are resolved.
