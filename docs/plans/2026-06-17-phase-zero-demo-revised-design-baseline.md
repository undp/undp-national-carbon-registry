# Phase Zero Demo Revised Design Baseline

Status: final implementation baseline after Codex/Gemini consensus  
Source documents: `design_prd/阶段零-Demo实施方案-prd.pdf`, `design_prd/Demo阶段技术设计TDD.pdf`  
Supersedes for implementation: terminology, scope, and technical choices in the source PDFs where this document is stricter.

## 1. Positioning And Boundary

This document defines the corrected phase-zero demo baseline for later development. It keeps the original demo narrative, but fixes the carbon-market terminology, system boundary, data truthfulness, and implementation scope.

The demo is not a production trading system, official registry system, bank system, clearing system, or legal contract platform. It is a controlled demonstration that uses:

- real public macro/regional indicators for S12;
- seeded and clearly labelled demonstration data for S8, S10, and registry/trading flows;
- a local implementation aligned with the current repository stack.

Implementation stack is fixed:

```text
React + Vite + NestJS + TypeORM + PostgreSQL
```

Do not introduce Vue, Prisma, or SQLite for this baseline unless a separate, fully independent throwaway demo is explicitly approved.

## 2. Demo Goals And Success Criteria

### Goals

| Goal | Meaning |
| --- | --- |
| 看得见 | Government users can inspect real public regional indicators with source, year, caliber, and methodology notes. |
| 用得起来 | Enterprise users can walk through a controlled demonstration of registry-side holding, transfer-in, listing/agreement transfer, executed deal, and demo certificate. |
| 活起来 | Demonstration assets can move through a linear state machine and drive dashboard metrics without implying a real exchange. |
| 联起来 | Government users can see S8/S10 demonstration events summarized back into a supervision dashboard as clearly marked simulated operational signals. |

### Success Criteria

- S12 public indicators include source label, source URL, source year, caliber, verification status, and methodology notes. API DTOs may use camelCase; import templates and documentation may use snake_case.
- Every S8/S10 screen clearly labels seeded/simulated data.
- The UI and docs do not claim official CCER trading, official registry settlement, real clearing, real bank lending, legal electronic contract validity, or production exchange capability.
- Registry and trading contexts are represented separately in the demo model.
- The golden path can be reset and replayed from a clean seed.
- Backend tests, frontend build, seed smoke, Playwright golden-path E2E, and local deployment verification pass before formal demo use.

## 3. Data Truth Layers And Terminology Red Lines

### Truth Layers

| Data Area | Module | Data Type | Required Labeling |
| --- | --- | --- | --- |
| Regional macro indicators | S12 | Real public data | Source, URL/document, year, caliber, methodology note, verification status |
| Region warnings | S12 | Internal demo assessment | Must say `内部研判`, not official warning |
| Enterprise identities | Portal/S8/S10 | Seeded fictional data | Must use fictional names |
| Demonstration assets | S8/S10 | Seeded demo assets | Must say `演示资产` or `区域绿色权益演示资产` |
| Registry holdings | S8 | Seeded demo registry holdings | Must not claim official registry account balance |
| Trading holdings and deals | S8 | Simulated state machine data | Must not claim official exchange trade or clearing |
| Contract/certificate preview | S8 | Non-legal demo document | Must include `演示文本，不具法律效力` |
| Financing applications | S10 | Simulated intent/assessment | Must not claim real bank approval or disbursement |
| ESG score | S10 | Internal demo model | Must say `demo-v1`, not official rating |

### Red-Line Terms

Avoid these terms unless explicitly negated:

- `官方 CCER 交易`
- `核证自愿减排量交易`
- `真实登记结算`
- `真实清算`
- `银行放款`
- `法律有效电子合同`
- `官方预警`
- `交易账户真实持仓`
- `交易平台正式上线`

Preferred wording:

- `区域绿色权益演示资产`
- `演示登记账户`
- `演示交易账户`
- `模拟成交状态凭证`
- `演示合同预览`
- `融资测算`
- `质押意向申请`
- `模拟审批结果`
- `内部研判指标`

## 4. Revised Four-Act Golden Path

### Act 1: Government Cockpit With Real Public Data

Role: government user.

Flow:

1. Log in with the government golden account.
2. Open the regional cockpit.
3. Inspect Henan/Zhengzhou public indicators.
4. Open a source panel showing source label, source URL/document, source year, caliber, and methodology note.
5. See internal demo assessment tags where applicable.

Rule: no S12 indicator is shown as real unless `verified = true`.

### Act 2: Enterprise Demonstration Asset Transfer And Trade

Role: enterprise user.

Flow:

1. View seeded registry-side demo holdings.
2. Transfer a selected asset lot into the demo trading account.
3. Create a listing for agreement transfer or listing pick-off.
4. Confirm an executed demonstration deal.
5. Generate a non-legal contract preview.
6. Generate a simulated deal-status certificate.
7. Return to dashboard and see trade metrics update.

Scope rule: single-direction auction is a future placeholder. No matching engine, order book depth, five-level quote view, bank clearing, or official listed-agreement trading claim is implemented in this phase.

### Act 3: Green Finance Measurement And Intent

Roles: enterprise user and financial institution user.

Flow:

1. Enterprise opens a carbon/asset profile based on seeded data.
2. System runs valuation using a documented demo formula.
3. Enterprise submits a pledge financing intent.
4. Financial institution user reviews and returns a simulated approval result.
5. Related demo asset is marked `PLEDGE_LOCKED` for demonstration purposes.
6. Dashboard updates financing-intent metrics.

Rule: do not use `放款`, `授信生效`, or real bank names. Use `融资测算`, `意向申请`, and `模拟审批结果`.

### Act 4: Supervision Return Flow

Role: government user.

Flow:

1. Return to the cockpit.
2. View real S12 regional indicators separately from simulated S8/S10 activity metrics.
3. See latest demonstration trades, financing intents, and internal assessment notes.

Rule: the supervision dashboard must visually distinguish real public indicators from simulated operational signals.

## 5. Domain Model And SOT Mapping

### Required Demo Domain Concepts

| Demo Concept | Purpose | SOT Mapping | Truth Status |
| --- | --- | --- | --- |
| `RegistryAccount` | Demo holder account for registry-side assets | Mirrors registry-account concept; not official account | Seeded |
| `RegistryHolding` | Demo holding lot with project/source/quantity/status | Mirrors registry holding/ownership record | Seeded/derived |
| `TradingAccount` | Demo trading-context account | Mirrors trading-account concept; not official account | Seeded |
| `TransferToTradingAccount` | Demo movement from registry context into trading context | Mirrors the official transfer-in boundary pattern; the demo asset is not CCER | Simulated |
| `TradingInstrument` | Tradable demo asset wrapper | Mirrors trading instrument/listed subject | Simulated |
| `TradingAccountHolding` | Demo tradable quantity after transfer-in | Mirrors trading holdings concept | Simulated |
| `Listing` | Demonstration listing/agreement offer | Related to listing workflow but not official order book | Simulated |
| `TradeDeal` | Executed demo deal record | Related to trade result, not official exchange tick | Simulated |
| `DemoContractPreview` | Non-legal preview document | Not official electronic contract | Simulated |
| `ClearingResult` | Demo delivery/status result | Not bank clearing or official clearing | Simulated |
| `RegistryHoldingChange` | Audit-style demo record for holding impact | Mirrors registry holding-change concept | Simulated |
| `FinanceApplication` | Financing intent | Not bank loan application of record | Simulated |
| `PledgeLock` | Demo pledge/freeze state | Demonstrates financing lock concept | Simulated |
| `DemoEsgAssessment` | Internal demo score | Not official ESG or regulator rating | Simulated |
| `DemoRegionIndicator` | Public macro indicator | S12 public data source | Real public data |

### State Machine

```text
REGISTRY_AVAILABLE
  -> TRANSFER_REQUESTED
  -> TRANSFERRED_TO_TRADING
  -> LISTED
  -> DEAL_CONFIRMED
  -> DELIVERY_RECORDED
  -> PLEDGE_LOCKED optional
  -> PLEDGE_RELEASED optional
```

Invalid transitions must be blocked:

- listing before transfer-in;
- deal confirmation against unavailable quantity;
- pledge lock without a selected demo holding;
- retirement/cancellation inside trading context;
- financing result that claims real disbursement.

## 6. Module Design

### 6.1 Portal And Roles

Golden accounts:

| Role | Account | Visible Modules |
| --- | --- | --- |
| Government | `gov_demo` | S12, supervision return dashboard, blueprint menu |
| Enterprise | `enterprise_demo` | Registry holding, S8 transfer/trade, S10 financing intent |
| Financial institution | `finance_demo` | S10 review, selected S8 buyer-side view |

Role switching may be implemented for demo convenience, but backend responses must still use role-aware data scopes. Avoid a frontend-only role illusion.

The 12-system menu is a blueprint shell. Non-golden-path modules render a standard `正式期建设` placeholder and must not call missing APIs.

### 6.2 S12 Regional Cockpit

Key functions:

- indicator list and KPI cards;
- Henan/Zhengzhou map and drilldown where available;
- dual-control target/progress card;
- carbon/emission/sink/energy indicators;
- source-detail modal;
- internal assessment/warning labels.

Data model: `DemoRegionIndicator`.

Required fields:

```text
id
regionCode
regionName
indicatorCode
indicatorName
dimension
period
value
targetValue
unit
caliber
sourceLabel
sourceUrl
sourceDocument
sourceYear
verified
methodologyNote
displayOrder
```

### 6.3 S8 Demonstration Trading Flow

Key functions:

- registry-side demo holding list;
- transfer to demo trading account;
- trading holding list;
- listing/agreement transfer form;
- buyer-side pick-off/confirmation;
- executed deal view;
- demo contract preview;
- simulated deal-status certificate;
- return-flow summary.

Out of scope:

- production order book;
- continuous auction;
- market depth;
- trading hours enforcement beyond a demo label;
- bank settlement;
- official clearing;
- official CCER transfer to national platform.

### 6.4 S10 Green Finance Flow

Key functions:

- enterprise carbon/asset profile;
- valuation formula display;
- financing-intent application;
- financial institution review workbench;
- simulated approval/rejection;
- pledge/freeze state shown on the demo asset;
- ESG demo-v1 report.

Required disclaimers:

- `融资测算结果仅用于演示`
- `模拟审批不代表银行授信`
- `ESG demo-v1 为内部演示模型`

### 6.5 Supervision Return Dashboard

Separate cards by truth status:

| Section | Truth Type |
| --- | --- |
| Public regional indicators | Real public data |
| Demonstration trading activity | Simulated |
| Demonstration financing intent | Simulated |
| Internal assessment tags | Internal demo logic |

The dashboard must not merge real and simulated metrics into one unlabeled score.

## 7. API And Data Model Baseline

Use the current repo's regional API style. Preferred namespace:

```text
/regional/demo/...
```

### API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/regional/demo/session/login` | Golden-account login |
| `POST` | `/regional/demo/session/switch-role` | Demo role switch |
| `GET` | `/regional/demo/indicators` | S12 public indicator list |
| `GET` | `/regional/demo/indicators/:id/source` | Indicator source details |
| `GET` | `/regional/demo/registry/holdings` | Demo registry holdings |
| `POST` | `/regional/demo/registry/transfers-to-trading` | Transfer demo asset to trading context |
| `GET` | `/regional/demo/trading/holdings` | Demo trading holdings |
| `POST` | `/regional/demo/trading/listings` | Create listing/agreement offer |
| `POST` | `/regional/demo/trading/deals` | Confirm demo deal |
| `GET` | `/regional/demo/trading/deals/:id/contract-preview` | Non-legal contract preview |
| `GET` | `/regional/demo/trading/deals/:id/status-certificate` | Simulated deal-status certificate |
| `GET` | `/regional/demo/finance/profile/:enterpriseId` | Enterprise profile |
| `POST` | `/regional/demo/finance/valuations` | Demo valuation |
| `POST` | `/regional/demo/finance/applications` | Financing intent application |
| `POST` | `/regional/demo/finance/applications/:id/review` | Simulated review result |
| `GET` | `/regional/demo/supervision/summary` | Mixed real/simulated summary with labels |
| `POST` | `/regional/demo/reset` | Reset seed state for demo operators |

Implementation note: `POST /regional/demo/trading/deals` should create or enqueue the non-legal contract preview and simulated status certificate. The `GET` endpoints retrieve those generated demo artifacts.

### Minimal Tables Or Entities

| Entity | Notes |
| --- | --- |
| `DemoRegionIndicator` | Real public S12 indicators |
| `DemoOrganization` | Fictional demo organizations |
| `DemoUser` | Golden accounts and roles |
| `RegistryAccount` | Demo registry account |
| `RegistryHolding` | Demo registry holding/lot |
| `TradingAccount` | Demo trading account |
| `TransferToTradingAccount` | Simulated transfer-in |
| `TradingInstrument` | Demo tradable subject |
| `TradingAccountHolding` | Demo trading holding |
| `Listing` | Demo listing/agreement offer |
| `TradeDeal` | Demo executed deal |
| `DemoContractPreview` | Non-legal document metadata |
| `ClearingResult` | Simulated delivery/status result |
| `RegistryHoldingChange` | Demo audit/change record |
| `FinanceApplication` | Financing intent |
| `PledgeLock` | Demo pledge/freeze state |
| `DemoEsgAssessment` | Internal ESG demo-v1 |
| `DemoAuditLog` | User action log for demo confidence |

## 8. Tests And Acceptance

### Required Tests

| Test Type | Required Coverage |
| --- | --- |
| Backend unit | state-machine transitions, valuation formula, truth-layer labels |
| Backend integration | indicator API, transfer-in, listing, deal confirmation, finance review, reset |
| Seed smoke | clean seed creates golden users, verified S12 indicators, demo assets, empty/initial state |
| Dashboard smoke | supervision summary separates real and simulated metrics |
| Web build | `cd web && yarn build` |
| Backend build | `cd backend/services && yarn build` |
| Playwright E2E | government S12 source drilldown, enterprise S8 flow, finance S10 flow, government return dashboard |
| Offline verification | Docker Compose starts with local Postgres and seed data; static fixture fallback loads |

### Acceptance Gates

Before formal demo:

1. no red-line terminology appears in user-facing text without a disclaimer;
2. S12 indicators displayed as real are all verified and source-labelled;
3. S8/S10 screens clearly show simulation labels;
4. reset can restore the demo to the initial state;
5. Playwright golden path passes twice in a row;
6. a recorded fallback video exists for each act.

Implementation note: the phase-zero demo may lock an asset for financing after `DELIVERY_RECORDED` without modelling a full transfer-back workflow. This is an explicit demo simplification and must remain labelled as simulated.

## 9. Deployment And Demo Safety

Deployment package:

```text
docker-compose.yml
postgres image or image tar
backend image or image tar
frontend image or image tar
seed/reset scripts
static fixture
operator guide
fallback recordings
```

Safety checklist:

- test on the target machine and CPU architecture;
- do not depend on live internet for the formal demo;
- keep a separate clean database dump;
- keep browser bookmarks for all acts;
- prepare alternate accounts;
- keep the operator guide with exact click path and expected values.
- add operator-only one-click fill shortcuts for S8 listing and S10 financing forms so the live presenter can recover quickly from input mistakes.

## 10. Implementation Phases

### 2-Week Briefing Version

Purpose: credible progress report, not complete demo.

Scope:

- portal shell with government/enterprise/finance roles;
- S12 with a small set of real public indicators and source panel;
- current regional registry/OTC dashboard retained as supporting screen;
- S8/S10 as labelled static or minimally interactive prototypes;
- seed/reset skeleton;
- build verification.

Non-negotiable: S12 briefing data must be real public data with source labels. Do not replace it with fake mock data.

### 5-6 Week Complete Demo Version

Scope:

- S12 verified indicator model/API/UI;
- S8 transfer-in/listing/deal/contract-preview/status-certificate linear state machine;
- S10 valuation/financing-intent/simulated-review/pledge-lock flow;
- supervision return summary;
- 12-system blueprint placeholders;
- seed/reset;
- backend integration tests;
- Playwright golden path;
- Docker Compose local deployment.

### 7-8 Week Stable Version

Scope:

- offline image tar package;
- static fixture fallback;
- stronger audit log and role scoping;
- more edge-case tests;
- UI polish for projector resolution;
- fallback recordings;
- two rehearsal rounds and fix window.

## 11. Out Of Scope And Formal-Phase Handoff

### Out Of Scope For Phase Zero

- official CCER trading;
- real registry account opening;
- real CCER transfer to a national trading platform;
- production order book;
- matching engine;
- bank account binding;
- payment, deposit, withdrawal, or disbursement;
- legal electronic signature;
- official clearing;
- production carbon pledge registration;
- official ESG or government scoring;
- high availability, multi-tenant production security, equal-protection certification.

### Formal-Phase Handoff Items

The demo should produce reusable artifacts:

- verified S12 indicator catalog and source references;
- refined registry/trading/finance terminology map;
- demo state machines for discussion;
- UI prototype and click path;
- seed data story;
- technical risk list for production conversion;
- decisions on whether local green-rights trading is a policy-authorized scope or only a management/record workflow.
