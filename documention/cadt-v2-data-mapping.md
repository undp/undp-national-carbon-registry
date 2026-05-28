# CAD Trust v2.0 Data Mapping — Source of Truth

> **Scope**: Map all UNDP National Carbon Registry entities to CAD Trust Data Model v2.0 tables.
> **Version**: 1.0
> **Last Updated**: 2026-02-26

## Dependency Chain

The CADT v2 API enforces foreign key relationships via required fields. Entities must be created in this order:

```
methodology ─┐
             ├─► project_methodology ─► verification ─► issuance ─► unit
project ─────┤
             ├─► location
             ├─► stakeholder ─► stakeholder_project
             └─► validation ──► (verification links back)
```

## 1. Project

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| projectRegistryName | String | **Y** | Config `systemCountryName` | `"${systemCountryName} Standard Carbon Registry"` | — |
| projectId | String | **Y** | `ProjectEntity.refId` | Direct | — |
| projectName | String | **Y** | `ProjectEntity.title` | Direct | — |
| projectCreditingProgram | String | N | — | — | `null` |
| projectLink | String | N | Config `host` + `ProjectEntity.refId` | `"${host}/projectManagement/view/${refId}"` | `null` |
| projectDescription | String | N | — | — | `null` |
| projectSector | Array[String] | N | `Programme.sector` | See Picklist: Sector | `["Not elsewhere classified"]` |
| projectType | Array[String] | N | `Programme.mitigationActions[0].typeOfMitigation` | See Picklist: ProjectType | `null` |
| projectSubtype | String | N | `Programme.mitigationActions[0].subTypeOfMitigation` | Direct if present | `null` |
| projectStatus | String | N | `Programme.currentStage` / `ProjectEntity.projectProposalStage` | See Picklist: ProjectStatus | `"Listed"` |
| projectStatusDate | Date | N | `Programme.statusUpdateTime` | Epoch ms → ISO 8601 date | `null` |
| projectUnitMetric | String | N | — | Always `"tCO2e"` | `"tCO2e"` |
| cadTrustReferenceProjectId | String | N | `ProjectEntity.serialNumber` | Direct if present | `null` |
| cadTrustProgramId | String | N | — | — | `null` |

### Timestamp conversion rule

All UNDP timestamps are epoch milliseconds (`bigint`). Convert to ISO 8601 date string: `new Date(epoch).toISOString().split('T')[0]` → `"YYYY-MM-DD"`.

## 2. Location

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| cadTrustProjectId | UUID | **Y** | CadtV2EntityMap lookup | Resolve from project sync | — |
| locationCountry | String | N | `Programme.countryCodeA2` | Resolve via `Country` entity: `country.name` | `null` |
| locationRegion | String | N | `Programme.programmeProperties.geographicalLocation` | `geographicalLocation.join(', ')` | `null` |
| locationGis | String | N | `Programme.geographicalLocationCordintes` | Serialize to GeoJSON string (see below) | `null` |
| locationMapType | String | N | — | `"geojson"` when locationGis is present | `null` |
| locationMapFileLink | String | N | — | — | `null` |

### GeoJSON serialization

If `geographicalLocationCordintes` is an array of `{lat, lng}` objects:
- Single point: `JSON.stringify({ type: "Point", coordinates: [lng, lat] })`
- Multiple points: `JSON.stringify({ type: "MultiPoint", coordinates: [[lng1,lat1],[lng2,lat2],...] })`

If already a GeoJSON object, serialize directly.

## 3. Methodology

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| methodologyCode | String | **Y** | `Programme.mitigationActions[0].properties.methodology` or `Programme.mitigationActions[0].methodology` | Use as code directly | `"PENDING"` |
| methodologyName | String | **Y** | Same as above | Same string used as name | `"Pending"` |
| methodologyVersion | String | N | — | — | `null` |
| methodologyDate | Date | N | — | — | `null` |
| methodologyLink | String | N | — | — | `null` |
| methodologyType | String | N | `Programme.sector` | See Picklist: MethodologyType | `"Reduction - technical"` |

### Methodology extraction logic

```
1. Check programme.mitigationActions[0].properties.methodology → use if truthy
2. Else check programme.mitigationActions[0].methodology → use if truthy
3. Else use fallback "PENDING" / "Pending"
```

## 4. Project Methodology (Junction)

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| cadTrustProjectId | UUID | **Y** | CadtV2EntityMap lookup | From project sync | — |
| cadTrustMethodologyId | UUID | **Y** | CadtV2EntityMap lookup | From methodology sync | — |
| projectMethodologyDate | Date | N | `Programme.createdTime` | Epoch ms → ISO date | `null` |
| projectMethodologyDescription | String | N | — | — | `null` |

Always created — required for the issuance FK chain.

## 5. Stakeholder

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| stakeholderName | String | **Y** | `Company.name` | Direct | — |
| stakeholderType | String | N | Role derivation | See Stakeholder Role Rules | `"Developer"` |
| stakeholderLink | String | N | `Company.website` | Direct if present | `null` |

### Stakeholder role rules

| Source | CADT stakeholderType |
|---|---|
| Company in `Programme.companyId[]` (single company) | `"Owner"` |
| Company in `Programme.companyId[]` (multi-company) | `"Developer"` |
| Company in `Programme.certifierId[]` or `ProjectEntity.independentCertifiers[]` | `"Consultant"` |

## 6. Stakeholder Project (Junction)

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| cadTrustStakeholderId | UUID | **Y** | CadtV2EntityMap lookup | From stakeholder sync | — |
| cadTrustProjectId | UUID | **Y** | CadtV2EntityMap lookup | From project sync | — |

One record per stakeholder-project pair.

## 7. Validation (Stub)

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| validationId | String | **Y** | `ProjectEntity.refId` | `"VAL-${refId}"` | — |
| cadTrustProjectId | UUID | **Y** | CadtV2EntityMap lookup | From project sync | — |
| validationType | String | N | — | `"Validation of Project Design Document"` | — |
| validationBody | String | N | `ProjectEntity.independentCertifiers[0]` | Resolve company ID → `Company.name` | `null` |
| validationDate | Date | N | `ProjectEntity.projectAuthorizationTime` | Epoch ms → ISO date (best approximation) | `null` |
| validationCreditPeriodStartDate | Date | N | `Programme.startTime` | Epoch ms → ISO date | `null` |
| validationCreditPeriodEndDate | Date | N | `Programme.endTime` | Epoch ms → ISO date | `null` |

### Generation rules

- Always generated for projects that have reached `ProjectProposalStage.VALIDATION_REPORT_SUBMITTED` or later
- For projects with `Programme.currentStage >= APPROVED`, generate stub even without specific validation stage data
- One validation per project

## 8. Verification (Stub)

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| verificationId | String | **Y** | `ActivityEntity.refId` or `ProjectEntity.refId` | `"VER-${activityRefId}"` or `"VER-${projectRefId}"` | — |
| cadTrustProjectId | UUID | **Y** | CadtV2EntityMap lookup | From project sync | — |
| verificationStartDate | Date | N | `ActivityEntity.createdTime` | Epoch ms → ISO date | `null` |
| verificationEndDate | Date | N | `ActivityEntity.updatedTime` (when state is VERIFIED) | Epoch ms → ISO date | `null` |
| verificationBody | String | N | Same as validation body | Certifier company name | `null` |
| cadTrustValidationId | UUID | N | CadtV2EntityMap lookup | From validation sync | `null` |

### Generation rules

- One verification per activity with `ActivityStateEnum.VERIFICATION_REPORT_VERIFIED`
- If no activities with verified state exist but credits have been issued, generate a stub verification using project-level data
- Required to exist before any issuance can be created

## 9. Issuance

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| issuanceId | String | **Y** | `CreditBlocksEntity.creditBlockId` | `"ISS-${creditBlockId}"` | — |
| cadTrustVerificationId | UUID | **Y** | CadtV2EntityMap lookup | From verification sync | — |
| cadTrustProjectMethodologyId | UUID | **Y** | CadtV2EntityMap lookup | From project_methodology sync | — |
| issuanceDate | Date | N | `CreditBlocksEntity.txTime` (when txType=ISSUE) | Epoch ms → ISO date | `null` |
| cadTrustLocationId | UUID | N | CadtV2EntityMap lookup | From location sync | `null` |

### Generation rules

- One issuance per credit block with `txType === TxType.ISSUE`
- Groups credit blocks from the same issuance event (same txRef) into one issuance where possible
- The issuanceId uses the first credit block ID from the group

## 10. Unit

| CADT v2 Field | Type | Req? | UNDP Source | Derivation Logic | Fallback |
|---|---|---|---|---|---|
| unitSerialId | String | **Y** | `CreditBlocksEntity.serialNumber` | Direct | — |
| unitStartBlock | String | **Y** | `CreditBlocksEntity.serialNumber` | Extract block start from serial number (segment 6, 0-indexed) | — |
| unitEndBlock | String | **Y** | `CreditBlocksEntity.serialNumber` | Extract block end from serial number (segment 7, 0-indexed, derived as start + creditAmount - 1) | — |
| unitVintageYear | Number | **Y** | `CreditBlocksEntity.vintage` or serial number | Extract year from serial number segment 4 | — |
| cadTrustIssuanceId | UUID | **Y** | CadtV2EntityMap lookup | From issuance sync | — |
| unitCount | Number | N | `CreditBlocksEntity.creditAmount` | Direct | `null` |
| unitType | String | N | `Programme.sector` | See Picklist: UnitType | `"Reduction - technical"` |
| unitStatus | String | N | `CreditBlocksEntity.txType` | See Picklist: UnitStatus | `"Held"` |
| unitStatusReason | String | N | — | — | `null` |
| unitStatusDate | Date | N | `CreditBlocksEntity.txTime` | Epoch ms → ISO date | `null` |
| unitRetirementDetail | String | N | `CreditBlocksEntity.txData` (when retired) | `txData.remarks` if present | `null` |
| unitRetirementBeneficiary | String | N | Retirement transaction | `CreditTransactionsEntity.organizationName` | `null` |
| unitRetirementBeneficiaryId | String | N | — | — | `null` |
| unitLink | String | N | Config `host` | `"${host}/creditTransfers/viewAll"` | `null` |
| unitMetric | String | N | — | `"tCO2e"` | `"tCO2e"` |
| unitCurrentOwner | String | N | `CreditBlocksEntity.ownerCompanyId` | Resolve → `Company.name` | `null` |
| unitItmosReferenceId | String | N | `CreditBlocksEntity.serialNumber` | Direct (full serial is the ITMO ref) | `null` |

### Serial number parsing

Format: `{creditIdentifier}-{originParty}-{firstTransferParty}-{projectId}-{vintage}-{separator}-{blockStart}-{blockEnd}`

Segments (split by `-`):
- Index 4: vintage year
- Index 6: block start
- Index 7: block end (if present, else derive from blockStart + creditAmount - 1)

---

## Picklist Mappings

### Sector → CADT projectSector

| UNDP `Sector` | CADT v2 `projectSector` |
|---|---|
| `Energy` | `"Energy"` |
| `Forestry` | `"Agriculture, forestry and other land use (AFOLU)"` |
| `Agriculture` | `"Agriculture, forestry and other land use (AFOLU)"` |
| `Manufacturing` | `"Manufacturing industries"` |
| `Waste` | `"Waste management and remediation activities"` |
| `Transport` | `"Transportation and storage"` |
| `Health` | `"Human health and social work activities"` |
| `Education` | `"Education"` |
| `Hospitality` | `"Accommodation and food service activities"` |
| `Other` | `"Not elsewhere classified"` |
| *(unmapped)* | `"Not elsewhere classified"` |

### ProgrammeStage → CADT projectStatus

| UNDP `ProgrammeStage` | CADT v2 `projectStatus` |
|---|---|
| `New` | `"Listed"` |
| `AwaitingAuthorization` | `"Listed"` |
| `Approved` | `"Registered"` |
| `Authorised` | `"Authorized"` |
| `Rejected` | `"Rejected"` |

### ProjectProposalStage → CADT projectStatus

| UNDP `ProjectProposalStage` | CADT v2 `projectStatus` |
|---|---|
| `SUBMITTED_INF` .. `APPROVED_INF` | `"Listed"` |
| `SUBMITTED_COST_QUOTATION` .. `ACCEPTED_PROPOSAL` | `"Listed"` |
| `SUBMITTED_CMA` .. `APPROVED_CMA` | `"Listed"` |
| `VALIDATION_PENDING` | `"Listed"` |
| `VALIDATION_REPORT_SUBMITTED` | `"Listed"` |
| `VALIDATION_REPORT_APPROVED` | `"Validated"` |
| `PDD_SUBMITTED` .. `PDD_APPROVED_BY_DNA` | `"Listed"` |
| `AUTHORIZED` / `AUTHORISED` | `"Authorized"` |
| `APPROVED` | `"Registered"` |
| `PENDING` | `"Listed"` |
| `REJECTED` / `REJECTED_INF` / `REJECTED_PROPOSAL` / `REJECTED_CMA` / `REJECTED_VALIDATION` | `"Rejected"` |
| *(unmapped)* | `"Listed"` |

### Sector → CADT unitType (via methodologyType)

| UNDP `Sector` | CADT v2 `unitType` |
|---|---|
| `Forestry` | `"Removal - nature"` |
| `Agriculture` | `"Reduction - nature"` |
| All others | `"Reduction - technical"` |
| *(unmapped)* | `"Not Determined"` |

### TxType → CADT unitStatus

| UNDP `TxType` | CADT v2 `unitStatus` |
|---|---|
| `ISSUE` / `ISSUE_SL` / `APPROVE` | `"Held"` |
| `RETIRE` / `RETIRE_SL` | `"Retired"` |
| `TRANSFER` / `TRANSFER_SL` | `"Exported"` |
| `CREATE` | `"Buffer"` |
| `FREEZE` | `"Inactive"` |
| `REJECT` | `"Cancelled"` |
| *(unmapped)* | `"Held"` |

### Sector → CADT methodologyType

| UNDP `Sector` | CADT v2 `methodologyType` |
|---|---|
| `Forestry` | `"Removal - nature"` |
| `Agriculture` | `"Reduction - nature"` |
| All others | `"Reduction - technical"` |

---

## AEF Table Mappings (Phase 6)

### AEF T1 Submission

| CADT v2 Field | UNDP Source | Derivation |
|---|---|---|
| aefT1SubmissionParty | Config `AEF.party` or `systemCountryName` | Direct |
| aefT1SubmissionVersion | — | `"1.0"` |
| aefT1SubmissionReportYear | Current year | `new Date().getFullYear()` |
| aefT1SubmissionSubmissionDate | Current date | ISO date |

### AEF T2 Authorizations

| CADT v2 Field | UNDP Source | Derivation |
|---|---|---|
| aefT2AuthorizationsId | `AefActionsTableEntity.authorizationId` | Direct |
| aefT2AuthorizationsDate | `ProjectEntity.projectAuthorizationTime` | Epoch → ISO date |
| aefT2AuthorizationsCooperativeApproachId | Config `AEF.cooperativeApproach` | Direct |
| aefT2AuthorizationsQuantity | `AefActionsTableEntity.creditAmount` | Direct |
| aefT2AuthorizationsMetric | — | `"tCO2e"` |
| aefT2AuthorizationsSector | `AefActionsTableEntity.sector` | See Sector picklist |
| aefT2AuthorizationsAuthorizedPartyId | Config `AEF.firstTransferingParty` | Direct |

### AEF T3 Actions

Derived from `AefActionsTableEntity` records with action types TRANSFER, RETIRE, CROSS_BOARDER_TRANSFER.

### AEF T4 Holdings

Derived from `AefActionsTableEntity` records with action type AUTHORIZATION.

### AEF T5 Authorized Entities

Derived from company/organization data for authorized parties.

---

## Example Derived Payloads

### Project payload example

Given a `ProjectEntity` with `refId: "P-001"`, `title: "Solar Farm Abuja"`, sector Energy, and a `Programme` with `currentStage: Authorised`:

```json
{
  "projectRegistryName": "Nigeria Standard Carbon Registry",
  "projectId": "P-001",
  "projectName": "Solar Farm Abuja",
  "projectLink": "https://registry.example.com/projectManagement/view/P-001",
  "projectSector": ["Energy"],
  "projectType": ["Solar"],
  "projectStatus": "Authorized",
  "projectStatusDate": "2025-06-15",
  "projectUnitMetric": "tCO2e"
}
```

### Unit payload example

Given a `CreditBlocksEntity` with serial `CA0NNN-NA-XX-001-2024-0-1001-1400`, creditAmount 400, txType ISSUE:

```json
{
  "unitSerialId": "CA0NNN-NA-XX-001-2024-0-1001-1400",
  "unitStartBlock": "1001",
  "unitEndBlock": "1400",
  "unitVintageYear": 2024,
  "unitCount": 400,
  "unitType": "Reduction - technical",
  "unitStatus": "Held",
  "unitMetric": "tCO2e",
  "cadTrustIssuanceId": "<uuid-from-issuance-sync>"
}
```
