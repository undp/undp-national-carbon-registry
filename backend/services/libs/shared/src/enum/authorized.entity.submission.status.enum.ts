// Whether a CaAuthorizedEntity has been through initial-report
// submission. Deliberately a second axis alongside
// AuthorizedEntityStatus (Active/Inactive), which answers a different
// question — is the authorization currently in force. An entity can be
// Submitted and Inactive at once (authorized in the initial report,
// later withdrawn), so the two must not be collapsed into one column.
export enum AuthorizedEntitySubmissionStatus {
  DRAFT = "Draft",
  SUBMITTED = "Submitted",
}
