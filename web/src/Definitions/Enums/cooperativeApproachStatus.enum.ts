// Mirrors backend libs/shared/src/enum/cooperative.approach.status.enum.ts,
// EXCEPT Revoked is intentionally left out here — it's not exposed in this
// UI. The backend enum, DB, and authorizeProgramme guard still have it; a
// row could in principle carry status "Revoked" via a direct API call, and
// the lookups below degrade gracefully (fall through to a default) if so.
export enum CooperativeApproachStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  COMPLETED = 'Completed',
}

export const CA_STATUS_COLORS: Record<string, string> = {
  [CooperativeApproachStatus.DRAFT]: 'default',
  [CooperativeApproachStatus.SUBMITTED]: 'geekblue',
  [CooperativeApproachStatus.ACTIVE]: 'green',
  [CooperativeApproachStatus.SUSPENDED]: 'orange',
  [CooperativeApproachStatus.COMPLETED]: 'blue',
};

// Manual transitions the backend accepts — mirrors ALLOWED_TRANSITIONS in
// cooperative-approach.service.ts. Draft has none: an approach leaves Draft
// only when its initial report is submitted, which the server does for us.
export const CA_ALLOWED_TRANSITIONS: Record<string, CooperativeApproachStatus[]> = {
  [CooperativeApproachStatus.DRAFT]: [],
  [CooperativeApproachStatus.SUBMITTED]: [CooperativeApproachStatus.ACTIVE],
  [CooperativeApproachStatus.ACTIVE]: [
    CooperativeApproachStatus.SUSPENDED,
    CooperativeApproachStatus.COMPLETED,
  ],
  [CooperativeApproachStatus.SUSPENDED]: [
    CooperativeApproachStatus.ACTIVE,
    CooperativeApproachStatus.COMPLETED,
  ],
  [CooperativeApproachStatus.COMPLETED]: [],
};
