# Phase 2 Gate Record

Date: 2026-06-18  
Phase: Phase 2 Complete Demo Golden Path  
Codex implementer: Codex

## Scope

Implemented the complete online demo golden path:

- S8 registry holding, transfer-to-trading, listing, deal confirmation,
  non-legal contract preview, and simulated deal-status certificate.
- S10 valuation, financing-intent application, simulated review, and pledge
  lock.
- Government return dashboard summary with real public data, simulated trading,
  simulated financing, and internal demo logic kept in separate truth layers.
- Frontend clickable S8/S10/return-dashboard flow and Phase 2 Playwright golden
  path coverage.
- Static fallback fixture smoke for the Phase 2 story shape.

## Local Verification

| Command | Result | Notes |
| --- | --- | --- |
| `bash scripts/redline-term-scan.sh` | PASS | No unallowlisted red-line terminology found. |
| `bash scripts/regional-demo-seed-smoke.test.sh` | PASS | Seed/reset smoke commands remain documented. |
| `bash scripts/regional-demo-frontend-smoke.test.sh` | PASS | S12, S8, S10, and return-dashboard text/structure present. |
| `bash scripts/regional-dashboard-static-fixture.test.sh` | PASS | Existing static dashboard fixture checks plus Phase 2 demo fixture shape. |
| `git diff --check` | PASS | No whitespace errors. |
| `cd backend/services && yarn test regional-market --runInBand` | PASS | 9 suites, 69 tests. |
| `cd backend/services && yarn test regional-demo-integration --runInBand` | PASS | 2 tests. |
| `cd backend/services && yarn build` | PASS | Build succeeded. |
| `cd web && yarn build` | PASS | Build succeeded; existing Vite large chunk warning remains. |
| `NODE_PATH=/Users/cy/.npm/_npx/733603f3cc749cb8/node_modules PLAYWRIGHT_CHROMIUM_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" /Users/cy/.npm/_npx/733603f3cc749cb8/node_modules/.bin/playwright test -c scripts/e2e/playwright.config.cjs scripts/e2e/regional-demo-golden-path.spec.cjs --repeat-each=2` | PASS | 4 tests: two golden-path scenarios, each repeated twice. |

Known verification limitation:

- `@playwright/test` is not declared in repo dependencies. The Phase 2 browser
  gate was executed using the local `npx` cache via `NODE_PATH` and the local
  Chrome executable.

## Kimi Review

Initial verdict: BLOCKED  
Final verdict: PASS_WITH_NON_BLOCKERS  

Initial blocker:

- Backend allowed transfer-to-trading from a registry holding after S10 review
  had set the holding to `PLEDGE_LOCKED`.

Resolution:

- Added backend guard returning `DEMO_REGISTRY_HOLDING_PLEDGE_LOCKED` when a
  holding is not `REGISTRY_AVAILABLE` or has locked quantity.
- Added regression coverage in
  `backend/services/src/regional-market-api/regional-demo-integration.spec.ts`.

Remaining non-blockers:

- Write APIs do not yet support idempotency keys for repeated requests.
- Static Phase 2 fixture is hand-authored rather than generated from live
  service state.

## DS Review

Verdict: PASS_WITH_NON_BLOCKERS  
Blockers: None

Non-blockers:

- Playwright dependency is not reproducible from repo dependencies.
- Write APIs lack idempotency keys.
- S10 valuation checks total demo asset quantity rather than more detailed
  partial-transfer/partial-pledge accounting.
- Static Phase 2 fixture is hand-authored.

DS read-only verification:

- `git diff --check`: PASS
- `bash scripts/redline-term-scan.sh`: PASS
- `bash scripts/regional-demo-frontend-smoke.test.sh`: PASS
- `bash scripts/regional-dashboard-static-fixture.test.sh`: PASS
- `bash scripts/regional-demo-seed-smoke.test.sh`: PASS
- `cd backend/services && yarn test regional-market --runInBand`: PASS, 9
  suites / 69 tests
- `cd backend/services && yarn test regional-demo-integration --runInBand`:
  PASS, 2 tests

## Poe Gemini Review

Initial verdict: BLOCKED  
Final verdict: PASS_WITH_NON_BLOCKERS  

Initial blocker:

- Frontend S8 transfer fallback could locally create a trading holding after S10
  pledge lock if the backend rejected the transfer, masking the backend
  protection.

Resolution:

- Added Playwright regression proving S10 pledge lock disables S8 transfer and
  keeps `交易可用 0 吨`.
- Added a frontend guard in `handleTransferToTrading` and matching disabled
  button condition for `PLEDGE_LOCKED` or locked quantity.
- Re-ran the full golden-path Playwright spec twice; all 4 test runs passed.

Remaining non-blockers:

- Phase 3 should distinguish offline/network fallback from backend
  business-rule rejection for all write APIs, not only the pledge-lock case.

Poe Gemini read-only verification:

- `git diff --check`: PASS
- `bash scripts/redline-term-scan.sh`: PASS
- `bash scripts/regional-demo-frontend-smoke.test.sh`: PASS
- `bash scripts/regional-dashboard-static-fixture.test.sh`: PASS

## Consensus

Advance / Do not advance: Advance to Phase 3  
Reason: Codex local verification passed; Kimi, DS, and Poe Gemini all returned
`PASS_WITH_NON_BLOCKERS` with no remaining blockers after the pledge-lock backend
and frontend bypass fixes.

Carried non-blockers:

- Add `@playwright/test` or an equivalent reproducible browser-test runner to
  repo-managed dependencies.
- Add idempotency keys or equivalent replay protection for transfer, listing,
  deal, and finance write APIs.
- Distinguish network/offline fallback from backend business-rule rejection in
  frontend write flows.
- Tighten partial-transfer/partial-pledge accounting beyond the golden path.
- Generate the Phase 2 static fixture from live service state or document the
  hand-authored fixture as an operator fallback artifact.
