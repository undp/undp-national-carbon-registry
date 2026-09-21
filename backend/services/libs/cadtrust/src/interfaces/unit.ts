/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md (develop branch)
 * and cross-checked against docs/cadtrust-schema-v2.0.2.json.
 * Field names, required/optional flags, and payload shapes are taken verbatim
 * from the POST "Fields:" tables and curl examples in the live API guide —
 * nothing here is inferred from the DBML or the Technical Report.
 *
 * Do not hand-edit field lists without re-checking the source doc; re-generate instead.
 */

// ---------------------------------------------------------------------------
// Unit  ·  /v2/unit  ·  primary key: cadTrustUnitId
// NOTE: Leaf-level entity. Before creating a unit, the chain program -> methodology -> project -> project_methodology -> verification -> issuance must already be staged or committed.
// NOTE: v2 renamed unitStatus "Active" to "Held". Sending "Active" fails validation with no fallback.
// NOTE: unitCount is documented as required on create, but the schema notes it is also system-inferred from the start/end block range — send it explicitly and treat any mismatch as a validation concern to test against a live node.
// NOTE: marketplace / marketplaceLink / marketplaceIdentifier are optional tokenization fields. To mark a unit as tokenized on Chia: marketplace = "Tokenized on Chia" and a non-empty marketplaceIdentifier.
// NOTE: Also supports: POST /v2/unit/split (split into multiple unit blocks), POST /v2/unit/batch (CSV batch create/update), PUT /v2/unit/xlsx (multi-sheet XLSX import), GET /v2/unit?xls=true (XLSX export). See actions/unitActions.ts.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/unit` (stages a new Unit record). */
export interface UnitCreateInput {
  /** Serial identifier for the unit */
  unitSerialId: string;
  /** Start block identifier */
  unitStartBlock: string;
  /** End block identifier */
  unitEndBlock: string;
  /** Vintage year (must be between 1900 and 2100) */
  unitVintageYear: number;
  /** CAD Trust issuance identifier. Must be a valid UUID */
  cadTrustIssuanceId: string;
  /** Count of units (must be >= 0) */
  unitCount: number;
  /** Type of unit Picklist "unit_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  unitType: string;
  /** Status of the unit Picklist "unit_status" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  unitStatus: string;
  /** Reason for the unit status */
  unitStatusReason: string;
  /** Date when the unit status was set (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  unitStatusDate?: string;
  /** Details about unit retirement */
  unitRetirementDetail?: string;
  /** Beneficiary of unit retirement */
  unitRetirementBeneficiary?: string;
  /** Beneficiary identifier for unit retirement */
  unitRetirementBeneficiaryId?: string;
  /** URL link to the unit. Must be a valid URI */
  unitLink?: string;
  /** Unit metric Picklist "unit_metric" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  unitMetric: string;
  /** Current owner of the unit */
  unitCurrentOwner?: string;
  /** ITMOS reference identifier */
  unitItmosReferenceId?: string;
  /** Marketplace name (can be null) */
  marketplace?: string;
  /** Marketplace link (can be null) */
  marketplaceLink?: string;
  /** Marketplace identifier (can be null, but cannot be empty string) */
  marketplaceIdentifier?: string;
}

/**
 * Request body for `PUT /v2/unit/{cadTrustUnitId}` (stages an update to an existing Unit record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 * (Exception: POST /v2/unit/batch (CSV) and PUT /v2/unit/xlsx DO merge
 * partial fields into the existing/staged record instead of requiring all fields —
 * see actions/unitActions.ts.)
 */
export type UnitUpdateInput = UnitCreateInput;

/** Shape of a Unit record as returned by `GET /v2/unit` / `GET /v2/unit/{id}`. */
export interface UnitRecord extends UnitCreateInput {
  cadTrustUnitId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/unit`. */
export interface UnitCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustUnitId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/unit/{id}` and `DELETE /v2/unit/{id}`. */
export interface UnitMutationResponse {
  message: string;
  success: boolean;
}

