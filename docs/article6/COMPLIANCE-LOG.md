# Article 6.2 Compliance Log

This document retroactively maps commits on the Article 6.2 track to the specific UNFCCC clauses they satisfy or test. Use it alongside `docs/article6/README.md` (feature index) and the per-feature docs in this directory.

Primary sources cited:

- **Decision 2/CMA.3** (Glasgow, 2021) — foundational Article 6.2 guidance
- **Decision 3/CMA.3** — Article 6.4 rules (cited for contrast with 6.2)
- **Decision 6/CMA.4** (Sharm el-Sheikh, 2022) — ITMO serial number, action subtypes
- **Decision 4/CMA.6 Annex II** (Baku, 2024) — current AEF table structure (5 tables)
- **Draft -/CMA.5** (Dubai, 2023) — authorization content, revocation, TER sequencing

## Commit → UNFCCC mapping (chronological)

### Registry implementation phases (pre-test-suite)

| Commit | Feature | UNFCCC clauses it implements |
|---|---|---|
| `3495767b8` feat: Cooperative Approach entity (Phase 1) | CA entity, authorizationPurpose enum, lifecycle status | Dec 2/CMA.3 Annex chapter V para 1(a), 3-5 (participation + CA identification), Draft -/CMA.5 para 27(a)-(j) (authorization content) |
| `9d3ee0edd` feat: ITMO lifecycle + account structure (Phase 2) | AccountType enum (6 values), CreditTransactionTypesEnum (10 values), CreditRetirementTypeEnum (4 new types), ItmoAccount entity, cooperativeApproachId + authorizationPurpose on blocks and transactions | Dec 2/CMA.3 Annex para 29 (account types in national registry), Dec 6/CMA.4 Annex I para 5 (ITMO components — partially), Draft -/CMA.5 para 80 (action subtypes catalogue), para 87 (tracking arrangements) |
| `3e9481436` feat: OMGE/SOP deduction config (Phase 3) | `calculateDeductions` with floor rounding, `omgeDeductedAtIssuance` / `sopDeductedAtIssuance` flags, CANCELLATION_OMGE / CANCELLATION_SOP AccountType buckets | Dec 3/CMA.3 paras 66-67 (contrast: 6.4 mandatory 2% OMGE + 5% SOP), Draft -/CMA.5 paras 57-59 (6.2 encourages voluntary OMGE/SOP) |
| `e74142295` feat: Expand AEF reporting (Phase 4) | 11-value AefActionTypeEnum, 3-value AefReportTypeEnum, new columns on AefActionsTableEntity, downloadAefReport path | Dec 4/CMA.6 Annex II (AEF tables 1-5; registry implements 3 of them), Dec 2/CMA.3 Annex para 20 (annual reporting) |
| `83ce32640` feat: Corresponding Adjustment (Phase 5) | CorrespondingAdjustment entity, NdcType/CaMethod/CaStatus enums, para 8 emissions-balance formula, para 9 safeguard check | Dec 2/CMA.3 Annex para 7 (SINGLE_YEAR vs MULTI_YEAR methods), para 8 (emissions-balance formula `firstTransferred - acquired + usedTowardsNDC`), para 9 (safeguard: adjusted emissions <= NDC target) |
| `1c00e24e4` feat: Initial Report generation (Phase 6) | InitialReport entity, 5-section jsonb structure, pre-population from CA, Draft -> Submitted transition | Dec 2/CMA.3 Annex chapter V para 18 (initial report prerequisite — structure only; the guard was not wired), Draft -/CMA.5 paras 92-93 (sequencing: IR before AEF actions are valid) |

### Test suite + documentation (first push)

| Commit | What it did | UNFCCC clauses it verifies |
|---|---|---|
| `81d502c1f` test: scaffold E2E helpers + docs structure | Playwright helpers, fixtures, docs/article6/ directory | Meta — infrastructure for subsequent compliance verification |
| `722ca6376` test: Cooperative Approach E2E spec + doc | 14 tests, CA CRUD + status lifecycle + permission matrix | Dec 2/CMA.3 Annex paras 1(a), 3-5 verified via `POST /create` happy-path + `PUT /update` status-lifecycle tests |
| `f2ff2efa4` test: ITMO lifecycle E2E spec + doc | 13 tests, AccountType enum shape + queryBalance filter + retirement dispatch CASL | Dec 2/CMA.3 Annex para 29 (account types) verified via AccountType cardinality + UI filter; Draft -/CMA.5 para 80 (action subtypes) verified via CreditTransactionTypesEnum shape test |
| `d2667f1f8` test: OMGE/SOP deduction E2E spec + doc | 19 tests, arithmetic invariants (floor-rounding formula) | Dec 3/CMA.3 paras 66-67 referenced for contrast; Draft -/CMA.5 paras 57-59 voluntary-under-6.2 context; `calculateDeductions` floor-rounding locked in via pure-TS arithmetic tests |
| `7baf65c9e` test: AEF reporting E2E spec + doc | 18 tests, download endpoints + enum cardinality + permission gate | Dec 4/CMA.6 Annex II: 3 of 5 AEF tables currently implemented (HOLDINGS, ACTIONS, ANNUAL_INFORMATION); missing Submission + Authorized Entities tables flagged as gap |
| `25a9bb187` test: Corresponding Adjustment E2E spec + doc | 24 tests, para 8 arithmetic identity + safeguard fallback + method/type shape | Dec 2/CMA.3 Annex para 7 (all 3 CaMethods + 2 NdcTypes exercised), para 8 (emissionsBalance formula verified), para 9 (safeguard check fallback documented as gap: defaults true when nationalEmissions missing) |
| `617f4d9ba` test: Initial Report E2E spec + doc | 23 tests, generate/update/submit + pre-population + /check probe | Dec 2/CMA.3 Annex para 18 structural verification. **Critically, the test suite surfaced the para 18 enforcement gap: `hasSubmittedReport` is declared and exposed via `GET /check` but never called as a guard by any upstream service. Documented as the lead critical gap.** |
| `3b1cc6f9d` test: cross-cutting integration E2E spec + doc | 19 tests, flagship end-to-end + full CASL matrix + sequencing invariants + serial-number immutability | Tied together: Dec 2/CMA.3 para 18 (as fixme), Draft -/CMA.5 para 132 (serial immutability, as fixme), full permission matrix, flagship 8-call chain across 5 features |
| `eb349aee1` docs: consolidate README with feature index and critical gaps | Top-level index with 12 compliance gaps listed | Meta — aggregates and foregrounds all identified gaps for an auditor reading the repo cold |

### Test-execution fixes (live-run phase)

| Commit | What it fixed | UNFCCC-significant finding |
|---|---|---|
| `0a7e447e7` test: fix E2E test bugs + surface backend gaps | Tests: PascalCase wire values, `sort.key`, `createdDate` vs `createdTime`, Ant Design selectors. Infra: quoted SMTP_USERNAME placeholder, added :Z SELinux labels to bind mounts, ARG PORT in web Dockerfile second stage | **Backend gaps surfaced:** (1) `credit_block_balances_view_entity` missing the `accountType` column — Phase 2 migration incomplete, any `queryBalance` with accountType filter crashed 500 in a way that would fail AEF Holdings reporting; (2) CASL factory grants Read on CorrespondingAdjustment to PD/IC roles even though Article 6.2 accounting data (Dec 2/CMA.3 Annex paras 7-9) is DNA-Party business. Both flagged as fixme with Gaps entries. |
| `bbcea9d7d` fix: un-fixme 6 tests via backend fixes + seeded roles | **Phase A**: seeded Ministry admin + DNA ViewOnly users (closing the coverage gap for Draft -/CMA.5 para 27(b) where the "Party" authorized entity may be a Ministry, not just a DNA). **Phase B**: `corresponding-adjustment.controller.ts` dropped `onlyInject=true` from `/query` PoliciesGuardEx so PD / IC are correctly 403'd (Dec 2/CMA.3 Annex para 7-9 scope: CA accounting is for the authorizing Party, not project developers). **Phase C**: `credit_block_balances_view_entity` view SQL extended with `accountType`, `cooperativeApproachId`, `authorizationPurpose`, `omgeDeductedAtIssuance`, `sopDeductedAtIssuance` — required for AEF Holdings rows under Dec 4/CMA.6 Annex II and for Dec 2/CMA.3 Annex para 29 account-type visibility. | Substantive compliance improvement: the AEF Holdings projection is now faithful to the source entity (Phase 2 columns flow through to queries) and the CASL surface matches UNFCCC's scoping of CA accounting responsibility. |
| `2feb01596` test: un-fixme 6 more tests via direct DB-seed helpers + UI flows | Adds `seedCreditBlockDirect`, `seedEmissionRowDirect`, `setInitialReportStatusDirect`, `seedAefActionDirect` as test-only escape hatches; implements antd form-submit UI flows; promotes safeguard-fail-path, Published-IR-is-immutable, HOLDINGS-filter, ACTIONS-report row-content, credit-block-with-CA round-trip, and issuance-flags round-trip from fixme to passing | Verification coverage improvements: Dec 2/CMA.3 para 9 safeguard-fail path now exercised; Draft -/CMA.5 paras 92-93 initial-report immutability-after-publication now exercised; Dec 4/CMA.6 Annex II HOLDINGS vs ACTIONS filter projection now exercised end-to-end. No production behaviour changed; this commit only closes gaps in the test surface. |

### Blocker / Major / Minor resolution sprint (post-fixme triage)

After the audit in `README.md` identified 3 blockers, 3 majors, and 1 minor as fixable, the following commits landed them in severity order. Each commit's body cites the UNFCCC clause, before/after posture, and resulting suite-state delta.

| Commit | Severity | UNFCCC clause | What changed |
|---|---|---|---|
| `4d0de2ac0` fix: enforce Dec 2/CMA.3 para 18 before first ITMO authorization | BLOCKER | Dec 2/CMA.3 Annex chapter V ¶18 | `programme.service.authorizeProgramme` now refuses any Article 6.2 programme without a linked CA whose Initial Report is in status `Submitted` or `Published`. HTTP 400 cites the paragraph. Added `cooperativeApproachId` column to `Programme`. Verified by two cross-cutting tests (pass + fail paths). |
| `8e353f806` fix: identify first transfer per Dec 2/CMA.3 para 1(a) | BLOCKER | Dec 2/CMA.3 Annex ¶1(a), Dec 4/CMA.6 Annex II Actions table | Replicator now passes the pre-update `CreditBlocksEntity` to `handleTransactionRecords` and `handleAefRecord`; both services compare pre-vs-post to assign `CreditTransactionTypesEnum.FIRST_TRANSFER` / `AefActionTypeEnum.FIRST_TRANSFER` correctly. `credit_block_transfers_view_entity` widened to include FirstTransfer rows and the new Phase 2 metadata columns. |
| `5c2774aef` fix: add structured 5-component ITMO serial per Dec 6/CMA.4 Annex I para 5 | BLOCKER | Dec 6/CMA.4 Annex I ¶5, Draft -/CMA.5 ¶132 | `CreditBlocksEntity` gains an `itmoSerial` column populated at issuance with `{party}-{itmoType}-{vintage}-{activityId}-{start}:{end}`. `SerialNumberManagementService` exposes `getItmoSerial` / `parseItmoSerial`. The internal opaque `serialNumber` stays for split arithmetic; `itmoSerial` is what AEF tables reference. Immutability honored by the existing split-not-mutate pattern. |
| `c17d5bf95` fix: add Revoked CA status per Draft -/CMA.5 paras 20-21 | MAJOR | Draft -/CMA.5 ¶¶20-21 | `CooperativeApproachStatus` enum gains `REVOKED`. `authorizeProgramme` refuses revoked CAs as ITMO sources, HTTP 400 cites the paragraphs. The existing `PUT /cooperativeApproach/update` already accepts status transitions, so revocation flows through the standard DNA details UI. |
| `674a9cf68` fix: wire 4 new retirement types into UI radios + service dispatch | MAJOR | Dec 2/CMA.3 Annex ¶29, Draft -/CMA.5 ¶80 | Credit retirement modal renders 4 new Article 6.2 radios (Use Towards NDC, Use For OIMP, OMGE Cancellation, SOP Adaptation). `ProgrammeLedgerService.addRetireActionResponse` uses a new `mapRetirementTypeToAccountType` helper so the derived retirement block ends up in the correct `AccountType` bucket; also propagates `cooperativeApproachId` / `authorizationPurpose` / `itmoSerial` to the derived block. |
| `ddf5a41af` fix: expose ItmoAccount via /national/itmoAccount/query | MAJOR | Dec 2/CMA.3 Annex ¶29 | New read-only HTTP surface: `ItmoAccountService` + `ItmoAccountController` + CASL DNA-only Read grant. AEF submission software can now query per-account holdings directly instead of aggregating from the balance view. |
| `af9f07ddc` fix: expose deduction config via /national/admin/deductionConfig | MINOR | Draft -/CMA.5 ¶59 (voluntary-SOP/OMGE context) | `GET /national/admin/deductionConfig` returns the live `{omgePercentage, sopPercentage, autoDeductAtIssuance}` triple, DNA admin/root only. Partial resolution — config remains env-var-driven, write path not exposed. |

**Net effect on compliance posture:** all three structural blockers identified in `README.md` § "Critical compliance gaps" are resolved; two of the three majors are fully resolved (Revoked status + retirement type wiring + ItmoAccount endpoint); the third (retirement modal radios) is resolved on both UI and backend dispatch paths. Suite state moved from 120 passed / 10 skipped (pre-sprint) to **130 passed / 3 skipped**. Remaining fixmes cover fundamentally untestable cases (env-var-restart toggle, two service-behavior tests that would duplicate coverage already provided by other passing tests) rather than compliance gaps.

## How to read this log going forward

Future commits on the Article 6.2 track should state:

1. **Which UNFCCC clause** the change addresses, cited by decision number + annex + paragraph (e.g., "Dec 2/CMA.3 Annex chapter V para 18").
2. **Blocker / Major / Minor** severity per the classification in `docs/article6/README.md`.
3. **Before / after compliance posture**: what a TER reviewer would have flagged before the change, and whether the change fully closes or only partially addresses the concern.

Entries in this log should follow the "Commit → UNFCCC mapping" table structure above. Update the README's critical-gaps list when a gap is closed.
