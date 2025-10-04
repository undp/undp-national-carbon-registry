
## CAD Trust v1.8 Alignment — **Projects** (UNDP National Carbon Registry)

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
- [ ] Add/derive: `currentRegistry`, `registryOfOrigin`, `originProjectId`, `projectLink`, `projectTags`.
- [ ] Add: `coveredByNDC`, `ndcInformation`, `unitMetric`, `methodology`, `validationDate`, `description`.
- [ ] Confirm whether `ProjectProposalStage` is sufficient for CADT `projectStatus`; add dedicated status if needed.
- [ ] Implement lookup services (company IDs → names, certifier IDs → VVB names).
"@ | Out-File -FilePath "documention\cadtrust_alignment.md" -Encoding UTF8

git add documention\cadtrust_alignment.md
git commit -m "docs: update CAD Trust v1.8 alignment (Projects) — warehouseProjectId/projectId mapped to refId"
