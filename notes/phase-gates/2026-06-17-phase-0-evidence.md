# Phase 0 Evidence Bundle

Date: 2026-06-17  
Phase: Phase 0 Baseline Lock And Development Gate  
Implementer: Codex  
Workspace: `/Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction`  
Branch: `feature/regional-carbon-market-extraction`

## Objective

Lock development inputs and create minimum gate infrastructure before Phase 1
feature implementation.

## Scope Completed

- Added final demo domain model baseline.
- Added `/regional/demo/...` API contract baseline.
- Added S12 source catalog with verified Henan/Zhengzhou public indicators.
- Added UI copy guardrails.
- Added terminology mapping.
- Added Phase 0 task board.
- Added red-line terminology scan script, allowlist mechanism, and shell test.
- Resolved Kimi high-priority non-blockers before DS review:
  - scanner now catches `官方CCER交易` spacing variants;
  - API contract now defines common error shape, HTTP status codes, and role
    scope matrix;
  - S12 catalog now includes an ecology/sink-related public indicator,
    `s12-henan-afforestation-area-2025`;
  - Phase 0 task board status now matches evidence.

## Files Created In This Phase 0 Slice

- `docs/regional-carbon-market/domain-model-baseline.md`
- `docs/regional-carbon-market/api-contract.md`
- `docs/regional-carbon-market/s12-indicator-source-catalog.md`
- `docs/regional-carbon-market/ui-copy-guardrails.md`
- `docs/regional-carbon-market/terminology-mapping.md`
- `docs/regional-carbon-market/redline-term-allowlist.txt`
- `docs/plans/2026-06-17-phase-zero-demo-task-board.md`
- `scripts/redline-term-scan.sh`
- `scripts/redline-term-scan.test.sh`
- `notes/phase-gates/2026-06-17-phase-0-evidence.md`
- `notes/phase-gates/2026-06-17-phase-0-kimi-prompt.md`
- `notes/phase-gates/2026-06-17-phase-0-ds-prompt.md`
- `notes/phase-gates/2026-06-17-phase-0-gemini-prompt.md`
- `notes/phase-gates/2026-06-17-phase-0-gate-record.md`

## Existing Dirty State

The worktree already had modified and untracked regional-dashboard/backend/web
files before this slice. They were treated as development base and were not
reverted. Staging must remain explicit; do not use `git add .`.

## Authoritative Inputs

- `docs/plans/2026-06-17-phase-zero-demo-agentic-workflow.md`
- `docs/plans/2026-06-17-phase-zero-demo-development-plan.md`
- `docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md`
- `docs/regional-carbon-market/terminology-guardrails.md`
- `/Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md`

## S12 Source Evidence

- Henan 2025 statistical communique: `https://tjj.henan.gov.cn/2026/04-09/3341308.html`.
  Verified with `curl -L -A 'Mozilla/5.0'`; page contains GDP,
  industrial energy consumption, renewable installed capacity, water/air quality,
  and resource/environment paragraphs.
- Zhengzhou 2025 statistical communique:
  `https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml`.
  Verified with web fetch; page contains GDP, population, industrial energy
  consumption, electricity consumption, and renewable generation metrics.

## Revised Assertion Coverage

| Assertion Area | Phase 0 Evidence |
| --- | --- |
| R-A scope/boundary | `domain-model-baseline.md`, `api-contract.md`, and `ui-copy-guardrails.md` state the demo is not a production exchange, official registry, bank, clearing, or legal contract platform. |
| R-B terminology/red lines | `ui-copy-guardrails.md`, `terminology-mapping.md`, `redline-term-scan.sh`, and `redline-term-allowlist.txt` define preferred terms, prohibited affirmative terms, and scanning. |
| R-C data truth labels | `domain-model-baseline.md` defines `REAL_PUBLIC_DATA`, `SEEDED_DEMO_DATA`, `SIMULATED_OPERATIONAL_SIGNAL`, and `INTERNAL_ASSESSMENT`; S12 catalog records verified public sources. |
| R-D roles/placeholders | `api-contract.md` defines government, enterprise, finance, and operator role scope; `ui-copy-guardrails.md` defines `正式期建设` placeholder wording. |
| R-E S12 cockpit | `s12-indicator-source-catalog.md` provides verified economy, energy, and ecology/sink-related public indicators with source metadata. |
| R-F S8 demo trading | `domain-model-baseline.md` and `api-contract.md` define registry/trading split, transfer-before-listing, demo contract preview, and simulated status certificate boundaries. |
| R-G S10 finance | `api-contract.md` defines valuation formula, financing-intent application, simulated review, and pledge-lock wording. |
| R-H supervision return | `api-contract.md` defines `GET /regional/demo/supervision/summary` with separate real/simulated/internal sections. |
| R-I domain/SOT mapping | `domain-model-baseline.md` and `terminology-mapping.md` map each core entity to SOT relationship, truth layer, and forbidden inference. |
| R-J API/stack | `api-contract.md` fixes `/regional/demo/...`; revised plan and evidence preserve React + Vite + NestJS + TypeORM + PostgreSQL. |
| R-K tests/deployment | Evidence records backend tests, backend build, web build, red-line scan, and known Phase 1/3 gaps. |
| R-L phased delivery | `2026-06-17-phase-zero-demo-task-board.md` records Phase 0 work and Phase 1 carry-forward tasks. |

## Local Verification

| Command | Result | Notes |
| --- | --- | --- |
| `bash scripts/redline-term-scan.test.sh` | PASS | TDD test for affirmative failure and allowlisted negation. |
| `bash scripts/redline-term-scan.sh` | PASS | No unallowlisted red-line terms in default scan scope; includes spacing variant coverage. |
| `git diff --check` | PASS | No whitespace errors. |
| `rg -n "verifiedBy\|verifiedAt\|source matrix\|银行放款\|法律有效电子合同" docs web/src backend/services \|\| true` | PASS with expected matches | Matches are in source catalog, guardrails, allowlist, or baseline docs. |
| `cd backend/services && yarn test regional-market --runInBand` | PASS | 8 suites, 43 tests passed. |
| `cd backend/services && yarn build` | PASS | Nest build succeeded. |
| `cd web && yarn build` | PASS | Vite build succeeded; existing chunk-size warning only. |

## Known Gaps And Risks

- Phase 0 did not implement Phase 1 APIs or UI.
- Formal-demo target machine, CPU architecture, browser, network condition, and
  projector resolution remain Phase 3 environment questions.
- Red-line scan allowlist is path/term based for review documents; future
  user-facing UI text should avoid allowlisting unless the line is explicitly a
  negation or boundary notice.
- Phase 1 still needs executable tests for verified-only filtering, seed/reset
  smoke, and briefing E2E.

## Decision Requested

Review whether Phase 0 can advance to Phase 1. Verdict options:
`PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCK`.
