// Retirement subtypes of a credit transaction (backend
// CreditTransactionSubTypesEnum) — sent as `subType` on the retire
// request payload.
//
// VOLUNTARY_CANCELLATIONS / OMGE_CANCELLATION are available on both MO
// and ITMO blocks, regardless of ITMO authorization purpose.
// USE_TOWARDS_NDC is MO-only (domestic, never crosses the border).
// FIRST_TRANSFER_TOWARDS_NDC / FIRST_TRANSFER_FOR_OIMP are ITMO-only,
// gated by the block's ITMO authorization purpose (NDC ->
// FIRST_TRANSFER_TOWARDS_NDC only; OIMP/Other -> FIRST_TRANSFER_FOR_OIMP
// only) — these are the two subtypes that constitute a first transfer.
export enum CreditRetirementTypeEmnum {
  VOLUNTARY_CANCELLATIONS = 'Voluntary Cancellations',
  USE_TOWARDS_NDC = 'Use Towards NDC',
  FIRST_TRANSFER_TOWARDS_NDC = 'First Transfer Towards NDC',
  FIRST_TRANSFER_FOR_OIMP = 'First Transfer For OIMP',
  OMGE_CANCELLATION = 'OMGE Cancellation',
}
