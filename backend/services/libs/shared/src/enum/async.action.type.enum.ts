export enum AsyncActionType {
  Email,
  RegistryCompanyCreate,
  IssueCredit,
  AuthProgramme,
  RejectProgramme,
  DocumentUpload,
  ProgrammeCreate,
  ProgrammeAccept,
  AddMitigation,
  OwnershipUpdate,
  CADTProgrammeCreate,
  CADTUpdateProgramme,
  CADTCreditIssue,
  CADTCertify,
  CADTTransferCredit,
  CompanyUpdate,
  NationalInvestment,

  // CAD Trust v2 sync (@app/cadtrust + libs/shared/src/cadtrust-sync).
  // APPEND ONLY — these are numeric ordinals persisted as Postgres enum LABELS
  // ('0'..'19'). Reordering or inserting renumbers existing async_action_entity
  // rows, and every new member needs an `ALTER TYPE ... ADD VALUE` migration or
  // the insert fails with "invalid input value for enum".
  CADTV2ProjectCreate,
  CADTV2ProjectUpdate,
  CADTV2Commit,
  // Verifies the CAD Trust home organization and stages the registry's one-time
  // program + methodology. See src/migrations/1785600000000-CadTrustV2Bootstrap.ts.
  CADTV2Bootstrap,
  // Stages a CAD Trust validation record for a DNA-approved PDD or validation report.
  // See src/migrations/1785800000000-CadTrustV2Validation.ts.
  CADTV2ValidationCreate,
  // Re-drives any FAILED cadtrust_sync_record and retries a stuck staged-but-uncommitted
  // batch. Enqueued once per national-api start, alongside CADTV2Bootstrap — see main.ts.
  // See src/migrations/1786000000000-CadTrustV2Reconcile.ts.
  CADTV2Reconcile,
  // Stages a CAD Trust verification record for a DNA-approved verification report. Enqueued
  // from DocumentManagementService.performVerificationAction, in the request path — see
  // cadtrust-sync/README.md's "Two different producer-side hooks" for why this one is
  // request-path while CADTV2CreditIssuance/CADTV2UnitUpdate below are replicator-side.
  CADTV2VerificationCreate,
  // Ensures the verification + issuance records for one newly-issued credit block, then
  // creates its unit. Enqueued per creditBlockId from
  // CreditTransactionsManagementService.handleTransactionRecords's ISSUE branch (replicator
  // side) — one call per vintage block, not per issuance event.
  CADTV2CreditIssuance,
  // Full-replace update to an existing unit's owner/status/amount. Enqueued from
  // handleTransactionRecords for TRANSFER (whole-block), RETIRE (COMPLETED only), ITMO_AUTH
  // (COMPLETED only), and the new CREDIT_BLOCK_SPLIT branch (the retained/shrunken side of
  // any partial transfer/retirement/authorization).
  CADTV2UnitUpdate,
}
