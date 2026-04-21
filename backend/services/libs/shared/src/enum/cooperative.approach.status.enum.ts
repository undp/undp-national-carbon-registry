// Cooperative Approach lifecycle statuses under Article 6.2.
//
// DRAFT / ACTIVE / SUSPENDED / COMPLETED predate this file; REVOKED is
// added for Draft -/CMA.5 paragraphs 20-21 compliance. Revocation is
// semantically distinct from suspension: suspension is temporary and
// reversible, revocation is terminal and signals the authorizing Party
// has withdrawn authorization for any ITMOs under the CA. A Revoked CA
// must not be the source of a new first transfer.
export enum CooperativeApproachStatus {
  DRAFT = "Draft",
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
  COMPLETED = "Completed",
  REVOKED = "Revoked",
}
