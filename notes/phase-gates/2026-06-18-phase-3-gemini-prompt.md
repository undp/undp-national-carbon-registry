# Poe Gemini Final Phase 3 Gate Prompt

You are Poe Gemini final reviewer 2 for Phase 3 of the regional phase-zero demo.

Repository:

`/Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction`

Read-only review only. Do not modify files.

Review evidence:

- `notes/phase-gates/2026-06-18-phase-3-evidence.md`

Authoritative requirements:

- `docs/plans/2026-06-17-phase-zero-demo-agentic-workflow.md`
- `docs/plans/2026-06-17-phase-zero-demo-development-plan.md`
- `docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md`
- `docs/regional-carbon-market/terminology-guardrails.md`
- `/Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md`

Phase 3 review focus:

- audit logging;
- role hardening, especially missing actorRole rejection and operator-only reset;
- offline/fallback indicator and smoke coverage;
- operator-only recovery controls;
- repeated golden-path E2E;
- SOT and terminology safety;
- whether known operational gaps are blockers for the repository gate.

Decision requested:

- Return `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCKED`.
- Include file/line references for any blocker.
- Keep non-blockers separate from blockers.
