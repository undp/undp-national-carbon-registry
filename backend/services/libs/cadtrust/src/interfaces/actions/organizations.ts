/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, `organizations` section.
 *
 * This is the one-time onboarding event, not a recurring climate-data sync event —
 * included here because a registry adaptor needs to drive it (or at least poll its
 * status) before any of the core entity sync events in ../*.ts can succeed.
 * "Organization" here means: the CADT instance's own identity (org_uid) on the
 * network, not a business/company record in the data model.
 */

// ---------------------------------------------------------------------------
// List all organizations  ·  GET /v2/organizations
// NOTE: The response is a MAP KEYED BY org_uid, not an array. Iterate with
// Object.values() — indexing by position will not work.
// ---------------------------------------------------------------------------

/**
 * One organization entry in the `GET /v2/organizations` map.
 *
 * CORRECTED against a real node (2026-08-21, live-captured via
 * `live/organizations.capture.spec.ts` against a 7-organization node) — the auto-extracted guide's
 * example used camelCase throughout, but every field except `xchAddress` is snake_case on the wire.
 * Also adds `data_model_version_store_id`, `data_model_version_store_hash`, `xchAddress`, `balance`,
 * which the guide's example didn't document at all. See `libs/cadtrust/README.md`'s "Known gaps" §10.
 */
export interface OrganizationSummary {
  org_uid: string;
  org_hash: string;
  name: string;
  /** Icon URL. */
  icon: string;
  /** True for this CADT instance's own organization. */
  is_home: boolean;
  subscribed: boolean;
  synced: boolean;
  /** Documented as a string in the guide's example, e.g. "0". */
  file_store_subscribed: string;
  registry_id: string;
  /** Confirmed `null` on a real node for at least one subscribed-but-not-fully-synced entry. */
  registry_hash: string | null;
  sync_remaining: number;
  data_model_version_store_id: string;
  data_model_version_store_hash: string;
  /**
   * Chia wallet address for this organization. Camel-cased on the wire, unlike every other field
   * here. Confirmed present ONLY on the home organization's entry (this node's own wallet) — every
   * other (imported/subscribed) organization in a real 7-entry list omitted it entirely.
   */
  xchAddress?: string;
  /** Same scope as `xchAddress` — only observed on the home organization's entry. */
  balance?: number;
}

/** Response for `GET /v2/organizations` — keyed by org_uid. */
export type OrganizationListResponse = Record<string, OrganizationSummary>;

// ---------------------------------------------------------------------------
// Get organization sync status  ·  GET /v2/organizations/status?orgUid=<uid>
// ---------------------------------------------------------------------------

/**
 * CORRECTED against a real node (2026-08-21) — this bears no resemblance to the guide's documented
 * shape (`{ orgUid, synced, sync_remaining }`), which does not appear on the wire at all. The
 * `orgUid` query param is not echoed back anywhere in the response.
 */
export interface OrganizationStatusDetails {
  wallet_synced: boolean;
  home_org_synced: boolean;
  pending_commits: number;
  home_org_profile_synced: boolean;
}

export interface OrganizationStatusResponse {
  ready: boolean;
  status: OrganizationStatusDetails;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Organization metadata  ·  GET /v2/organizations/metadata?orgUid=<uid>
//                        ·  POST /v2/organizations/metadata
// ---------------------------------------------------------------------------

/**
 * CORRECTED against a real node (2026-08-21) — the guide's `{ orgUid, metadata }` wrapper does not
 * match the wire: a real (empty-metadata) org returned a bare `{}`, not
 * `{ orgUid: "...", metadata: {} }`. Typed as the flat map directly. UNCONFIRMED for the non-empty
 * case — no organization on the captured node had any metadata set, so whether a populated response
 * is still a bare map or reintroduces a wrapper is not yet verified. Re-check with
 * `addMetadata` + `getMetadata` against the same org_uid before trusting this for a populated case.
 */
export type OrganizationMetadataResponse = Record<string, string>;

export interface OrganizationAddMetadataInput {
  orgUid: string;
  metadata: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Datalayer store mirrors  ·  POST /v2/organizations/mirror
//                          ·  POST /v2/organizations/remove-mirror
// ---------------------------------------------------------------------------

export interface OrganizationMirrorInput {
  storeId: string;
  coinId: string;
}

// ---------------------------------------------------------------------------
// Reclaim home organization  ·  POST /v2/organizations/reclaim-home
// NOTE: The API guide lists this under its "DELETE Examples" heading, but the
// curl example it gives is a POST. Following the working example, as elsewhere
// in this package.
// ---------------------------------------------------------------------------

export interface OrganizationReclaimHomeInput {
  orgUid: string;
}

// ---------------------------------------------------------------------------
// Unsubscribe / resync  ·  PUT /v2/organizations/unsubscribe
//                       ·  PUT /v2/organizations/resync
// ---------------------------------------------------------------------------

export interface OrganizationUnsubscribeInput {
  orgUid: string;
}

export interface OrganizationResyncInput {
  orgUid: string;
}

// ---------------------------------------------------------------------------
// Delete organization  ·  DELETE /v2/organizations/{orgUid}
// NOTE: Removes all local records for the org and unsubscribes from its
// datalayer stores. It does not delete anything on the network.
// ---------------------------------------------------------------------------

export interface OrganizationDeleteResponse {
  message: string;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Create a V2 organization  ·  POST /v2/organizations
// NOTE: Async. The request resolves immediately; the org is created in the
// background (can take up to ~30 min). Poll GET /v2/organizations/creation-status.
// NOTE: Only one organization operation (create / upgrade / reclaim) can run at a
// time — a second call while one is in progress returns 409 with the current status.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/organizations` (JSON-body variant; a file-upload variant also exists). */
export interface OrganizationCreateInput {
  /** Organization name. */
  name: string;
  /** Organization icon URL or base64-encoded image data. */
  icon?: string;
}

/** Immediate (non-terminal) response for `POST /v2/organizations`. */
export interface OrganizationCreateAcceptedResponse {
  message: string;
  success: true;
}

/** Response when another org operation is already running (HTTP 409). */
export interface OrganizationOperationInProgressResponse {
  message: string;
  operationStatus: {
    operation: string;
    status: string;
    startedAt: IsoLikeString;
    elapsedSeconds: number;
  };
  success: false;
}

type IsoLikeString = string;

/** One of the documented `state` values in `GET /v2/organizations/creation-status`. */
export type OrganizationCreationState =
  | 'INITIALIZING'
  | 'STORES_CREATING'
  | 'STORES_CONFIRMED'
  | 'DATA_PUSHING'
  | 'FINALIZING'
  | 'COMPLETE'
  | 'FAILED';

/** Response for `GET /v2/organizations/creation-status` while a creation is running. */
export interface OrganizationCreationStatusInProgress {
  inProgress: true;
  state: OrganizationCreationState;
  message: string;
  progress: number;
  retryCount: number;
  maxRetries: number;
  startedAt: IsoLikeString;
  updatedAt: IsoLikeString;
  stores: {
    orgUid: { id: string | null; confirmed: boolean; dataWritten: boolean };
    registry: { id: string | null; confirmed: boolean; dataWritten: boolean };
    dataModelVersion: { id: string | null; confirmed: boolean; dataWritten: boolean };
    fileStore: { id: string | null; confirmed: boolean; dataWritten: boolean };
  };
  error: string | null;
  success: boolean;
}

/** Response for `GET /v2/organizations/creation-status` while nothing is running. */
export interface OrganizationCreationStatusIdle {
  inProgress: false;
  state: null;
  message: string;
  success: true;
}

/**
 * Response for `GET /v2/organizations/creation-status` while a V1 -> V2 UPGRADE is
 * running. The endpoint reports from two sources: the meta-table state (the
 * store-by-store `state`/`stores`/`progress` fields above) and an in-memory
 * "live operation status". An upgrade only populates the latter, so `state` is
 * null and the detail arrives in `liveStatus`.
 */
export interface OrganizationOperationLiveStatus {
  operation: string;
  status: string;
  startedAt: IsoLikeString;
  elapsedSeconds: number;
}

export interface OrganizationCreationStatusUpgradeInProgress {
  inProgress: true;
  state: null;
  message: string;
  operation: string;
  status: string;
  startedAt: IsoLikeString;
  elapsedSeconds: number;
  liveStatus: OrganizationOperationLiveStatus;
  success: boolean;
}

export type OrganizationCreationStatusResponse =
  | OrganizationCreationStatusInProgress
  | OrganizationCreationStatusUpgradeInProgress
  | OrganizationCreationStatusIdle;

// ---------------------------------------------------------------------------
// Upgrade V1 organization to V2  ·  POST /v2/organizations/upgrade
// NOTE: Preserves the same org_uid; creates a new V2 data store alongside the
// existing V1 store. V1 data is NOT migrated — only the org identity carries over.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/organizations/upgrade`. Body itself is optional — omit to auto-detect the existing V1 home org. */
export interface OrganizationUpgradeInput {
  /** V1 organization UID. Optional — currently unused; the endpoint auto-detects the V1 home org. */
  orgUid?: string;
}

// ---------------------------------------------------------------------------
// Edit home organization  ·  PUT /v2/organizations/edit
// ---------------------------------------------------------------------------

export interface OrganizationEditInput {
  name?: string;
  icon?: string;
}

// ---------------------------------------------------------------------------
// Import / subscribe to a remote organization (read-only mirroring of another
// registry's public data) — PUT /v2/organizations/ and PUT /v2/organizations/subscribe
// ---------------------------------------------------------------------------

export interface OrganizationImportInput {
  /** The remote org's orgUid to import/mirror. */
  orgUid: string;
}

export interface OrganizationSubscribeInput {
  orgUid: string;
}
