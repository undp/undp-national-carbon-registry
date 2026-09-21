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
// Location  ·  /v2/location  ·  primary key: cadTrustLocationId
// NOTE: Child of Project. A project can have multiple locations. An Issuance may optionally reference one Location via cadTrustLocationId.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/location` (stages a new Location record). */
export interface LocationCreateInput {
  /** CAD Trust project identifier. Must be a valid UUID */
  cadTrustProjectId: string;
  /** Country of the location Picklist "location_country" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  locationCountry: string;
  /** Region of the location (max 255 characters) */
  locationRegion?: string;
  /** GIS data for the location (max 10000 characters) */
  locationGis?: string;
  /** Type of map (max 100 characters) */
  locationMapType?: string;
  /** URL link to the map file. Must be a valid URI (max 500 characters) */
  locationMapFileLink?: string;
}

/**
 * Request body for `PUT /v2/location/{cadTrustLocationId}` (stages an update to an existing Location record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type LocationUpdateInput = LocationCreateInput;

/** Shape of a Location record as returned by `GET /v2/location` / `GET /v2/location/{id}`. */
export interface LocationRecord extends LocationCreateInput {
  cadTrustLocationId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/location`. */
export interface LocationCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustLocationId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/location/{id}` and `DELETE /v2/location/{id}`. */
export interface LocationMutationResponse {
  message: string;
  success: boolean;
}

