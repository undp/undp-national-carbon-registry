# 02 - ITMO Lifecycle & Account Structure (Article 6.2, Phase 2)

> **Phase commit**: `9d3ee0edd` - **Primary entities**: `ItmoAccount`, extended `CreditBlocksEntity`, extended `CreditTransactionsEntity` - **Test spec**: [`itmo-lifecycle.spec.ts`](../../tests/e2e/article6/itmo-lifecycle.spec.ts)

## UNFCCC requirement

Decision 2/CMA.3 (Glasgow, 2021) together with Draft Decision -/CMA.5 (SBSTA 59, Dubai 2023) and Decision 6/CMA.4 Annex I (Sharm el-Sheikh, 2022) define the lifecycle of an internationally transferred mitigation outcome (ITMO) and the account structure of a national registry under Article 6.2.

Key obligations relevant to Phase 2 of the registry:

- **Account types in the national registry** (Dec 2/CMA.3 annex ch. VI para 29, Draft CMA.5 para 87). Each Party's registry must be able to segregate ITMOs into accounts that reflect their lifecycle state: a *holding* account for authorized but not-yet-used ITMOs, a *retirement* account for ITMOs used towards an NDC (by the acquiring Party) or for other international mitigation purposes (OIMP, e.g. CORSIA), and a *cancellation* account for voluntary cancellation as well as for the mandatory OMGE (overall mitigation in global emissions) and SOP (share-of-proceeds for adaptation) contributions.
- **ITMO serial number structure** (Dec 6/CMA.4 annex I para 5). Each ITMO must carry a five-component unique serial number: (a) the Party of origin, (b) the ITMO type, (c) the vintage year, (d) a project/activity identifier, and (e) a sequence/credit identifier. Serial numbers must remain immutable across the ITMO's lifecycle (Draft CMA.5 para 132) so transitions (first transfer, retirement, cancellation) are traceable back to issuance.
- **Action types catalogue** (Draft CMA.5 para 80). The transaction log must distinguish at minimum: issuance, authorization, first transfer, subsequent transfers (acquisition), retirement for NDC use, retirement for OIMP, voluntary cancellation, and cancellation for OMGE. SOP contributions are handled via an account transfer rather than as a separate action type, but must still be traceable.
- **Authorization purpose** (Dec 2/CMA.3 annex para 1(d)-(f)). Every ITMO carries an authorization purpose that is one of: use towards an NDC (`NDC`), use for OIMP, or *other purposes* (OP). The purpose is set at authorization time and cannot be overwritten in the registry without a corresponding revocation/reauthorization record.
- **First-transfer identification** (Draft CMA.5 para 27(t), para 73). Each cooperative approach must define what constitutes a "first transfer". The registry must tag the first outgoing movement of an ITMO from the first-transferring Party and apply the corresponding-adjustment consequences to that event; later transfers between other accounts do not re-trigger corresponding adjustments.

## Registry implementation

### New entity: `ItmoAccount`

`backend/services/libs/shared/src/entities/itmo.account.entity.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `accountId` | `uuid` (PK) | Auto-generated. |
| `companyId` | `bigint` | FK to `Company`. One company may own several accounts (one per AccountType). |
| `accountType` | `enum AccountType` | Required. See AccountType enum below. |
| `balance` | `decimal(15,5)` | Default `0`. Running balance for this account. |
| `description` | `text` (nullable) | Free-text operator label. |
| `createdTime`, `updatedTime` | `bigint` | Epoch ms, set via `@BeforeInsert`. |

### Enums

| Enum | Values | Source |
| --- | --- | --- |
| `AccountType` | `HOLDING = "Holding"`, `RETIREMENT_NDC = "RetirementNDC"`, `RETIREMENT_OIMP = "RetirementOIMP"`, `CANCELLATION_VOLUNTARY = "CancellationVoluntary"`, `CANCELLATION_OMGE = "CancellationOMGE"`, `CANCELLATION_SOP = "CancellationSOP"` | `enum/account.type.enum.ts` |
| `CreditTransactionTypesEnum` (expanded, 10 values) | `ISSUED`, `AUTHORIZED`, `FIRST_TRANSFER`, `TRANSFERED`, `ACQUIRED`, `RETIRED`, `USE_TOWARDS_NDC`, `USE_FOR_OIMP`, `VOLUNTARY_CANCELLATION`, `OMGE_CANCELLATION` | `enum/credit.transaction.types.enum.ts` |
| `CreditRetirementTypeEnum` (expanded, 6 values) | `CROSS_BORDER_TRANSACTIONS`, `VOLUNTARY_CANCELLATIONS`, `USE_TOWARDS_NDC`, `USE_FOR_OIMP`, `OMGE_CANCELLATION`, `SOP_ADAPTATION` | `enum/credit.retirement.type.enum.ts` |
| `AuthorizationPurpose` (defined Phase 1, consumed Phase 2) | `NDC = "UseTowardsNDC"`, `OIMP = "OtherInternationalMitigationPurposes"`, `OTHER = "OtherPurposes"` | `enum/authorization.purpose.enum.ts` |

### Extended `CreditBlocksEntity`

`backend/services/libs/shared/src/entities/credit.blocks.entity.ts`

New Phase 2 columns:

| Field | Type | Notes |
| --- | --- | --- |
| `cooperativeApproachId` | `string` (nullable) | Links the block to the Phase 1 `CooperativeApproach` that authorized it. |
| `authorizationPurpose` | `enum AuthorizationPurpose` (nullable) | Set at authorization time; propagates to derived blocks on retirement/split. |
| `accountType` | `enum AccountType` | Default `HOLDING`. Derived blocks written by `retireToAccount()` carry the target account. |
| `omgeDeductedAtIssuance` | `boolean` | Default `false`. Owned by Phase 3 (documented there). |
| `sopDeductedAtIssuance` | `boolean` | Default `false`. Owned by Phase 3 (documented there). |

### Extended `CreditTransactionsEntity`

`backend/services/libs/shared/src/entities/credit.transactions.entity.ts`

New Phase 2 columns:

| Field | Type | Notes |
| --- | --- | --- |
| `fromAccountType` | `enum AccountType` (nullable) | Source account for a movement. |
| `toAccountType` | `enum AccountType` (nullable) | Destination account for a movement. |
| `cooperativeApproachId` | `string` (nullable) | Mirrored from the source block for traceability. |
| `authorizationPurpose` | `enum AuthorizationPurpose` (nullable) | Mirrored from the source block. |
| `isFirstTransfer` | `boolean` | Default `false`. Flag set when this transaction is the first outgoing movement from the first-transferring Party. |

### Service-layer additions (programme-ledger)

`backend/services/libs/shared/src/programme-ledger/programme-ledger.service.ts`

| Method | Purpose |
| --- | --- |
| `retireToAccount(blockId, targetAccountType, amount, projectRefId, user, retirementType, remarks)` | Core helper. Splits the source block at `amount`, writes a derived block with `accountType = targetAccountType` plus inherited `cooperativeApproachId` + `authorizationPurpose`, and inserts a `CreditTransactionsEntity` whose `type` is derived from `targetAccountType` (`RETIREMENT_NDC -> USE_TOWARDS_NDC`, `RETIREMENT_OIMP -> USE_FOR_OIMP`, `CANCELLATION_VOLUNTARY -> VOLUNTARY_CANCELLATION`, `CANCELLATION_OMGE -> OMGE_CANCELLATION`, else `RETIRED`). |
| `cancelForOMGE(blockId, amount, projectRefId, user)` | Convenience wrapper that calls `retireToAccount` with `AccountType.CANCELLATION_OMGE` and `CreditRetirementTypeEnum.OMGE_CANCELLATION`. |

### API endpoints

All paths are relative to `http://localhost:3000/national/`. No new controllers were added in Phase 2; the Phase 2 fields appear as additional columns on responses from existing endpoints.

| Method | Path | Role gate | Phase 2 relevance |
| --- | --- | --- | --- |
| `POST` | `creditTransactionsManagement/queryBalance` | Any authenticated user with read on `ProjectEntity` | Response rows now include `accountType`, `cooperativeApproachId`, `authorizationPurpose`; `filterAnd` accepts `{ key: "accountType", operation: "=", value: <AccountType> }`. |
| `POST` | `creditTransactionsManagement/queryRetirements` | Read on `ProjectEntity` | Response rows include `fromAccountType`, `toAccountType`, `cooperativeApproachId`, `authorizationPurpose`, `retirementType`. |
| `POST` | `creditTransactionsManagement/queryTransfers` | Read on `ProjectEntity` | Response rows include `isFirstTransfer`, `fromAccountType`, `toAccountType`. |
| `POST` | `creditTransactionsManagement/retireRequest` | Update on `ProjectEntity` (PD) | Body `{ blockId, amount, retirementType, remarks?, country?, organizationName? }`. Validates `retirementType` against the expanded `CreditRetirementTypeEnum`. Backend currently only branches on `CROSS_BORDER_TRANSACTIONS` vs `VOLUNTARY_CANCELLATIONS`; the four new Article 6.2 retirement types are accepted by the enum but not yet routed through `retireToAccount`. |
| `POST` | `creditTransactionsManagement/performRetireAction` | Update on `ProjectEntity`, role-checked inside the service to DNA Admin/Root for `ACCEPT`/`REJECT` and PD Admin for `CANCEL` | Finalizes a pending retirement; still gated at the service layer. |

No HTTP endpoint exists for `ItmoAccount` CRUD or query. No endpoint directly invokes `retireToAccount` with an `AccountType` target; only `cancelForOMGE` is wired (service-internal, called by Phase 3 issuance flow).

### UI changes

| Route | Component | Phase 2 change |
| --- | --- | --- |
| `/credits/balance` | `web/src/Pages/CreditPages/creditBalancePage.tsx` | Added an antd `Select` above the table with 7 options: `All Accounts`, `Holding`, `Retired (NDC)`, `Retired (OIMP)`, `Cancelled (Voluntary)`, `Cancelled (OMGE)`, `Cancelled (SOP)`. Value maps to the AccountType enum string; `all` disables the filter. Change fires a new `POST /queryBalance` with `filterAnd: [{ key: "accountType", ... }]`. |
| `/credits/balance` (table) | `Components/creditBalanceTable.tsx` | `accountTypeFilter` is added to the query's `filterAnd` (lines 120-126). No new column is rendered for account type — the filter narrows the dataset but the table still shows organization / project / serial / date / credits. |
| `Components/creditActionModal.tsx` | Retirement form | `RetirementType` radios remain `CROSS_BORDER` + `VOLUNTARY_CANCELLATION` only. The four new Article 6.2 retirement types (Use Towards NDC, Use For OIMP, OMGE Cancellation, SOP Adaptation) are not yet surfaced. |

## Requirement -> implementation mapping

| UNFCCC requirement | Implementation | Verified by |
| --- | --- | --- |
| Account types in the national registry (Dec 2/CMA.3 para 29, Draft CMA.5 para 87) | `AccountType` enum with 6 values; `ItmoAccount` entity; `accountType` column on `CreditBlocksEntity`; derived-block writes in `retireToAccount` | `Enum shape > AccountType has exactly 6 values and UI dropdown mirrors them`, `UI: Credit Balance account-type filter > opening the Account Type dropdown exposes all 6 AccountType labels + All Accounts` |
| Retirement vs cancellation segregation (Dec 2/CMA.3 para 29) | `RETIREMENT_NDC`, `RETIREMENT_OIMP` vs `CANCELLATION_VOLUNTARY`, `CANCELLATION_OMGE`, `CANCELLATION_SOP` | Same as above (label set includes both Retired/Cancelled prefixes) |
| Action types catalogue (Draft CMA.5 para 80) | 10-value `CreditTransactionTypesEnum`; retirement-specific types in `CreditRetirementTypeEnum`; dispatch switch in `retireToAccount` | `API: query response shape > POST /queryRetirements tolerates the new Phase 2 transaction fields` (asserts `type` is in the expanded enum set) |
| First-transfer identification (Draft CMA.5 para 27(t), para 73) | `isFirstTransfer: boolean` on `CreditTransactionsEntity`; `FIRST_TRANSFER` transaction type | *(not verified — see Gaps; no fixture seeds two consecutive transfers)* |
| Authorization purpose preserved across lifecycle (Dec 2/CMA.3 annex para 1(d)-(f)) | `authorizationPurpose` column on both `CreditBlocksEntity` and `CreditTransactionsEntity`; propagated in `retireToAccount` (programme-ledger.service.ts lines 2781-2782) | `API: query response shape > POST /queryRetirements ...` asserts response values are one of the three `AuthorizationPurpose` strings |
| Cooperative approach linkage preserved across lifecycle (Draft CMA.5 para 132, immutability of ITMO metadata) | `cooperativeApproachId` on block + transaction; mirrored into derived blocks on retirement | `API: query response shape > POST /queryRetirements ...` (shape only — actual propagation is covered when an issuance fixture is available) |
| ITMO serial number as 5-component immutable identifier (Dec 6/CMA.4 Annex I para 5, Draft CMA.5 para 132) | `serialNumber: text` column on both entities; `SerialNumberManagementService` generates and parses it | *(not verified — see Gaps; serial format is opaque text, component structure is not asserted)* |
| OMGE cancellation as a first-class action type (Draft CMA.5 para 80) | `OMGE_CANCELLATION` entries in both `CreditTransactionTypesEnum` and `CreditRetirementTypeEnum`; `cancelForOMGE` service method | *(covered in Phase 3 doc; Phase 2 only provides the enum + account type)* |
| SOP contribution traceability (Dec 2/CMA.3 annex para 65) | `CANCELLATION_SOP` account type; `SOP_ADAPTATION` retirement type | *(not verified — see Gaps; no service wrapper analogous to `cancelForOMGE` exists for SOP)* |
| Retirement dispatch is authorized (Draft CMA.5 para 80 — authorizing Party gate) | `performRetireAction` service-level role check: DNA Admin/Root for ACCEPT/REJECT, PD Admin for CANCEL | `Permissions: retirement dispatch is DNA-gated > PD POST /performRetireAction with ACCEPT is rejected` |

## Gaps / deviations

- **`credit_block_balances_view_entity` view is missing the `accountType` column**. Phase 2 added `accountType` to `CreditBlocksEntity` but did not regenerate the TypeORM view that backs `POST /creditTransactionsManagement/queryBalance`. Any `queryBalance` request containing an `accountType` entry in `filterAnd` crashes with Postgres error `column "accountType" does not exist` (HTTP 500). The filter is advertised in the UI (Credit Balance page exposes 6 account-type options) but clicking any option other than "All Accounts" hits the 500. This is a **view migration** gap, not a code gap. Fix: recreate the view to `SELECT ... COALESCE(cb."accountType", 'Holding') AS "accountType" ...` or drop the view + `synchronize: true`.
- **Retirement / transfer views use `createdDate`, not `createdTime`**. `credit_block_retirements_view_entity` and `credit_block_transfers_view_entity` expose `createdDate`; the service accepts `sort.key` verbatim. Callers that pass `sort.key: "createdTime"` (a natural guess from the entity column name) crash with `column "createdTime" does not exist`. The views and the entities disagree; callers must use `createdDate`.
- **No HTTP surface for `ItmoAccount`**. The entity is declared and registered with TypeORM but no controller exposes CRUD or query. Practical effect: a company's per-account balances are derivable from aggregating `CreditBlocksEntity` rows by `accountType`, but the `ItmoAccount` table itself is never read or written by request handlers. Adding a `GET /national/itmoAccount/query` endpoint is a prerequisite for fully verifying Dec 2/CMA.3 para 29 at the API layer.
- **`retireToAccount` is not HTTP-exposed**. The service method that actually moves credits into `RETIREMENT_NDC`, `RETIREMENT_OIMP`, `CANCELLATION_VOLUNTARY`, or `CANCELLATION_OMGE` accounts is only reachable via `cancelForOMGE` (internal) and indirectly via the retirement request flow. The existing `retireRequest` + `performRetireAction` pipeline still branches on `CreditRetirementTypeEnum` and does not hand off to `retireToAccount` for the four new Article 6.2 retirement types. As a result, a PD submitting `retirementType: "Use Towards NDC"` today will pass DTO validation but the backend path does not yet write the derived block with `accountType = RETIREMENT_NDC`. This is the single biggest Phase 2 gap to close.
- **UI retirement modal does not expose the new retirement types**. `web/src/Pages/CreditPages/Components/creditActionModal.tsx` renders only two radios: `CROSS_BORDER` and `VOLUNTARY_CANCELLATION`. The four Article 6.2 retirement types (Use Towards NDC, Use For OIMP, OMGE Cancellation, SOP Adaptation) exist in the enum and would be accepted by the backend DTO but are unreachable from the UI.
- **No `cancelForSOP` service wrapper**. `programme-ledger.service.ts` exposes `cancelForOMGE` but no analogous helper for `CANCELLATION_SOP`. SOP deductions in Phase 3 write the target block directly; there is no action-type wrapper comparable to the OMGE one.
- **No explicit 5-component ITMO serial number structure** (Dec 6/CMA.4 Annex I para 5). The `serialNumber` column is an opaque `text`. `SerialNumberManagementService` constructs and parses it, but the component structure (Party of origin / type / vintage / activity / sequence) is not first-class on either entity and there is no schema-level assertion that it is preserved across lifecycle transitions.
- **`FIRST_TRANSFER` is not yet emitted by any code path**. The enum value and the `isFirstTransfer: boolean` column exist on `CreditTransactionsEntity`, but no service logic currently toggles the flag. First-transfer identification is today implicit in the block's `previousOwnerCompanyId` / `isNotTransferred` columns rather than explicit on the transaction.
- **`AUTHORIZED` transaction type not emitted**. Similarly, `CreditTransactionTypesEnum.AUTHORIZED` is defined but not written by any existing service method. Authorization is inferred from the presence of `cooperativeApproachId` + `authorizationPurpose` on a block rather than from a dedicated action-log row.
- **`accountType` column is absent from the balance table UI**. The Credit Balance page lets a user *filter* by account type but does not render the account type on each row. An operator cannot visually distinguish a `Holding` block from a `RetirementNDC` block without applying the filter.
- **Retirement block split atomicity**. `retireToAccount` splits the source block into two blocks — a shrunken source block and a new derived block at the target account. This matches the guidance that ITMO serial numbers are immutable (the original block is shrunk rather than mutated in-place). However, there is no guard preventing a concurrent retirement from double-spending the same credits; the ledger relies on the TypeORM transaction boundary of the calling method.
- **`CANCELLATION_SOP` AccountType is present but not reachable via any action path**. It appears in the enum and in the balance filter UI, but nothing (Phase 2) writes a block with that account type. Phase 3 SOP-at-issuance populates it as a side effect of issuance; there is no post-issuance way to move credits into it.

## Test coverage

The Playwright spec is structured as one top-level describe (`ITMO Lifecycle - Article 6.2`) with five nested blocks:

- `UI: Credit Balance account-type filter` - 3 tests: page renders the Select, dropdown exposes all 6 AccountType labels (plus the "All Accounts" meta-option), and selecting `Retired (NDC)` fires a filtered `POST /queryBalance` with the expected `filterAnd` shape.
- `UI: Credit retirement modal options` - 1 `test.fixme` explaining why the retirement-modal radio-option verification requires a seeded credit block and flagging that the four new Article 6.2 retirement types are missing from the UI.
- `API: query response shape` - 3 tests: `queryBalance` with an `accountType` filter, `queryRetirements` and `queryTransfers` both asserting that the new Phase 2 columns (`fromAccountType`, `toAccountType`, `cooperativeApproachId`, `authorizationPurpose`, `isFirstTransfer`) round-trip with expected types when populated.
- `API: issuance & first-transfer bindings (deferred)` - 3 `test.fixme` entries documenting: (a) issuance-to-CA binding requires an issuance fixture, (b) the two-transfer `isFirstTransfer` sequence requires a multi-step programme transfer fixture, (c) `ItmoAccount` queryability requires a new endpoint.
- `Enum shape` - 2 tests: a cross-check that `AccountType` has exactly 6 values and the UI dropdown shows all of them, and a static assertion that the 4 new Article 6.2 retirement types are present in `CreditRetirementTypeEnum`.
- `Permissions: retirement dispatch is DNA-gated` - 1 test: PD `POST /performRetireAction` with an `ACCEPT` action is rejected (4xx).

Total: 13 tests, of which 4 are `test.fixme` (deferred pending missing fixtures or HTTP endpoints) and 9 execute.

## Running

```bash
npx playwright test tests/e2e/article6/itmo-lifecycle.spec.ts
```
