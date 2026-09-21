// Mirrors backend libs/shared/src/dto/cadtrust.sync.dto.ts and the CAD Trust
// sync enums. Kept as plain string unions so no backend import is needed.

export type CadTrustSyncOverallStatus =
  | 'NONE'
  | 'IN_PROGRESS'
  | 'SYNCED'
  | 'FAILED';

export type CadTrustSyncStatus = 'PENDING' | 'STAGED' | 'COMMITTED' | 'FAILED';

export type CadTrustLocalEntityType =
  | 'PROJECT'
  | 'ORGANIZATION'
  | 'PROGRAM'
  | 'METHODOLOGY'
  | 'STAKEHOLDER'
  | 'PROJECT_METHODOLOGY'
  | 'STAKEHOLDER_PROJECT'
  | 'LOCATION'
  | 'VALIDATION'
  | 'VERIFICATION'
  | 'ISSUANCE'
  | 'UNIT'
  | 'LABEL'
  | 'UNIT_LABEL';

export interface CadTrustSyncRecordView {
  localEntityType: CadTrustLocalEntityType;
  cadTrustEntityType: string;
  localId: string;
  cadTrustId?: string;
  syncStatus: CadTrustSyncStatus;
  attemptCount: number;
  lastError?: string;
  lastAttemptTime?: number;
  updateTime: number;
  payload?: Record<string, unknown>;
}

export interface CadTrustSyncOverview {
  overallStatus: CadTrustSyncOverallStatus;
  records: CadTrustSyncRecordView[];
}

export interface CadTrustSyncStatusSummary {
  hasRecords: boolean;
  overallStatus: CadTrustSyncOverallStatus;
}

export type CadTrustSyncScope = 'project' | 'credit';

// Display order + labels for the entity blocks in the popup.
export const PROJECT_ENTITY_ORDER: CadTrustLocalEntityType[] = [
  'ORGANIZATION',
  'PROGRAM',
  'METHODOLOGY',
  'PROJECT',
  'PROJECT_METHODOLOGY',
  'STAKEHOLDER',
  'STAKEHOLDER_PROJECT',
  'LOCATION',
  'VALIDATION',
  'VERIFICATION',
  'ISSUANCE',
];

export const CREDIT_ENTITY_ORDER: CadTrustLocalEntityType[] = [
  'UNIT',
  'LABEL',
  'UNIT_LABEL',
];

// Shared bootstrap singletons — rendered as a compact "Registry setup" group
// above the project-specific record cards.
export const PROJECT_SETUP_ENTITY_TYPES: CadTrustLocalEntityType[] = [
  'ORGANIZATION',
  'PROGRAM',
  'METHODOLOGY',
];

export const ENTITY_TYPE_LABELS: Record<CadTrustLocalEntityType, string> = {
  PROJECT: 'Project',
  ORGANIZATION: 'Home organisation',
  PROGRAM: 'National crediting programme',
  METHODOLOGY: 'Methodology',
  STAKEHOLDER: 'Stakeholder',
  PROJECT_METHODOLOGY: 'Project → methodology',
  STAKEHOLDER_PROJECT: 'Stakeholder → project',
  LOCATION: 'Location',
  VALIDATION: 'Validation',
  VERIFICATION: 'Verification',
  ISSUANCE: 'Issuance',
  UNIT: 'Unit',
  LABEL: 'Article 6 label',
  UNIT_LABEL: 'Unit → label',
};

// CAD Trust table each record type lands in — shown as a monospace chip on every
// entity card. Mirrors the resource endpoints in the backend cadtrust-sync module.
export const CADTRUST_TABLE_NAMES: Record<CadTrustLocalEntityType, string> = {
  PROJECT: 'cadt.project',
  ORGANIZATION: 'cadt.organization',
  PROGRAM: 'cadt.program',
  METHODOLOGY: 'cadt.methodology',
  STAKEHOLDER: 'cadt.stakeholder',
  PROJECT_METHODOLOGY: 'cadt.project_methodology',
  STAKEHOLDER_PROJECT: 'cadt.stakeholder_project',
  LOCATION: 'cadt.project_location',
  VALIDATION: 'cadt.validation',
  VERIFICATION: 'cadt.verification',
  ISSUANCE: 'cadt.issuance',
  UNIT: 'cadt.unit',
  LABEL: 'cadt.label',
  UNIT_LABEL: 'cadt.unit_label',
};

// Candidate payload keys used to give a record section a human label. First
// present non-empty string wins; the record's localId is the fallback.
export const SECTION_LABEL_FIELDS: Partial<Record<CadTrustLocalEntityType, string[]>> = {
  PROJECT: ['projectName'],
  STAKEHOLDER: ['stakeholderName', 'orgName'],
  LOCATION: ['inCountryRegion', 'geographicIdentifier', 'country'],
  VALIDATION: ['validationDocument'],
  VERIFICATION: ['verificationDocument'],
  ISSUANCE: ['issuanceLabel', 'vintage'],
  UNIT: ['warehouseUnitId', 'unitBlockStart'],
  LABEL: ['labelName'],
};

// Short prefix shown before the UUID in the compact "Registry setup" rows.
export const SETUP_ID_PREFIXES: Partial<Record<CadTrustLocalEntityType, string>> = {
  ORGANIZATION: 'org',
  PROGRAM: 'program',
  METHODOLOGY: 'methodology',
};
