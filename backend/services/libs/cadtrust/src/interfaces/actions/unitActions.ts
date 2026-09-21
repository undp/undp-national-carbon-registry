/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, `unit` section
 * ("Additional Units Resources"). These are actions beyond plain CRUD
 * (see ../unit.ts for create/update/delete/read).
 */

import type { Guid } from '../common';

// ---------------------------------------------------------------------------
// Split unit into multiple units  ·  POST /v2/unit/split
// NOTE: Each new record inherits ALL fields from the original unit, then
// overrides only what you provide per record. The FIRST record in `records`
// keeps the original unit's cadTrustUnitId; subsequent records get new UUIDs.
// The sum of every record's unitCount MUST equal the original unit's unitCount.
// This is the mechanism for partial transfers/retirements without disturbing
// the rest of the original block (see Technical Report §5.7, "Unit Blocks Architecture").
// ---------------------------------------------------------------------------

export interface UnitSplitRecord {
  /** Required. Number of units in this split. Sum across all records must equal the original unit's unitCount. */
  unitCount: number;
  /** Optional. If both unitBlockStart and unitBlockEnd are given, unitSerialId is auto-derived from them. */
  unitBlockStart?: string;
  unitBlockEnd?: string;
  unitCurrentOwner?: string;
  /** Optional. Picklist "unit_status" — fetch current values via GET /v2/governance/meta/pickList. */
  unitStatus?: string;
  unitStatusReason?: string;
  /** Optional. YYYY-MM-DD. */
  unitStatusDate?: string;
}

export interface UnitSplitInput {
  cadTrustUnitId: Guid;
  records: UnitSplitRecord[];
}

export interface UnitSplitResponse {
  message: string;
  uuid: Guid;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Tokenize a unit on Chia — NOT a separate endpoint. Use the normal
// POST /v2/unit (see ../unit.ts UnitCreateInput) with:
//   marketplace = "Tokenized on Chia"
//   marketplaceIdentifier = <non-empty identifier>
// The unit can then be queried back with GET /v2/unit?onlyTokenizedUnits=true.
// ---------------------------------------------------------------------------

/** Convenience marker type — not a distinct request, just a constrained view of UnitCreateInput. */
export interface UnitTokenizationFields {
  marketplace: 'Tokenized on Chia';
  /** Cannot be an empty string when marketplace is set. */
  marketplaceIdentifier: string;
  marketplaceLink?: string;
}

// ---------------------------------------------------------------------------
// Batch upload units from CSV  ·  POST /v2/unit/batch  (multipart/form-data, field name "csv")
// NOTE: Flat parent records only — child records (unit labels) are not created
// here; use their own REST endpoint or the XLSX multi-sheet import.
// NOTE: UPDATE rows (matched by cadTrustUnitId) are MERGED against current
// state + already-staged edits, unlike the REST PUT (full replace).
// NOTE: If unitSerialId is omitted but unitStartBlock + unitEndBlock are given,
// it is auto-derived as "<start>-<end>" — including on UPDATE rows after merge.
// ---------------------------------------------------------------------------

export interface UnitBatchCsvRow {
  /** Present + matching an existing unit => UPDATE (merged); absent/non-matching => INSERT. */
  cadTrustUnitId?: Guid;
  unitSerialId?: string;
  unitStartBlock: string;
  unitEndBlock: string;
  unitVintageYear: number;
  cadTrustIssuanceId: Guid;
  unitCount?: number;
  unitType?: string;
  unitStatus?: string;
  unitStatusReason?: string;
  unitStatusDate?: string;
  unitCurrentOwner?: string;
}

export interface UnitBatchUploadResponse {
  message: string;
  success: boolean;
  stagedCount: number;
  errorCount: number;
  errors?: Array<{ row: number; error: string }>;
}

// ---------------------------------------------------------------------------
// Import units + child records from XLSX  ·  PUT /v2/unit/xlsx  (multipart/form-data, field name "xlsx")
// Same NEW-<n> placeholder convention and prerequisites as project XLSX import.
// ---------------------------------------------------------------------------

export type UnitXlsxSheetName = 'units' | 'unitLabels';

export interface UnitXlsxImportResponse {
  message: string;
  success: boolean;
}

// GET /v2/unit?xls=true — binary XLSX download, no typed response body (stream to file).
