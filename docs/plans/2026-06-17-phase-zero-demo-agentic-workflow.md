# Phase Zero Demo Agentic Development Workflow

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this workflow task-by-task.

**Goal:** Run the phase-zero demo development from Phase 0 onward with explicit developer gates, Kimi as review/test agent, and DS + Poe Gemini as final phase reviewers.

**Architecture:** Codex owns implementation and local verification. Kimi runs independent read-only review/test planning on the changed files and test evidence. DS and Poe Gemini run final cross-checks at each phase gate. No phase can advance until Codex, DS, and Gemini agree there is no blocking issue.

**Tech Stack:** React + Vite + NestJS + TypeORM + PostgreSQL, with development previews on Railway + Supabase PostgreSQL and formal-demo fallback on local Docker Compose + PostgreSQL/static fixtures.

---

## 1. Roles

| Role | Tool | Responsibility | Write Access |
| --- | --- | --- | --- |
| Implementer | Codex | Code, docs, tests, local verification, integration fixes | Yes |
| Review/Test Agent | Kimi Code | Read-only review, test strategy critique, gap finding, regression-risk review | No |
| Final Reviewer 1 | DS CLI | Phase gate review against SOT, assertions, tests, and implementation plan | No |
| Final Reviewer 2 | Poe Gemini | Independent final review against the same evidence bundle | No |

Kimi, DS, and Gemini must be invoked with prompts that explicitly prohibit file modification. Their outputs are evidence, not authority by themselves. Codex must verify claims and reconcile disagreements.

---

## 2. Workspace Rules

Implementation workspace:

```bash
cd /Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction
```

Main checkout:

```bash
/Users/cy/carbon/undp-national-carbon-registry
```

Use the main checkout for PRD/PDF/design inputs only unless explicitly redirected. Do not start feature implementation there.

Before each phase starts:

```bash
git status --short
git -C /Users/cy/carbon/undp-national-carbon-registry status --short
```

Record whether new work is happening in the worktree or main checkout. Do not clean or revert unrelated dirty files.

---

## 3. Git Workflow Rules

### Branch And Worktree Strategy

Primary implementation branch:

```text
feature/regional-carbon-market-extraction
```

Use the existing worktree as the implementation worktree. If phase-specific branches are needed, create them from the implementation branch with narrow names:

```text
phase0/demo-baseline-gates
phase1/s12-briefing
phase2/full-demo-flow
phase3/offline-stable-demo
```

Do not switch branches from a dirty worktree. Before any branch operation, run:

```bash
git status --short
```

If unrelated dirty files are present, leave them untouched and stage only the files for the current task.

### Commit Discipline

Use small vertical-slice commits. Prefer one behavior, one test set, one commit.

Examples:

```text
docs: add regional demo api contract
docs: add s12 indicator source catalog
test: cover verified s12 indicator filtering
feat: add regional demo indicator api
feat: add demo reset skeleton
test: add red-line terminology scan
```

Do not create a single giant commit for an entire phase unless explicitly requested.

### Staging Rule

Do not use:

```bash
git add .
```

Stage explicit files only:

```bash
git add docs/regional-carbon-market/api-contract.md
git add backend/services/libs/shared/src/regional-market/demo-indicators.service.ts
git add backend/services/libs/shared/src/regional-market/demo-indicators.service.spec.ts
```

Rationale: both the main checkout and worktree contain unrelated untracked files, PDFs, videos, generated artifacts, and prior work.

### Phase Gate And Merge Rule

Each phase follows this order:

```text
implement
  -> local verification
  -> Kimi review/test agent
  -> fix or document non-blockers
  -> DS final review
  -> Poe Gemini final review
  -> phase gate record
  -> commit / PR / merge
```

Do not merge a phase branch until the phase gate record says DS and Gemini have no blockers.

### PR And Review Rule

If a remote PR workflow is used, each PR description must include:

- phase scope;
- changed files summary;
- verification commands and results;
- Kimi verdict;
- DS verdict;
- Gemini verdict;
- carried non-blockers;
- any skipped test and reason.

If no remote PR workflow is used, write the same information into:

```text
notes/phase-gates/YYYY-MM-DD-phase-N-gate-record.md
```

### Large File Rule

Do not accidentally commit large or binary demo assets.

Treat these as separate asset decisions:

- `v1.mp4`
- `v2.mp4`
- fallback recordings;
- prototype zip files;
- large PDFs;
- generated screenshots or videos.

Before staging any binary or large file, decide whether it belongs in:

- git;
- Git LFS;
- external storage;
- local-only demo package.

### Generated File Rule

Do not stage generated or machine-local files unless explicitly needed:

- `web/tsconfig.tsbuildinfo`
- build output;
- local `.env`;
- local Supabase/Railway credentials;
- temporary PDF extraction outputs;
- Playwright videos/traces unless intentionally attached to evidence.

### CI/CD Gate Rule

At minimum, each phase PR or gate record must include:

```bash
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn build
cd web && yarn build
```

Phase-specific additions:

- Phase 0: red-line terminology scan once available.
- Phase 1: seed smoke and briefing E2E.
- Phase 2: regional demo integration tests, static fixture smoke, full golden-path E2E.
- Phase 3: repeated golden-path E2E and offline smoke.

---

## 4. Shared Evidence Bundle

Every phase review uses a compact evidence bundle. Codex prepares it before calling Kimi, DS, or Gemini.

Required contents:

- phase objective;
- changed files;
- relevant source files;
- relevant docs;
- test commands run;
- exact pass/fail results;
- known gaps;
- SOT/terminology risks;
- decision requested: advance, fix blockers, or defer non-blockers.

Recommended evidence file per phase:

```text
notes/phase-gates/YYYY-MM-DD-phase-N-evidence.md
```

The evidence file may summarize command output; it should not paste secrets, Supabase credentials, Railway tokens, or full environment files.

---

## 5. Reviewer Commands

### Kimi Read-Only Review/Test Agent

Use Kimi after Codex local tests pass and before DS/Gemini final review.

```bash
/Users/cy/.kimi-code/bin/kimi \
  --skills-dir /Users/cy/.kimi-code/skills \
  -p "$(cat notes/phase-gates/YYYY-MM-DD-phase-N-kimi-prompt.md)"
```

Prompt requirements:

- say "read-only";
- prohibit file modification;
- ask Kimi to use engineering skills, especially `codebase-design`, `domain-modeling`, and `tdd`;
- ask for blockers, test gaps, SOT/terminology issues, and suggested fixes;
- ask for a final verdict: `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCK`.

### DS Final Review

Use DS after Kimi review issues are resolved or explicitly downgraded.

```bash
ds "$(cat notes/phase-gates/YYYY-MM-DD-phase-N-ds-prompt.md)"
```

DS prompt requirements:

- phase gate reviewer stance;
- compare evidence against revised baseline and assertion doc;
- identify blockers first;
- give final verdict: `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCK`.

### Poe Gemini Final Review

Use Poe Gemini after DS, using the same evidence bundle plus DS verdict.

```bash
poe --model gemini-3.1-pro --timeout 120 ask \
  "$(cat notes/phase-gates/YYYY-MM-DD-phase-N-gemini-prompt.md)"
```

Gemini prompt requirements:

- independent final reviewer stance;
- explicitly consider DS verdict but do not defer to it;
- identify conflicts with SOT, terminology, tests, and implementation plan;
- give final verdict: `PASS`, `PASS_WITH_NON_BLOCKERS`, or `BLOCK`.

---

## 6. Consensus Rule

Advance to the next phase only when:

1. Codex local verification passes.
2. Kimi reports no blockers, or Codex resolves/downgrades Kimi blockers with evidence.
3. DS verdict is `PASS` or `PASS_WITH_NON_BLOCKERS`.
4. Gemini verdict is `PASS` or `PASS_WITH_NON_BLOCKERS`.
5. DS and Gemini do not disagree on any blocker.
6. All non-blockers are recorded in the next phase task list.

If DS and Gemini disagree:

1. Codex writes a short disagreement table:
   - issue;
   - DS position;
   - Gemini position;
   - local evidence;
   - Codex recommendation.
2. Send the table back to both reviewers.
3. Do not advance until either:
   - both reviewers agree no blocker remains; or
   - the user explicitly accepts the risk and overrides the gate.

---

## 7. Phase 0 Workflow: Baseline And Gates

### Objective

Lock development inputs and create the minimum gate infrastructure before feature implementation.

### Codex Tasks

1. Create or update:
   - `docs/regional-carbon-market/domain-model-baseline.md`
   - `docs/regional-carbon-market/api-contract.md`
   - `docs/regional-carbon-market/s12-indicator-source-catalog.md`
   - `docs/regional-carbon-market/ui-copy-guardrails.md`
   - `docs/regional-carbon-market/terminology-mapping.md`
   - `docs/plans/2026-06-17-phase-zero-demo-task-board.md`
2. Add or plan:
   - `scripts/redline-term-scan.sh`
   - phase gate evidence template;
   - reviewer prompt templates.
3. Confirm development environment assumptions:
   - Railway for online preview;
   - Supabase PostgreSQL for development database;
   - local Docker Compose remains Phase 3 fallback target.

### Local Verification

Run at minimum:

```bash
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn build
cd web && yarn build
```

If Phase 0 only changes docs/scripts and a build is impractical because dependencies are not installed, record that explicitly and run file-level validation:

```bash
rg -n "verifiedBy|verifiedAt|source matrix|银行放款|法律有效电子合同" docs web/src backend/services || true
```

### Kimi Review Prompt Focus

Ask Kimi to review:

- whether Phase 0 docs are sufficient for implementation;
- whether API/domain docs are coherent;
- whether TDD gates are concrete enough;
- whether Supabase/Railway development setup conflicts with formal offline fallback.

### DS/Gemini Final Review Focus

Ask DS and Gemini to decide:

- whether Phase 0 can advance to Phase 1;
- whether the baseline conflicts with SOT or revised assertions;
- whether any mandatory source, terminology, or environment assumption is still blocking.

### Phase 0 Exit Criteria

- Phase 0 docs exist.
- S12 source catalog exists without responsibility/owner governance requirements.
- API contract is sufficient for Phase 1.
- Red-line term scanning strategy exists.
- DS and Gemini both return no blockers.

---

## 8. Phase 1 Workflow: Briefing Version

### Objective

Deliver an online briefing demo with verified S12 public indicators, role shell, placeholders, and seed/reset skeleton.

### Codex Tasks

1. Implement `/regional/demo/session/...`.
2. Implement `/regional/demo/indicators` and `/regional/demo/indicators/:id/source`.
3. Seed three golden roles and at least three verified S12 indicators.
4. Build government S12 cockpit MVP.
5. Build S8/S10 labelled prototype views.
6. Add reset skeleton.
7. Add minimal E2E for login and S12 source drilldown.

### Local Verification

```bash
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn build
cd web && yarn build
scripts/regional-demo-seed-smoke.sh
npx playwright test tests/briefing-login.spec.ts
```

If a command is not yet created, create it or record why it is deferred. Do not claim Phase 1 completion without a replacement verification command.

### Kimi Review Prompt Focus

Ask Kimi to:

- inspect changed backend/frontend files;
- review API shape and tests;
- look for frontend-only role illusions;
- check that unverified S12 indicators cannot show as real;
- identify missing smoke/E2E coverage.

### DS/Gemini Final Review Focus

Ask DS and Gemini:

- whether S12 truth requirements are met;
- whether S8/S10 are safely labelled as prototype/demo;
- whether Railway/Supabase preview is acceptable for Phase 1;
- whether the project can advance to full demo implementation.

### Phase 1 Exit Criteria

- Government can see verified S12 indicators and source details.
- Enterprise/finance prototype views are clearly labelled.
- Placeholder modules do not error.
- Reset skeleton works.
- Local verification passes.
- DS and Gemini both return no blockers.

---

## 9. Phase 2 Workflow: Complete Demo

### Objective

Deliver the full S12/S8/S10/return-dashboard golden path.

### Codex Tasks

1. Implement registry holdings and transfer-to-trading APIs.
2. Implement trading holdings, listings, and deal confirmation.
3. Implement contract preview and simulated status certificate retrieval.
4. Implement finance valuation, intent application, simulated review, and pledge lock.
5. Implement supervision summary with truth-status separation.
6. Implement full S8/S10 frontend flows.
7. Add integration tests and Playwright golden path.

### Local Verification

```bash
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn test regional-demo-integration --runInBand
cd backend/services && yarn build
cd web && yarn build
bash scripts/regional-dashboard-static-fixture.test.sh
npx playwright test tests/regional-demo-golden-path.spec.ts
```

### Kimi Review Prompt Focus

Ask Kimi to:

- review state-machine integrity;
- find invalid transitions not covered by tests;
- check whether `TradeDeal`, `ClearingResult`, and `RegistryHoldingChange` wording stays simulated;
- review S10 for accidental bank-loan/disbursement wording;
- check Playwright coverage against the four-act script.

### DS/Gemini Final Review Focus

Ask DS and Gemini:

- whether the complete demo stays inside SOT boundaries;
- whether real and simulated dashboard data are separated;
- whether tests support the claimed phase completion;
- whether non-blockers can safely defer to Phase 3.

### Phase 2 Exit Criteria

- S8 path works end to end.
- S10 path works end to end.
- Government return dashboard separates real public data from simulated activity.
- Reset replays the full golden path.
- Playwright golden path passes twice or a documented stability issue is fixed before exit.
- DS and Gemini both return no blockers.

---

## 10. Phase 3 Workflow: Stable Offline Demo

### Objective

Make the complete demo reliable for formal presentation and weak-network conditions.

### Codex Tasks

1. Add audit logs and role hardening.
2. Add static fixture fallback.
3. Prepare Docker Compose local deployment path.
4. Prepare database dump or seed package.
5. Add operator-only quick fill and reset recovery.
6. Add projector viewport polish.
7. Write `docs/demo-operator-guide.md`.
8. Prepare fallback recordings outside git if large.

### Local Verification

```bash
cd backend/services && yarn test regional-market --runInBand
cd backend/services && yarn test regional-demo-edge --runInBand
cd backend/services && yarn build
cd web && yarn build
npx playwright test tests/regional-demo-golden-path.spec.ts --repeat-each=2
bash scripts/regional-demo-offline-smoke.sh
```

### Kimi Review Prompt Focus

Ask Kimi to:

- review offline and fallback assumptions;
- check operator controls are not exposed as normal business features;
- review edge-case tests;
- check projector viewport risks and fallback mode labels.

### DS/Gemini Final Review Focus

Ask DS and Gemini:

- whether the demo is safe for formal presentation;
- whether offline/fallback evidence is enough;
- whether any SOT/terminology issue remains;
- whether the operator guide is sufficient.

### Phase 3 Exit Criteria

- Online Railway/Supabase preview works.
- Local Docker/PostgreSQL or fixture fallback path works.
- Golden path passes repeated E2E.
- Operator guide exists.
- Fallback recordings are available.
- DS and Gemini both return final no-blocker verdicts.

---

## 11. Reviewer Prompt Template

Use this structure for each reviewer prompt.

```text
You are a read-only reviewer for Phase N of the phase-zero carbon demo.

Do not modify files. Do not run destructive commands.

Review against:
- revised design baseline;
- revised assertion doc;
- SOT terminology boundaries;
- phase evidence bundle;
- changed files and test results.

Return:
1. Verdict: PASS / PASS_WITH_NON_BLOCKERS / BLOCK.
2. Blockers, ordered by severity.
3. Non-blocking issues.
4. Missing tests or weak evidence.
5. SOT/terminology risks.
6. Recommendation on whether to advance to the next phase.
```

---

## 12. Phase Gate Record Template

Create one record per phase.

```markdown
# Phase N Gate Record

Date:
Phase:
Codex implementer:

## Scope

## Changed Files

## Local Verification

| Command | Result | Notes |
| --- | --- | --- |

## Kimi Review

Verdict:
Blockers:
Non-blockers:
Resolution:

## DS Review

Verdict:
Blockers:
Non-blockers:
Resolution:

## Gemini Review

Verdict:
Blockers:
Non-blockers:
Resolution:

## Consensus

Advance / Do not advance:
Reason:
Carried non-blockers:
```

---

## 13. Immediate Next Step

Start Phase 0 by creating the task board and four contract docs:

1. `docs/plans/2026-06-17-phase-zero-demo-task-board.md`
2. `docs/regional-carbon-market/domain-model-baseline.md`
3. `docs/regional-carbon-market/api-contract.md`
4. `docs/regional-carbon-market/s12-indicator-source-catalog.md`
5. `docs/regional-carbon-market/ui-copy-guardrails.md`

After those files exist, run local file-level verification and invoke Kimi as the first review/test agent.
