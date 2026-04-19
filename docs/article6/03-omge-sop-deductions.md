# 03 - OMGE / SOP Deductions (Article 6.2, Phase 3)

> **Phase commit**: `3e9481436` - **Primary surface**: `ProgrammeLedgerService.getDeductionConfig()` / `.calculateDeductions()`, `CreditBlocksEntity.{omgeDeductedAtIssuance, sopDeductedAtIssuance}`, ITMO config keys - **Test spec**: [`omge-sop-deductions.spec.ts`](../../tests/e2e/article6/omge-sop-deductions.spec.ts)

## UNFCCC requirement

"OMGE" refers to **Overall Mitigation in Global Emissions** and "SOP" to the **Share of Proceeds for adaptation** (channelled to the Adaptation Fund). These two concepts sit at the core of the Article 6 environmental-integrity architecture.

- **Article 6.4 (Mandatory).** Decision 3/CMA.3 (Glasgow, 2021) paragraphs 66-67 impose a mandatory 5% share-of-proceeds for adaptation and a mandatory 2% Overall Mitigation in Global Emissions on each issuance of Article 6.4 emission reductions. The 5% SOP is transferred to the Adaptation Fund; the 2% OMGE is cancelled outright and cannot be transferred or used towards any NDC.
- **Article 6.2 (Voluntary).** Decision 2/CMA.3 para 36 and Draft Decision -/CMA.5 (SBSTA 59, Dubai 2023) paras 57-59 **encourage but do not mandate** equivalent contributions on ITMOs transferred under Article 6.2. Parties engaging in cooperative approaches are "strongly encouraged" to apply SOP for adaptation and to ensure OMGE, but there is no binding percentage floor.
- **Action-type catalogue.** Draft CMA.5 para 80 lists "cancellation for OMGE" as a distinct transaction type; SOP is recorded as an account transfer rather than a separate action (Dec 2/CMA.3 annex para 65). Both must be traceable back to issuance via the ITMO serial number (Dec 6/CMA.4 Annex I para 5).
- **Environmental-integrity floor.** OMGE and SOP together function as a conservation mechanism: aggregated over all Article 6 transactions, they lower the total stock of tradable ITMOs, which is the Paris Agreement's in-registry expression of "ambition over time".

Because this registry implements Article 6.2, the percentages are configurable rather than fixed. The Phase 3 defaults (2% OMGE, 5% SOP, auto-deducted at issuance) intentionally mirror the Article 6.4 mandatory rates so that a Party applying the encouraged behaviour to ITMOs under 6.2 gets Article 6.4-equivalent treatment out of the box.

## Registry implementation

### Configuration

`backend/services/libs/core/src/app-config/configuration.ts` lines 140-145:

```ts
itmo: {
  omgePercentage: parseFloat(process.env.ITMO_OMGE_PERCENTAGE) || 2,
  sopPercentage: parseFloat(process.env.ITMO_SOP_PERCENTAGE) || 5,
  autoDeductAtIssuance:
    process.env.ITMO_AUTO_DEDUCT_AT_ISSUANCE === "false" ? false : true,
},
```

| Key | Env var | Default | Meaning |
| --- | --- | --- | --- |
| `itmo.omgePercentage` | `ITMO_OMGE_PERCENTAGE` | `2` | Percentage of each issuance routed to the `CANCELLATION_OMGE` account. |
| `itmo.sopPercentage` | `ITMO_SOP_PERCENTAGE` | `5` | Percentage of each issuance routed to the `CANCELLATION_SOP` account. |
| `itmo.autoDeductAtIssuance` | `ITMO_AUTO_DEDUCT_AT_ISSUANCE` | `true` | When `true` (default), Phase 3 deducts OMGE + SOP at issuance time. Set to the literal string `"false"` to disable auto-deduction. |

All three values are captured at process start and cannot be changed without a backend restart.

### Extended `CreditBlocksEntity`

`backend/services/libs/shared/src/entities/credit.blocks.entity.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `omgeDeductedAtIssuance` | `boolean` | Default `false`. Set to `true` on the new block created inside `issueCredits()` when `autoDeductAtIssuance=true`. Prevents a downstream action from applying the OMGE deduction again. |
| `sopDeductedAtIssuance` | `boolean` | Default `false`. Same semantics as above, for SOP. |

Both flags were introduced in Phase 3 but are also referenced by the Phase 2 entity schema (documented in `docs/article6/02-itmo-lifecycle.md`).

### Service-layer additions (programme-ledger)

`backend/services/libs/shared/src/programme-ledger/programme-ledger.service.ts`

| Method | Purpose |
| --- | --- |
| `getDeductionConfig()` | Reads `itmo.omgePercentage`, `itmo.sopPercentage`, `itmo.autoDeductAtIssuance` from NestJS `ConfigService` and returns the triple `{omgePercentage, sopPercentage, autoDeductAtIssuance}`. Defaults to `{2, 5, true}` when keys are missing. Lines ~2842-2855. |
| `calculateDeductions(totalCredits)` | Pure function. If `autoDeductAtIssuance === false`, returns `{netCredits: totalCredits, omgeAmount: 0, sopAmount: 0}`. Otherwise computes `omgeAmount = Math.floor(totalCredits * omgePct / 100)`, `sopAmount = Math.floor(totalCredits * sopPct / 100)`, `netCredits = totalCredits - omgeAmount - sopAmount`. Never returns a negative `netCredits` because `Math.floor` keeps the sum of deductions at most equal to the total. Lines ~2861-2878. |
| `issueCredits()` (modified) | When `autoDeductAtIssuance=true`, sets `omgeDeductedAtIssuance = true` and `sopDeductedAtIssuance = true` on the newly-created `CreditBlocksEntity` row. The deducted amounts are routed through the existing `retireToAccount` / `cancelForOMGE` helpers into `CANCELLATION_OMGE` and `CANCELLATION_SOP` accounts (see Phase 2 doc). Lines ~459-463. |

### API endpoints

No new controller was added in Phase 3. Neither `getDeductionConfig()` nor `calculateDeductions()` is exposed over HTTP. The observable surface is the same as Phase 2:

| Method | Path | Phase 3 relevance |
| --- | --- | --- |
| `POST` | `national/creditTransactionsManagement/queryBalance` | Response rows may include `omgeDeductedAtIssuance`, `sopDeductedAtIssuance`; `filterAnd` accepts `accountType="CancellationOMGE"` and `accountType="CancellationSOP"`. |
| `POST` | `national/creditTransactionsManagement/queryRetirements` | Transactions whose `toAccountType` is `CancellationOMGE` or `CancellationSOP` correspond to Phase 3 deduction events. |

No admin endpoint exists to read or override the configured percentages or the `autoDeductAtIssuance` flag.

### UI changes

Phase 3 did not add a dedicated UI. Deduction outcomes surface through the Phase 2 Credit Balance page:

| Route | Component | Phase 3 relevance |
| --- | --- | --- |
| `/credits/balance` | `web/src/Pages/CreditPages/creditBalancePage.tsx` | The `Cancelled (OMGE)` and `Cancelled (SOP)` filter options (added in Phase 2) map to the AccountType enum values where Phase 3 routes deducted credits. Selecting either option triggers `POST /queryBalance` with `filterAnd: [{ key: "accountType", operation: "=", value: "CancellationOMGE" or "CancellationSOP" }]`. |

There is no UI to configure the OMGE / SOP percentages or to toggle `autoDeductAtIssuance`.

## Requirement -> implementation mapping

| UNFCCC requirement | Implementation | Verified by |
| --- | --- | --- |
| Article 6.2 SOP is voluntary but encouraged (Draft CMA.5 paras 57-59) | `itmo.sopPercentage` configurable via env; default `5` mirrors Dec 3/CMA.3 ¶67's 6.4 mandatory rate | `Arithmetic invariants > default 2% OMGE / 5% SOP ...`, `Configuration shape > default config mirrors configuration.ts` |
| Article 6.2 OMGE is voluntary but encouraged (Draft CMA.5 paras 57-59) | `itmo.omgePercentage` configurable via env; default `2` mirrors Dec 3/CMA.3 ¶66's 6.4 mandatory rate | Same as above |
| OMGE cancellation is a first-class action (Draft CMA.5 para 80) | Deducted OMGE credits routed to `CANCELLATION_OMGE` account via `cancelForOMGE` (Phase 2 service helper); `OMGE_CANCELLATION` in `CreditTransactionTypesEnum` | `Account routing > queryBalance accepts accountType=CancellationOMGE filter` |
| SOP proceeds traceable in the registry (Dec 2/CMA.3 annex para 65) | Deducted SOP credits routed to `CANCELLATION_SOP` account; visible via `queryBalance` with `accountType="CancellationSOP"` filter | `Account routing > queryBalance accepts accountType=CancellationSOP filter` |
| No double deduction (conservation across lifecycle) | `omgeDeductedAtIssuance` and `sopDeductedAtIssuance` boolean flags on `CreditBlocksEntity`; set to `true` at issuance; intended to be carried forward unchanged by downstream transfers | *(not verified — test.fixme: requires issuance + transfer fixtures)* |
| Net issuance = total - OMGE - SOP (conservation) | `calculateDeductions` returns `netCredits = totalCredits - omgeAmount - sopAmount` | `Arithmetic invariants > default 2% OMGE / 5% SOP ...`, `Arithmetic invariants > floor rounding on 333 credits`, `Arithmetic invariants > large issuance ...`, `Arithmetic invariants > custom percentages ...` (conservation asserted via `netCredits + omge + sop === input`) |
| Floor-rounded deductions (never over-subtract) | `Math.floor` on both `omgeAmount` and `sopAmount` in `calculateDeductions` | `Arithmetic invariants > floor rounding on 333 credits`, `Arithmetic invariants > 1 credit floors both deductions to 0`, `Arithmetic invariants > calculateDeductions never returns negative netCredits` |
| Issuance with deductions disabled is still possible (voluntary regime) | `autoDeductAtIssuance=false` short-circuits `calculateDeductions` to `{netCredits: total, omgeAmount: 0, sopAmount: 0}` | `Arithmetic invariants > autoDeductAtIssuance=false short-circuits` |
| Deducted amounts observable via UI (operator view) | Phase 2 Credit Balance `Select` exposes `Cancelled (OMGE)` and `Cancelled (SOP)` filter options | `UI smoke > Credit Balance page exposes Cancelled (OMGE) and Cancelled (SOP) filter options`, `UI smoke > selecting Cancelled (OMGE) fires queryBalance with accountType=CancellationOMGE` |

## Gaps / deviations

- **No admin UI to configure percentages.** `ITMO_OMGE_PERCENTAGE`, `ITMO_SOP_PERCENTAGE`, and `ITMO_AUTO_DEDUCT_AT_ISSUANCE` are resolved from `process.env` at service startup via `parseFloat` / string-equality comparison. A DNA administrator cannot override the percentages at runtime; only a deployment/restart with new env values can change them.
- **No runtime introspection of the current deduction config.** `ProgrammeLedgerService.getDeductionConfig()` exists internally but is not HTTP-exposed. There is no `GET /national/admin/deductionConfig` (or similar) endpoint an operator could hit to confirm what percentages the live process is applying. This makes drift between documentation and deployment hard to detect without direct shell access to the backend.
- **`calculateDeductions()` is not HTTP-exposed.** A consumer can only observe the math indirectly by inspecting the `creditAmount` values of transactions into `CANCELLATION_OMGE` / `CANCELLATION_SOP` accounts after issuance. There is no dry-run/preview endpoint.
- **SOP destination (Adaptation Fund) is not modelled.** Decision 2/CMA.3 annex para 65 and Draft CMA.5 para 57 describe SOP as routed to the Adaptation Fund. In this registry, SOP credits land in a local `CANCELLATION_SOP` account — there is no downstream transfer to any Adaptation Fund account, no off-registry notification hook, and no linkage to a specific beneficiary entity. Credits in `CANCELLATION_SOP` are effectively permanently cancelled at the moment of issuance.
- **No `cancelForSOP` service wrapper.** `programme-ledger.service.ts` exposes `cancelForOMGE` as an action-typed helper but no analogous `cancelForSOP`. SOP deductions at issuance write the target block directly through `retireToAccount` or inline block creation, with `toAccountType = CancellationSOP`. This asymmetry is a leftover of Phase 2/3 sequencing and is flagged in `docs/article6/02-itmo-lifecycle.md` as well.
- **Runtime toggling of `autoDeductAtIssuance` is not supported.** The flag is read once at process start. Flipping it per-issuance (e.g. to opt specific CAs out of deductions while opting others in) is not possible. A proper feature would likely push the percentages onto the `CooperativeApproach` entity so each CA could declare its own SOP / OMGE contribution policy.
- **Floor rounding zeroes out small issuances.** For any issuance of 1-49 credits, `Math.floor(credits * 2 / 100) === 0` and for 1-19 credits `Math.floor(credits * 5 / 100) === 0`. Aggregated over many small issuances, this can materially erode the conservation benefit. A more conservative implementation might use `Math.ceil` (over-subtract) or track fractional contributions across issuances to preserve exact percentage contributions across the ledger. This is a judgment call — floor under-subtracts, ceil would over-subtract — and is worth flagging explicitly for an Article 6.2 registry auditing for environmental integrity.
- **No audit log of applied deductions.** When auto-deduct fires, the resulting block-creation and account-routing events are logged through the normal `CreditTransactionsEntity` path, but there is no separate "deduction event" row that records the input total, the percentages used, and the resulting OMGE / SOP amounts as a single atomic audit record. A reviewer has to reconstruct the triple by correlating the Holding block, the CANCELLATION_OMGE row, and the CANCELLATION_SOP row.
- **No protection against percentage change mid-lifecycle.** If `ITMO_OMGE_PERCENTAGE` changes between two issuances, blocks issued before and after the change will have different effective deduction rates. The `omgeDeductedAtIssuance` flag records that the deduction was applied but not *at what percentage*. Resolving a historical block's deduction is impossible without either a per-block `omgeAppliedPercentage` column or a time-windowed config table.
- **Integration tests for the full issuance path are deferred.** Same blocker as Phase 2: issuance in this registry is driven by the programme-lifecycle NDC action flow rather than a direct `POST /issueCredits` endpoint. Until an issuance fixture lands in `tests/e2e/article6/support/factories.ts`, the end-to-end test that "issuing N credits with `autoDeductAtIssuance=true` produces exactly `floor(N * 2 / 100)` in `CANCELLATION_OMGE` and `floor(N * 5 / 100)` in `CANCELLATION_SOP`" remains `test.fixme`.

## Test coverage

The Playwright spec is structured as one top-level describe (`OMGE/SOP Deductions - Article 6.2`) with five nested blocks:

- `Arithmetic invariants` - 8 tests, pure TypeScript. A local `calculateDeductions` mirror re-implements the service formula; tests cover: default 1000-credit case (net=930, OMGE=20, SOP=50), `autoDeductAtIssuance=false` short-circuit, floor rounding on 333 credits (OMGE=6, SOP=16, net=311), zero-credit edge case, 1-credit edge case (both deductions floor to 0), 1,000,000-credit case (scales linearly), custom percentages (omge=3 / sop=7 / 1000 -> 900 / 30 / 70), and the "never negative" guarantee at 100% cumulative deduction.
- `Configuration shape` - 1 executing test (default triple matches configuration.ts) and 1 `test.fixme` flagging the missing `GET /admin/deductionConfig` introspection endpoint.
- `Entity flags on issued blocks` - 1 executing test (response-shape check on `queryBalance` for `omgeDeductedAtIssuance` / `sopDeductedAtIssuance`) and 2 `test.fixme` entries documenting: (a) the flags-set-to-true assertion requires an issuance fixture, (b) the `autoDeductAtIssuance=false` end-to-end case requires a backend restart.
- `Account routing: CANCELLATION_OMGE / CANCELLATION_SOP` - 2 executing tests (a `queryBalance` filter round-trip for each of `CancellationOMGE` and `CancellationSOP`) and 2 `test.fixme` entries documenting the full-deduction-amount assertion and the no-double-deduction-on-transfer assertion.
- `UI smoke: deductions are visible via the Phase 2 balance filter` - 2 executing tests: the Credit Balance dropdown exposes both `Cancelled (OMGE)` and `Cancelled (SOP)` options, and selecting `Cancelled (OMGE)` fires a filtered `queryBalance` POST with `accountType="CancellationOMGE"`.

Total: 19 tests, of which 5 are `test.fixme` (deferred pending missing issuance / transfer fixtures or missing HTTP introspection endpoints) and 14 execute. Every mutating path uses `uniqueSuffix()` for parallel safety, though most Phase 3 tests are pure arithmetic or read-only queries.

## Running

```bash
npx playwright test tests/e2e/article6/omge-sop-deductions.spec.ts
```
