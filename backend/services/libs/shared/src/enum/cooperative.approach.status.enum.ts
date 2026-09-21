// Cooperative Approach lifecycle statuses under Article 6.2.
//
// DRAFT / ACTIVE / SUSPENDED / COMPLETED predate this file; REVOKED is
// added for Draft -/CMA.5 paragraphs 20-21 compliance. Revocation is
// semantically distinct from suspension: suspension is temporary and
// reversible, revocation is terminal and signals the authorizing Party
// has withdrawn authorization for any ITMOs under the CA. A Revoked CA
// must not be the source of a new first transfer.
//
// SUBMITTED sits between Draft and Active: it is never set manually,
// only by InitialReportService.submitReport via
// CooperativeApproachService.markSubmitted. It means "initial report
// filed, awaiting activation" — the approach is frozen for editing of
// its authorized entities but not yet able to authorize ITMOs.
export enum CooperativeApproachStatus {
  DRAFT = "Draft",
  SUBMITTED = "Submitted",
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
  COMPLETED = "Completed",
  REVOKED = "Revoked",
}
