# Kimi Read-Only Phase 3 Review Prompt

You are the read-only review/test agent for Phase 3 of the regional phase-zero demo.

Repository:

`/Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction`

Do not modify files. Do not run write commands. You may inspect files and run read-only tests if needed.

Authoritative inputs:

- `docs/plans/2026-06-17-phase-zero-demo-agentic-workflow.md`
- `docs/plans/2026-06-17-phase-zero-demo-development-plan.md`
- `docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md`
- `docs/regional-carbon-market/terminology-guardrails.md`
- `/Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md`
- `notes/phase-gates/2026-06-18-phase-3-evidence.md`

Review scope:

- Phase 3 only, relative to base commit `17f6395e4 feat: complete regional demo golden path`.
- Changed backend files under `backend/services/src/regional-market-api/`.
- Changed frontend files under `web/src/Pages/CommandCenter/`.
- Changed smoke/E2E/operator-guide files listed in the evidence.

Specific follow-up from your earlier Phase 3 blocker review:

- Verify write DTOs and service methods no longer default missing actor roles to an allowed role.
- Verify reset requires an operator role through the controller/service path.
- Verify frontend write calls send explicit actor roles.
- Verify edge tests cover missing actorRole and operator-only reset.

Decision requested:

- Return `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCKED`.
- If blocked, list concrete blockers with file/line references and the failing requirement.
- If non-blockers remain, list them separately and state why they do not prevent committing Phase 3.
