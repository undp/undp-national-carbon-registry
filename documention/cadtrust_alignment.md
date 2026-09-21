
## CAD Trust v1.8 Alignment — **Projects** (UNDP National Carbon Registry)

> **Superseded.** This document targets CAD Trust **v1.8** field names
> (`warehouseProjectId`, `currentRegistry`, `unitMetric`, ...) and **projects only**. The
> registry's actual CAD Trust integration is now v2 and covers project **and** credit
> lifecycle events, implemented in
> `backend/services/libs/shared/src/cadtrust-sync/` (mapping tables, mappers, handlers) and
> `backend/services/libs/cadtrust/` (the v2 HTTP client). For the current business-level
> scope and field mappings see `docs/business/cadtrust-v2-sync.md`; for the technical
> reference and what has been confirmed against a real node see
> `backend/services/libs/shared/src/cadtrust-sync/README.md` and
> `backend/services/libs/cadtrust/LIVE_VALIDATION.md` — not this file. Kept for historical
> context only.

> Scope: Align CAD Trust **Projects** fields to UNDP backend **ProjectEntity** fields.  
> Source file: \`backend/services/libs/shared/src/entities/projects.entity.ts\`  
> This document tracks current mappings, gaps, and normalization rules for future implementation.

### Legend
- ✅ Direct — identical meaning/ready to export
- ✅ Equivalent — same meaning, minor transform (e.g., epoch→ISO)
- ✅ Derive — computed from an existing field
- ⚠️ Partial — IDs need join/lookup or semantics only roughly match
- ❌ Missing — not present; plan to add or derive later

### Mapping table (Projects)

| CAD Trust Field | UNDP Equivalent | Match Type | Notes |
|---|---|---|---|
| **warehouseProjectId** | `refId` | ✅ Derive | Derive from `refId` (acts as CADT warehouse/global ID). |
| **currentRegistry** | *Not present* | ❌ Missing | Add/derive from tenant/registry config. |
| **projectId** | `refId` | ✅ Direct | Hosting registry’s visible ID for the project. |
| **registryOfOrigin** | *Not present* | ❌ Missing | Optional in CADT; origin/previous registry if migrated. |
| **originProjectId** | *Not present* | ❌ Missing | Optional; project ID in the origin registry. |
| **program** | *Not present* | ❌ Missing | Optional; categorize into a higher-level program if used. |
| **projectName** | `title` | ✅ Direct | Public name of the project. |
| **projectLink** | *Not present* | ❌ Missing | Add URL to public project page (frontend or docs). |
| **projectDeveloper** | `companyId` → names | ⚠️ Partial | Resolve numeric IDs to organization names via lookup/join. |
| **sector** | `sector` | ✅ Direct | Ensure values align with CADT sector picklist. |
| **projectType** | `sectoralScope` | ⚠️ Partial | Overlapping semantics; confirm taxonomy alignment. |
| **projectTags** | *Not present* | ❌ Missing | Optional; free-text tags for searchability. |
| **coveredByNDC** | *Not present* | ❌ Missing | Could be derived from Article 6/authorization logic later. |
| **ndcInformation** | *Not present* | ❌ Missing | Optional explanatory text. |
| **projectStatus** | `ProjectProposalStage` (enum) | ⚠️ Partial | Proposal stage ≠ full lifecycle; consider separate status later. |
| **projectStatusDate** | `projectAuthorizationTime` | ⚠️ Approximate | Closest timestamp to status change; confirm semantics. |
| **createdAt** | `createTime` | ✅ Equivalent | Convert epoch→ISO 8601 (UTC) for export. |
| **updatedAt** | `updateTime` | ✅ Equivalent | Convert epoch→ISO 8601 (UTC) for export. |
| **unitMetric** | *Not present* | ❌ Missing | Add (e.g., `tCO2e`, `kWh`, `MWh`) if required. |
| **methodology** | *Not present* | ❌ Missing | Add/derive from related tables if captured elsewhere. |
| **validationBody** | `independentCertifiers` → names | ⚠️ Partial | Resolve IDs to VVB names. |
| **validationDate** | *Not present* | ❌ Missing | Add date when validation granted. |
| **description** | *Not present* | ❌ Missing | Add public description text. |

### Normalization rules
- **Timestamps:** internal epoch (`bigint`) → **export ISO 8601 (UTC)**.
- **Lookups:** `companyId`, `independentCertifiers` must resolve to **names** for CADT payloads.
- **Taxonomies:** align `sector`, `projectType`, `unitMetric`, `methodology` to CADT picklists via mapping tables.

### Follow-ups (tracked)

Status against the v2 integration (`libs/shared/src/cadtrust-sync/`), not this v1.8 list — see the
note at the top of this file. `[x]` means the v2 mapper/handler already covers it; `[ ]` remains
open there too.

- [x] `projectLink` — `CadTrustProjectMapper.projectLink()`, built from `configuration.ts`'s `host`.
- [x] `unitMetric` — `PROJECT_UNIT_METRIC` (`"tCO2e"`) in `mappers/picklist.map.ts`.
- [x] `methodology` — `ensureProjectMethodology()` links every project to the bootstrapped methodology.
- [x] `description` — `CadTrustProjectMapper.toCreateInput()`, from the INF's `projectDescription`.
- [x] `validationDate` — `CadTrustValidationMapper.toCreateInput()`, from `CadTrustValidationSyncProps`.
- [x] Company IDs → names — `CadTrustStakeholderMapper.toCreateInput()` reads `Company.name` directly.
- [ ] `currentRegistry`, `registryOfOrigin`, `originProjectId`, `projectTags` — still not synced.
- [ ] `coveredByNDC`, `ndcInformation` — still not synced.
- [ ] Certifier IDs → VVB names — deliberately **not** implemented in v2:
  `CadTrustValidationMapper` always sends the configured `CADT_V2_VALIDATION_BODY` default, never
  the real Independent Certifier's name, because CAD Trust's `validation_body` picklist is a closed
  international VVB list a national IC will not be on. See the mapper's class doc.
- [ ] `estimation` (CAD Trust `/estimation` vs `ProjectEntity.creditEst`) and the *project-level*
  Article 6.2 authorisation fields (`authorizationId`, `letterOfAuthorizationUrl`,
  `authorizationPurpose`, `acquiringPartyCountryCode`, `cooperativeApproachId`) — unmapped project
  child data, tracked as an accepted gap in `cadtrust-sync/README.md`'s "What is implemented" table.

### Credits (not in scope of this v1.8 projects-only document)

The v2 integration also syncs the credit lifecycle — not covered by the table above, which is
projects-only. Already implemented in `libs/shared/src/cadtrust-sync/`:

- [x] `verification` — `CadTrustVerificationMapper`, on DNA-approved verification reports; body is
  the configured `CADT_V2_VERIFICATION_BODY` default, never the real verifying body (same closed
  VVB-list reason as `validationBody`).
- [x] `issuance` — one per project monitoring cycle, keyed to the verification record; carries links
  only, no volumes.
- [x] `unit` — one per registry credit block (`CadTrustCreditUnitMapper`): serial id + block range,
  vintage, count, `tCO2e` metric, `unitStatus` (`Held`/`Retired`), `unitStatusReason` derived from
  the retirement `subType`, current owner / retirement beneficiary + externally-resolvable
  beneficiary id. `unitType` is `CADT_V2_UNIT_TYPE` — no safe default, published empty until set.
  Create-once then full-replace update; the registry never uses CAD Trust's `/unit/split`.
- [x] `unit-label` — links an ITMO-authorised unit to the one bootstrapped "Article 6 -
  Authorisation" label.

See `docs/business/cadtrust-v2-sync.md` §4–5 for the business-level event and field breakdown, and
`cadtrust-sync/README.md`'s "What is implemented" table for the technical status.
