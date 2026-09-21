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
// AefT4Holdings  ·  /v2/aef-t4-holdings  ·  primary key: cadTrustAefT4HoldingsId
// NOTE: Requires a corresponding AefT2Authorizations record to exist (hard FK dependency per validation_rules.conditional_requirements).
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/aef-t4-holdings` (stages a new AefT4Holdings record). */
export interface AefT4HoldingsCreateInput {
  /** Cooperative approach identifier (max 255 characters) */
  aefT4HoldingsCooperativeApproachId: string;
  /** Authorization identifier (max 255 characters) */
  aefT4HoldingsAuthorizationId: string;
  /** First transferring party identifier (max 255 characters) */
  aefT4HoldingsFirstTransferringPartyId: string;
  /** Party ITMO registry identifier (max 255 characters) */
  aefT4HoldingsPartyItmoRegistryId: string;
  /** ITMO first identifier (max 255 characters) */
  aefT4HoldingsItmoFirstId: string;
  /** ITMO last identifier (max 255 characters) */
  aefT4HoldingsItmoLastId: string;
  /** Unit registry identifier (max 255 characters) */
  aefT4HoldingsUnitRegistryId: string;
  /** Unit first identifier (max 255 characters) */
  aefT4HoldingsUnitFirstId: string;
  /** Unit last identifier (max 255 characters) */
  aefT4HoldingsUnitLastId: string;
  /** Quantity in tCO2 (max 2 decimal places) */
  aefT4HoldingsQuantityTCo2: number;
  /** Vintage year (must be between 1900 and 2100) */
  aefT4HoldingsVintageYear: number;
  /** Metric (can be null) Picklist "aef_t2_authorizations_metric" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT4HoldingsMetric?: string;
  /** GWP value (max 255 characters, can be null) */
  aefT4HoldingsGwpValue?: string;
  /** Applicable non-GHG metric (max 255 characters, can be null) */
  aefT4HoldingsApplicableNonGhgMetric?: string;
  /** Quantity non-GHG (max 255 characters, can be null) */
  aefT4HoldingsQuantityNonGhg?: string;
  /** Mitigation type (can be null) Picklist "aef_t3_actions_mitigation_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT4HoldingsMitigationType?: string;
  /** CAD Trust AEF T1 submission identifier. Must be a valid UUID (can be null) */
  cadTrustAefT1SubmissionId?: string;
  /** CAD Trust unit identifier. Must be a valid UUID (can be null) */
  cadTrustUnitId?: string;
  /** CAD Trust project identifier. Must be a valid UUID (can be null) */
  cadTrustProjectId?: string;
  /** CAD Trust AEF T2 authorizations identifier. Must be a valid UUID (can be null) */
  cadTrustAefT2AuthorizationsId?: string;
}

/**
 * Request body for `PUT /v2/aef-t4-holdings/{cadTrustAefT4HoldingsId}` (stages an update to an existing AefT4Holdings record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type AefT4HoldingsUpdateInput = AefT4HoldingsCreateInput;

/** Shape of a AefT4Holdings record as returned by `GET /v2/aef-t4-holdings` / `GET /v2/aef-t4-holdings/{id}`. */
export interface AefT4HoldingsRecord extends AefT4HoldingsCreateInput {
  cadTrustAefT4HoldingsId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/aef-t4-holdings`. */
export interface AefT4HoldingsCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustAefT4HoldingsId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/aef-t4-holdings/{id}` and `DELETE /v2/aef-t4-holdings/{id}`. */
export interface AefT4HoldingsMutationResponse {
  message: string;
  success: boolean;
}

