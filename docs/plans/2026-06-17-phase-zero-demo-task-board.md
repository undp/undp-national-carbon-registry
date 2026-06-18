# Phase Zero Demo Task Board

Status: active Phase 0 board

## 1. Scope

Phase 0 locks implementation inputs and gate infrastructure. It does not
implement Phase 1 product features.

## 2. Tasks

| ID | Task | Output | Status |
| --- | --- | --- | --- |
| P0-01 | Confirm implementation workspace and dirty-state rule. | Worktree status note in phase evidence. | Done |
| P0-02 | Create domain model baseline. | `docs/regional-carbon-market/domain-model-baseline.md` | Done |
| P0-03 | Create demo API contract. | `docs/regional-carbon-market/api-contract.md` | Done |
| P0-04 | Create S12 source catalog. | `docs/regional-carbon-market/s12-indicator-source-catalog.md` | Done |
| P0-05 | Create UI copy guardrails. | `docs/regional-carbon-market/ui-copy-guardrails.md` | Done |
| P0-06 | Create terminology mapping. | `docs/regional-carbon-market/terminology-mapping.md` | Done |
| P0-07 | Add red-line scan script and test. | `scripts/redline-term-scan.sh`, `scripts/redline-term-scan.test.sh` | Done |
| P0-08 | Prepare phase evidence and reviewer prompts. | `notes/phase-gates/...` | Done |
| P0-09 | Run local verification. | Command results in evidence. | Done |
| P0-10 | Run Kimi read-only review/test agent. | Kimi verdict in gate record. | Done |
| P0-11 | Run DS final review. | DS verdict in gate record. | Pending |
| P0-12 | Run Poe Gemini final review. | Gemini verdict in gate record. | Pending |

## 3. Open Questions Before Phase 1

1. Confirm that all implementation continues in
   `.worktrees/regional-carbon-market-extraction/`.
2. Record manual verification for any official source page blocked to automated
   fetching.
3. Record formal-demo target machine, CPU architecture, browser, network
   condition, and projector resolution before Phase 3.

## 4. Carried Non-Blockers

No non-blockers recorded yet.
