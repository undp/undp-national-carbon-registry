# Phase 3 Evidence - Stable Demo And Offline Deployment

Date: 2026-06-18
Branch: `feature/regional-carbon-market-extraction`
Base commit: `17f6395e4 feat: complete regional demo golden path`

## Objective

Phase 3 hardens the regional phase-zero demo for offline/stable operation:

- audit logging for demo login, role switch, reset, transfer, listing, deal, finance application, and review;
- backend role scoping for enterprise, finance, government read-only paths, and operator reset/recovery;
- edge-case coverage for invalid transitions, repeated reset, insufficient quantity, and unauthorized roles;
- frontend offline/fallback indicators and operator-only recovery controls;
- offline smoke script and operator guide.

## Changed Files

- `backend/services/src/regional-market-api/regional.market.api.service.ts`
- `backend/services/src/regional-market-api/regional.market.api.dto.ts`
- `backend/services/src/regional-market-api/regional.market.api.controller.ts`
- `backend/services/src/regional-market-api/regional-demo-edge.spec.ts`
- `backend/services/src/regional-market-api/regional-demo-integration.spec.ts`
- `backend/services/src/regional-market-api/regional.market.api.controller.spec.ts`
- `backend/services/src/regional-market-api/regional.market.api.dto.spec.ts`
- `backend/services/src/regional-market-api/regional.market.api.integration.spec.ts`
- `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- `web/src/Pages/CommandCenter/regionalMarketApi.ts`
- `web/src/Pages/CommandCenter/commandCenter.scss`
- `scripts/e2e/regional-demo-golden-path.spec.cjs`
- `scripts/regional-demo-frontend-smoke.test.sh`
- `scripts/regional-demo-offline-smoke.sh`
- `docs/demo-operator-guide.md`

## Verification

Commands run from `/Users/cy/carbon/undp-national-carbon-registry/.worktrees/regional-carbon-market-extraction` unless noted.

- `bash scripts/regional-demo-offline-smoke.sh`
  - PASS: red-line scan, self-contained static fixture check, Docker/offline packaging checks, operator guide check.
- `bash scripts/regional-demo-frontend-smoke.test.sh`
  - PASS.
- `bash scripts/redline-term-scan.sh`
  - PASS: no unallowlisted red-line terminology found.
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
  - PASS. Vite reports existing chunk-size warnings only.
- `NODE_PATH="/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules" PLAYWRIGHT_CHROMIUM_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" /Users/cy/.npm/_npx/733603f3cc749cb8/node_modules/.bin/playwright test -c scripts/e2e/playwright.config.cjs scripts/e2e/regional-demo-golden-path.spec.cjs --repeat-each=2`
  - PASS: 6 tests, covering S12/S8/S10/government return, pledge-lock transfer block, and operator quick fill/reset.
- `git diff --check`
  - PASS.

## Review-Blocker Fixes Since First Phase 3 Kimi Review

- Write DTOs now require `actorRole` at the TypeScript and validation layers.
- Demo write service methods reject missing or unauthorized `actorRole` instead of defaulting to an allowed role.
- `POST /regional/demo/reset` now accepts `actorRole` and service reset requires `OPERATOR`.
- Frontend write calls send explicit actor roles, including operator recovery calls.
- Edge tests cover missing role rejection and operator-only reset.

## Known Gaps And Operational Notes

- This repo gate verifies the code package, static fallback, local offline smoke, and repeated browser golden path.
- Physical target-machine rehearsal, no-internet Docker startup on the exact venue machine, and fallback video playback remain operational rehearsal tasks outside this repository commit.
- No large recordings or binary demo assets are staged in git, per the large-file workflow rule.

## Decision Requested

Review whether Phase 3 has any code, test, SOT, terminology, role-scope, offline-smoke, or replayability blocker before committing the phase.
