You are a read-only review/test agent for Phase 0 of the phase-zero carbon demo.

Do not modify files. Do not write files. Do not run destructive commands.

Use engineering review skills, especially codebase-design, domain-modeling, and
tdd. Review against:

- docs/plans/2026-06-17-phase-zero-demo-agentic-workflow.md
- docs/plans/2026-06-17-phase-zero-demo-development-plan.md
- docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md
- docs/regional-carbon-market/terminology-guardrails.md
- /Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md
- notes/phase-gates/2026-06-17-phase-0-evidence.md

Phase 0 changed/created:

- docs/regional-carbon-market/domain-model-baseline.md
- docs/regional-carbon-market/api-contract.md
- docs/regional-carbon-market/s12-indicator-source-catalog.md
- docs/regional-carbon-market/ui-copy-guardrails.md
- docs/regional-carbon-market/terminology-mapping.md
- docs/regional-carbon-market/redline-term-allowlist.txt
- docs/plans/2026-06-17-phase-zero-demo-task-board.md
- scripts/redline-term-scan.sh
- scripts/redline-term-scan.test.sh

Focus:

1. Are Phase 0 docs sufficient for Phase 1 implementation?
2. Are the API/domain docs coherent and consistent with the revised baseline?
3. Are S12 source catalog fields enough to prevent fake public-data claims?
4. Is the red-line terminology scan strategy concrete enough?
5. Do Supabase/Railway development assumptions conflict with offline fallback?
6. Are there missing tests or gate evidence that should block Phase 1?

Return:

1. Verdict: PASS / PASS_WITH_NON_BLOCKERS / BLOCK.
2. Blockers, ordered by severity.
3. Non-blocking issues.
4. Missing tests or weak evidence.
5. SOT/terminology risks.
6. Recommendation on whether to advance to Phase 1.
