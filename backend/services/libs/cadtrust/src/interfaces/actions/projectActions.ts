/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, `project` section
 * ("Additional Projects Resources"). These are actions beyond plain CRUD
 * (see ../project.ts for create/update/delete/read).
 */

import type { Guid } from '../common';

// ---------------------------------------------------------------------------
// Transfer project between organizations  ·  PUT /v2/project/transfer
// NOTE: Stages the transfer of a project record from ANOTHER organization
// into this CADT instance's home organization. Compare with the `offer`
// workflow (actions/offer.ts), which is the counterpart flow used when the
// current org is giving a project away rather than receiving one.
// ---------------------------------------------------------------------------

export interface ProjectTransferInput {
  cadTrustProjectId: Guid;
  /** The org_uid of the organization the project is being transferred to/from. */
  targetOrgUid: string;
}

// ---------------------------------------------------------------------------
// Batch upload projects from CSV  ·  POST /v2/project/batch  (multipart/form-data, field name "csv")
// NOTE: Flat parent records only — one row per project. Child records
// (locations, estimations, ratings, co-benefits, validations, verifications,
// project-methodology, stakeholder-projects) are NOT created by this endpoint;
// use their own REST endpoints or the multi-sheet XLSX import below.
// NOTE: Unlike the REST PUT (full replace), CSV UPDATE rows are MERGED against
// the current DB state plus any already-staged edits — fields present in the
// CSV overwrite, fields absent are left alone.
// NOTE: CSV validation is more lenient than the REST schema: only
// projectRegistryName, projectId, projectName are required for INSERT rows;
// fields required by the plain POST endpoint (e.g. projectLink,
// projectStatusDate) are optional here.
// ---------------------------------------------------------------------------

/** One row of the project batch-upload CSV. Column headers may be camelCase or snake_case. */
export interface ProjectBatchCsvRow {
  /** Present + matching an existing project => UPDATE (merged); absent/non-matching => INSERT. */
  cadTrustProjectId?: Guid;
  projectRegistryName: string;
  projectId: string;
  projectName: string;
  projectCreditingProgram?: string;
  projectLink?: string;
  projectDescription?: string;
  /** Accepts: single value ("Solar"), JSON array ('["Solar","Wind"]'), or pipe-separated ("Solar|Wind"). */
  projectType?: string;
  projectSector?: string;
  projectSubtype?: string;
  projectStatus?: string;
  projectStatusDate?: string;
  projectUnitMetric?: string;
  cadTrustReferenceProjectId?: string;
  cadTrustProgramId?: string;
}

export interface ProjectBatchUploadResponse {
  message: string;
  success: boolean;
  stagedCount: number;
  errorCount: number;
  errors?: Array<{ row: number; error: string }>;
}

// ---------------------------------------------------------------------------
// Import projects + child records from XLSX  ·  PUT /v2/project/xlsx  (multipart/form-data, field name "xlsx")
// NOTE: Prerequisites — a home organization must already exist and there must
// be no pending commits.
// NOTE: Use "NEW-<n>" placeholder IDs (e.g. "NEW-1") in the primary-key column
// to create new records; reuse the same placeholder across sheets to link
// parent/child rows within one import. Use the real cadTrustProjectId to update.
// Max file size: 25 MB.
// ---------------------------------------------------------------------------

/** Sheet names expected in a project XLSX import/export file. */
export type ProjectXlsxSheetName =
  | 'projects'
  | 'locations'
  | 'estimations'
  | 'ratings'
  | 'coBenefits'
  | 'validations'
  | 'verifications'
  | 'projectMethodologies'
  | 'stakeholderProjects';

export interface ProjectXlsxImportResponse {
  message: string;
  success: boolean;
}

// GET /v2/project?xls=true — binary XLSX download, no typed response body (stream to file).
