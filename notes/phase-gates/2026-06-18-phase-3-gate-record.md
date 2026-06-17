# Phase 3 Gate Record - Stable Demo And Offline Deployment

Date: 2026-06-18
Branch: `feature/regional-carbon-market-extraction`
Base commit: `17f6395e4 feat: complete regional demo golden path`

## Scope

Phase 3 adds repository-side stability and offline-demo readiness:

- demo audit logging for login, role switch, reset, transfer, listing, deal, finance application, and finance review;
- actor-role hardening for demo write APIs;
- operator-only reset/recovery paths;
- edge tests for invalid transitions, insufficient quantity, repeated reset, and unauthorized roles;
- frontend offline/fallback indicators and operator recovery controls;
- offline smoke script and operator guide.

## Verification

- `bash scripts/regional-demo-offline-smoke.sh`
  - PASS.
- `bash scripts/regional-demo-frontend-smoke.test.sh`
  - PASS.
- `bash scripts/redline-term-scan.sh`
  - PASS.
- `cd backend/services && yarn test regional-demo-edge --runInBand`
  - PASS: 1 suite, 4 tests.
- `cd backend/services && yarn test regional.market.api.dto --runInBand`
  - PASS: 1 suite, 12 tests.
- `cd backend/services && yarn test regional.market.api.controller --runInBand`
  - PASS: 1 suite, 21 tests.
- `cd backend/services && yarn test regional.market.api.integration --runInBand`
  - PASS: 1 suite, 11 tests.
- `cd backend/services && yarn test regional-demo-integration --runInBand`
  - PASS: 1 suite, 2 tests.
- `cd backend/services && yarn test regional-market --runInBand`
  - PASS: 10 suites, 73 tests.
- `cd backend/services && yarn build`
  - PASS.
- `cd web && yarn build`
  - PASS, with existing Vite chunk-size warnings only.
- `NODE_PATH="/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules" PLAYWRIGHT_CHROMIUM_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" /Users/cy/.npm/_npx/733603f3cc749cb8/node_modules/.bin/playwright test -c scripts/e2e/playwright.config.cjs scripts/e2e/regional-demo-golden-path.spec.cjs --repeat-each=2`
  - PASS: 6 tests.
- `git diff --check`
  - PASS.

Kimi independently re-ran:

- `cd backend/services && yarn test regional-demo-edge --runInBand`
  - PASS: 1 suite, 4 tests.
- `cd backend/services && yarn test regional.market.api.dto --runInBand`
  - PASS: 1 suite, 12 tests.
- `cd backend/services && yarn test regional.market.api.controller --runInBand`
  - PASS: 1 suite, 21 tests.
- `cd backend/services && yarn test regional.market.api.integration --runInBand`
  - PASS: 1 suite, 11 tests.

## Review Gates

### Kimi

Verdict: `PASS`

Findings:

- Write DTOs require `actorRole` without `@IsOptional()`.
- Service `assertDemoRoleAllowed` rejects missing or unauthorized roles.
- Reset controller forwards `actorRole`; service requires `OPERATOR`.
- Frontend write calls send explicit actor roles.
- Edge tests cover missing `actorRole`, unauthorized roles, and operator-only reset.
- No non-blockers.

### DS

Verdict: `PASS_WITH_NON_BLOCKERS`

Non-blockers:

- Physical target-machine rehearsal remains an operational task outside this repository commit.
- Fallback video creation remains an operational task outside this repository commit.
- Existing Vite chunk-size warnings remain non-blocking.

DS recommendation: commit Phase 3 and proceed with physical rehearsal/video creation separately.

### Poe Gemini

Verdict: `PASS_WITH_NON_BLOCKERS`

Non-blockers:

- Physical no-internet target-machine rehearsal.
- Fallback video playback verification.

Poe Gemini recommendation: repository is cleared for the Phase 3 gate.

## Carried Operational Items

- Run two physical rehearsal rounds on the target or equivalent venue machine.
- Verify Docker startup with no internet on that machine.
- Create or attach fallback recordings outside git and verify playback.

These are not code blockers for this repository gate and should be tracked as demo operations work.

## Decision

Phase 3 repository gate is approved for commit. No code, test, SOT, terminology, role-scope, offline-smoke, or replayability blocker remains.
