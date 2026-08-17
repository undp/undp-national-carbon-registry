# Manual QA — Article 6.2 Compliance

**Audience**: a manual tester or auditor walking through every Article 6.2 compliance dimension end-to-end against the running registry. Tied to the demo dataset produced by `scripts/seed-demo.sh`.

**Decision references**: 2/CMA.3 (Article 6.2 guidance), 3/CMA.3 (cooperative approaches), 4/CMA.6 Annex II (AEF), 6/CMA.4 Annex I (ITMO serial), Draft -/CMA.5 (revocation/suspension).

---

## 0. Pre-flight

1. Bring the dev stack up:
   ```
   podman-compose up -d db national web replicator
   ```
2. Open `http://localhost:3030` in your browser.
3. If the database is empty or has stale data, re-seed:
   ```
   # Wipe demo tables (preserves users/companies/regions)
   podman exec db psql -U root -d carbondev -c "TRUNCATE cooperative_approach, initial_report, corresponding_adjustment, programme, project_entity, programme_document, programme_transfer, credit_blocks_entity, credit_transactions_entity, ndc_action, ndc_details_action, ndc_details_period, event_log, audit_entity, credit_audit_log, itmo_account, aef_actions_table_entity, async_action_entity, document_entity, emission, projection, investment, activity_entity RESTART IDENTITY CASCADE;"
   podman exec db psql -U root -d carbondev -c "UPDATE counter SET counter = 0;"
   podman exec db psql -U root -d carbondevEvents -c "TRUNCATE programmes, project, credit_blocks, overall, company RESTART IDENTITY CASCADE;"
   scripts/seed-demo.sh
   ```

## Accounts

| Role | Email | Password | Use for |
|---|---|---|---|
| **DNA Admin** | `palinda+add@xeptagon.com` | `123` | Most steps below. Authorize, issue, approve retirement, calc CA-ADJ, download AEF |
| **PD Admin (Org A)** | `palinda+dev@xeptagon.com` | `123` | Initiate transfers, request retirement |
| **PD Admin (Org B)** | `palinda+dev2@xeptagon.com` | `123` | Receive transfers, cross-org checks |
| **IC Admin** | `palinda+cet@xeptagon.com` | `123` | Negative-permission probes |
| **Ministry Admin** | `palinda+ministry@xeptagon.com` | `123` | CASL mirror-of-DNA |
| **DNA ViewOnly** | `palinda+view@xeptagon.com` | `123` | Read-only checks |

## Seeded data reference

| Sidebar | Item | Expected |
|---|---|---|
| Cooperative Approaches | `CA-001` | Active, IR-001 Submitted under it, 4 programmes under it |
| Cooperative Approaches | `CA-002` | Active, IR-002 Draft under it, no programmes |
| Cooperative Approaches | `CA-003` | Suspended, no IR, no programmes |
| Initial Reports | `IR-001` | Submitted, under CA-001 |
| Initial Reports | `IR-002` | Draft, under CA-002 |
| Project Details | `001` | PENDING, no methodology |
| Project Details | `002` | APPROVED, methodology accepted |
| Project Details | `003` | AUTHORISED, no credits issued |
| Project Details | `004` | AUTHORISED, 1000 credits issued |
| Credits ▸ Credit Balance | 3 blocks for project 004 | Holding 930, CancellationOMGE 20, CancellationSOP 50 |
| Corresponding Adjustments | `CA-ADJ-001` | Draft, for CA-001, current year |

For each section below, record **Pass / Fail / N/A**, tester initials, and a one-line note. Save AEF exports + screenshots of any failure to `test-results/manual-qa-<date>/`.

---

## 1. Cooperative Approach lifecycle (Decision 2/CMA.3 ¶¶ 1, 18)

**Login**: DNA Admin.

1. Sidebar → **Cooperative Approaches**. URL `/cooperativeApproaches/viewAll`.
   - Expected: 3 rows (`CA-001 Active`, `CA-002 Active`, `CA-003 Suspended`) with status tags coloured green / green / orange.
2. Click `CA-001` row → detail page `/cooperativeApproaches/view/CA-001`.
   - Expected: bordered Descriptions block. Status select dropdown shows current `Active`.
3. Click the status dropdown → pick `Suspended` → wait for the toast.
   - Expected: status persists on refresh.
4. Switch back to `Active` (so downstream tests work).
5. On `CA-001`'s detail page, attempt `Active → Draft` from the dropdown (Draft isn't in the dropdown options — confirm).
   - Expected: Draft is not selectable from any non-Draft state. Locks Decision 2/CMA.3 ¶1 — terminal/forbidden transitions.
6. **Negative — terminal transitions** (use a throwaway CA created via Add New, then drive it to Completed/Revoked):
   - From a Completed CA, attempt `Completed → Active`. Toast: `Cooperative approach <id> is Completed — its lifecycle has ended and its status cannot change. To start a new bilateral arrangement, create a fresh cooperative approach.` (key `cooperativeApproach.transitionFromCompleted`)
   - From a Revoked CA, attempt any change. Toast: `Cooperative approach <id> was Revoked under Draft -/CMA.5 paras 20-21. Revoked is terminal; no further status changes are permitted.` (key `cooperativeApproach.transitionFromRevoked`)
   - Force a `revert-to-Draft` via API call against a non-Draft CA. Toast: `Cooperative approach <id> cannot revert from <oldStatus> to Draft. Once a CA leaves Draft, its working version is fixed.` (key `cooperativeApproach.transitionRevertToDraft`)
7. **Negative — not found.** Navigate to `/cooperativeApproaches/view/CA-DOES-NOT-EXIST`. Toast: `Cooperative approach CA-DOES-NOT-EXIST not found.` (key `cooperativeApproach.notFound`)
8. From the list page, click **Add New**. Host Party is a disabled field showing the registry's own configured country (`systemCountryCode`, e.g. `NG`) — it cannot be edited. Fill title + pick one or more Participating Parties from the country dropdown (the host country is pre-selected and cannot be removed) → submit → returns to list with new row.
9. On an **Active** CA's detail page, click **Add Authorized Entity**. Authorizing Party is shown read-only as the host country. **Country of Incorporation** is a required dropdown restricted to that CA's Participating Parties — confirm a country outside that set isn't offered, and that submitting without selecting one is blocked client-side.

**Pass criteria**: 3 seeded rows visible; Active↔Suspended transitions persist; Draft is not a downstream option; terminal-state and not-found error toasts surface the new specific text; Add New creates a new row with the host country locked in; Add Authorized Entity enforces Country of Incorporation ⊆ Participating Parties.

---

## 2. Initial Report — paragraph 18 enforcement (Decision 2/CMA.3 ¶ 18)

**Login**: DNA Admin.

1. Sidebar → **Initial Reports**. URL `/initialReports/viewAll`. Expected: 2 rows (`IR-001 Submitted`, `IR-002 Draft`).
2. Click `IR-002` row → detail page `/initialReports/view/IR-002`.
   - Expected: Status tag = `Draft`. **Edit** + **Submit** buttons visible (top right).
3. Click **Edit** → form page `/initialReports/edit/IR-002`. Five sections stacked (CA Details / Participation / ITMO Metrics / NDC Quantification / Environmental Integrity). Edit any field → **Update** → returns to detail page with the new value.
4. From `IR-002`'s detail page click **Submit**. Expected: status flips Draft → Submitted, Submit button disappears, only Edit remains.
5. Click `IR-001` row.
   - Expected: Status `Submitted`. **Edit** still shown (Submitted is mutable today — see §11 known gaps), **Submit** hidden.
6. Click **Generate Report** (top right of the list page) → form. Pick `CA-002` from the dropdown (or any CA with no IR yet) → submit. Expected: 409 Conflict toast (one IR per CA).

**Pass criteria**: list shows 2 rows in correct status; edit page renders all 5 sections; Submit flips status; one-IR-per-CA guard fires.

---

## 3. Programme authorization — para 18 + revoked-CA + suspended-CA gates (Decisions 2/CMA.3 ¶ 18, Draft -/CMA.5 ¶¶ 20–21)

**Login**: DNA Admin.

1. Sidebar → **Project Details**. URL `/programmeManagement/viewAll`. Expected: 4 rows (`001 PENDING`, `002 APPROVED`, `003 AUTHORISED`, `004 AUTHORISED`) all linked to CA-001.
2. Click row `002` → detail page. Scroll to General card (right column, lightbulb icon).
   - Expected: **Cooperative Approach: CA-001** and **Authorization Purpose: UseTowardsNDC** at the bottom of the General card.
3. Click row `003` → detail page. Same Cooperative Approach row visible.
4. **CA-state authorize gates.** Drive these by flipping CA-001's status from the Cooperative Approaches detail page, then attempting to authorise a project linked to it (any non-AUTHORISED row, e.g. `001` PENDING after pushing it to APPROVED).
   - **Suspended**: set CA-001 → Suspended. Authorize attempt fires toast: `Cooperative approach CA-001 is Suspended. Suspension is temporary; reactivate the cooperative approach (Active) before authorizing programmes under it (Draft -/CMA.5 para 20).` (key `programme.caSuspendedBlocksAuth`)
   - **Revoked**: set a throwaway CA → Revoked, link a programme to it, attempt authorize. Toast: `Cooperative approach <id> is Revoked. Revoked is terminal; new ITMO authorizations are not permitted (Draft -/CMA.5 para 21). Use a different cooperative approach for this programme.` (key `programme.caRevokedBlocksAuth`)
   - **Missing IR**: link a programme to CA-002 (whose IR is Draft). Toast: `Cannot authorize ITMOs for cooperative approach CA-002 ("<title>"): submit the Initial Report for this CA first (Initial Reports → CA-002 → Submit). Required by Dec 2/CMA.3 Annex para 18.` (key `programme.noSubmittedIrForCaAuth`)
   - **Article 6 trade flag without CA**: clear `cooperativeApproachId` on a programme (DB or admin tool) and retry. Toast: `Programme <id> is flagged as Article 6.2 (article6trade=true) but has no cooperativeApproachId. Link it to a cooperative approach before authorizing (Dec 2/CMA.3 Annex para 18).` (key `programme.article6CaRequiredForAuth`)
   Restore CA-001 to Active so downstream tests pass.
5. Attempt to authorize an already-authorised programme from the action buttons on `004`'s detail page (button label may be **Authorise** if visible).
   - Expected: 400 with "This project has already been authorised" toast.

**Pass criteria**: General card shows CA + Authorization Purpose on every Article 6.2 project; suspend/revoke/missing-IR/no-CA gates each fire with their specific message; double-authorize is rejected.

---

## 4. Credit issuance — structured ITMO serial + OMGE/SOP deductions (Decisions 2/CMA.3 ¶ 4, 3/CMA.3 ¶ 1, 6/CMA.4 Annex I ¶ 5)

**Login**: DNA Admin.

1. Sidebar → **Credits ▸ Credit Balance**. URL `/credits/balance`.
2. Filter / scroll to find blocks for project `004`. Expected: **3** rows:

   | Block ID | Account Type | Credit Amount | OMGE | SOP | Itmo Serial |
   |---|---|---|---|---|---|
   | `BLK-DEMO-D-HOLD` | Holding | 930 | ✓ | ✓ | `NG-tCO2e-1-004-2026-1-930` |
   | `BLK-DEMO-D-OMGE` | CancellationOMGE | 20 | ✓ | ✓ | `NG-tCO2e-1-004-2026-931-950` |
   | `BLK-DEMO-D-SOP` | CancellationSOP | 50 | ✓ | ✓ | `NG-tCO2e-1-004-2026-951-1000` |

3. Click on the Holding block → confirm the structured ITMO serial parses as `<party>-<unit>-<sectoralScope>-<projectId>-<vintage>-<startSerial>-<endSerial>`.
4. Verify ratio: 1000 issued × 2% = 20 OMGE, 1000 × 5% = 50 SOP, 1000 - 70 = 930 Holding. Auto-deductions reconcile.

**Pass criteria**: 3 rows visible with the exact split + flags; structured serial parses; arithmetic reconciles.

---

## 5. Credit transfer — synchronous design + Article 6.2 scope (Decision 2/CMA.3 Annex ¶ 1(a))

**Login**: PD Admin (Org A).

1. Sidebar → **Credits ▸ Credit Balance**. Should show only blocks owned by your org (companyId 1). Expected: same 3 blocks visible (the seed put the Holding block under Org A).
2. On the Holding row, click the **⋯** ellipsis action → **Transfer**. Modal opens.
3. Fill: recipient organisation = Org B (`palinda+dev2@xeptagon.com`), amount = `100`, remarks = "Manual QA transfer". Submit.
   - Expected: 200 toast. Sender's Holding block drops to 830. A new 100-credit Holding block appears owned by Org B (visible to DNA via Credits ▸ Credit Balance).
4. **Switch to DNA Admin** (logout + log in again). Sidebar → **Credits ▸ Credit Balance**. Filter to find the new 100-credit block — confirm projectRefId still `004`.
5. **Switch to PD Admin (Org A)**. Try to transfer 5000 from a block that has 830. Expected: 400 "notEnoughCreditAmount" toast.
6. Try to transfer to your own organisation (recipient = Org A). Expected toast: `You cannot transfer credits to your own organisation. Pick a different recipient.` (key `creditTransaction.selfTransferRejected`)
7. **Revoked-CA transfer block.** Drive a CA → Revoked, then attempt to transfer a block whose `cooperativeApproachId` matches it. Toast: `Credit block <blockId> was issued under cooperative approach <caId>, which has since been Revoked. ITMO transfers from a Revoked CA are not permitted (Draft -/CMA.5 para 21).` (key `creditTransaction.transferFromRevokedCa`)

**Pass criteria**: synchronous transfer flips ownership immediately; overdraw, self-transfer, and revoked-CA transfer all surface their specific rejection messages.

---

## 6. Retirement — six types + DNA approval flow (Decisions 2/CMA.3 ¶ 1, 4/CMA.6 Annex II)

**Login**: PD Admin (Org A).

1. Sidebar → **Credits ▸ Credit Balance**. On the Holding row → **⋯** → **Retire**. Modal opens.
2. Verify modal has **6** retirement type radios:
   - `USE_TOWARDS_NDC`
   - `FIRST_TRANSFER_FOR_OIMP`
   - `VOLUNTARY_CANCELLATIONS`
   - `OMGE_CANCELLATION`
   - `SOP_ADAPTATION`
   - `CROSS_BORDER_TRANSACTIONS`
3. Pick `USE_TOWARDS_NDC`, amount = `50`, remarks = "Manual QA". Submit. Expected: row appears in **Credits ▸ Retirements** with status Pending.
4. **Switch to DNA Admin**. Sidebar → **Credits ▸ Retirements**. Find the pending row → click **Approve**. Expected: toast success, status flips to Approved.
5. Sidebar → **Credits ▸ Credit Balance**. Filter `accountType=RetirementNDC`. Expected: a new 50-credit block in `RetirementNDC` (the type→AccountType map for `USE_TOWARDS_NDC`).
6. As PD Admin, attempt to retire 5000 from a block with 780. Expected: 400 toast.
7. Negative case: as PD Admin attempt to call `/performRetireAction` with `action=ACCEPT` (CASL — only DNA can approve). Skip if no UI surface; the e2e suite covers this.

**Pass criteria**: 6 types in modal; USE_TOWARDS_NDC lands in RetirementNDC; overdraw rejected.

---

## 7. Corresponding Adjustment — para 8 formula (Decision 2/CMA.3 ¶ 8)

**Login**: DNA Admin.

1. Sidebar → **Corresponding Adjustments**. Expected: 1 row (`CA-ADJ-001` Draft, CA-001, 2026).
2. Click row → detail page. Verify:
   - `firstTransferred`, `acquired`, `usedTowardsNDC` all present
   - `emissionsBalance = firstTransferred - acquired + usedTowardsNDC`
3. Click **Submit** → status flips Draft → Submitted.
4. Re-calc for the same `(CA-001, 2026)`: pick **Add New** → CA-001 → 2026 → SingleYear / Trajectory → Submit. Expected: a new `CA-ADJ-002` is created (no idempotency — by design, locks the no-idempotency invariant).
5. Edge case test (negative emissions balance): if you've recorded only acquisitions for a CA, `emissionsBalance` should be negative. Skip if seed data doesn't include it; the e2e suite covers it.

**Pass criteria**: formula correct; submit flips status; re-calc produces a distinct id.

---

## 8. AEF reporting — exports (Decision 4/CMA.6 Annex II)

**Login**: DNA Admin.

1. Sidebar → **Reports**. URL `/reports`.
2. Pick **Year** = `2026`, **Report type** = `HOLDINGS`, **File type** = `CSV` → **Download**. Expected: file downloads OR `400 nothingToExport` if year is empty.
3. Repeat for HOLDINGS × XLSX, ACTIONS × CSV, ANNUAL_INFORMATION × CSV.
4. Open ACTIONS CSV — each row should carry the structured `itmoSerial`, `actionType`, `cooperativeApproachId`, `acquiringPartyCountryCode`.
5. Open ANNUAL_INFORMATION CSV — `cumulativeAmount` column should be monotonically non-decreasing across rows sorted by `reportingYear`.

**Pass criteria**: 4 file types reachable; row content carries CA + serial; cumulativeAmount monotonic.

---

## 9. Cross-role permission spot-checks (CASL)

Log in as each role in turn and visit the URL. Pass criteria in the table.

| Role | Page | Pass criteria |
|---|---|---|
| **PD Admin** | `/cooperativeApproaches/viewAll` | List visible (read-allowed); **Add New** button absent |
| **PD Admin** | `/cooperativeApproaches/add` (force-navigate) | Form blocked or rejects on submit (403/401) |
| **PD Admin** | `/initialReports/viewAll` | sidebar item is **hidden**; force-navigation shows blank or empty list |
| **PD Admin** | `/correspondingAdjustments/viewAll` | sidebar item hidden; force-navigation 403 |
| **PD Admin** | `/reports` | sidebar item hidden; force-navigation 403 |
| **IC Admin** | `/credits/balance` | sidebar item hidden (only DNA + PD see it) |
| **DNA ViewOnly** | `/cooperativeApproaches/viewAll` | List visible; **Add New** absent or disabled; status dropdowns disabled |
| **DNA ViewOnly** | `/programmeManagement/viewAll` | List visible; row click works; action buttons (Authorise/Issue) absent |
| **Ministry Admin** | All DNA pages | Visible (mirrors DNA Admin); action buttons present |

Spot-check 3-4 rows per session.

---

## 10. UI regression sentinels

These are the bugs we've already fixed; record any regression.

1. **`/programmeManagement/viewAll` empty state**: navigate as DNA, search for a non-existent project (e.g. `EMPTY-LIST-XXX`). Expected: Ant Design `.ant-empty` empty state, no white-screen crash.
2. **`/programmeManagement/view/<refId>` for a minimally-seeded project**: e.g. `view/004`. Expected: page renders; `projectProposalStage` null-safety holds.
3. **Project detail page with no `independentCertifiers`**: same project. Expected: "Independent Certifier: -" instead of a `.join()` crash.
4. **Sidebar role visibility** (final cross-check): PD Admin's sidebar should NOT show Reports / Corresponding Adjustments / Initial Reports.

---

## 11. Known UX gaps (don't flag as failures)

These are documented gaps in the registry today; record their state for the audit trail without raising new bugs:

- **IR /generate against a Revoked CA** — succeeds; no guard at `initial-report.service.ts`. The /authorize gate catches downstream consequences.
- **IR /update on a Submitted IR** — succeeds; only Published is locked at `initial-report.service.ts:184`.
- **Logout** — no `/auth/logout` endpoint. Tokens remain valid until natural expiry.
- **Acquisition (inbound ITMOs)** — no endpoint exists. Foreign-issued ITMOs cannot be ingested. Critical compliance gap.
- **CA optimistic locking** — no `@VersionColumn`; parallel `PUT /update` is last-write-wins.
- **Project detail page** — many fields show `undefined`/`-` because seed only fills the Article 6.2-relevant subset (geography, sectoralScope, dates).
- **Project detail page** — does NOT show project's linked IR; navigate via Initial Reports separately.
- **CA detail page** — no "Programmes / IRs under this CA" section. Cross-link manually.
- **Sidebar label** — `Project Details` is misleading; "Programmes" or "Projects" would map cleaner to the para 18 vocabulary.

---

## 12. Sign-off

Section | Pass / Fail / N/A | Notes
---|---|---
1 Cooperative Approach lifecycle | |
2 Initial Report (para 18) | |
3 Programme authorization | |
4 Credit issuance + serial + OMGE/SOP | |
5 Credit transfer | |
6 Retirement | |
7 Corresponding Adjustment | |
8 AEF reporting | |
9 CASL spot-checks | |
10 UI regression sentinels | |

**Tester**: ____________  **Date**: ____________  **Build SHA**: `git rev-parse HEAD`

---

**Error message provenance.** The English text for every `<key>` reference in §1, §3, §5 lives in `backend/services/libs/shared/src/i18n/en/<namespace>.json` (resolved server-side via `helperService.formatReqMessagesString`). The web-side fallbacks for create/update toasts live in `web/public/locales/i18n/common/<lang>.json` under `cooperativeApproachCreateFailed` / `cooperativeApproachUpdateFailed`. Adding a new locale means translating those JSON files; the throw-sites stay unchanged.
