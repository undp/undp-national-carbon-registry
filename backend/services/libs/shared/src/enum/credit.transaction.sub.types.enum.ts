// Sub-classification of a credit transaction, stored alongside the
// primary CreditTransactionTypesEnum. Currently only RETIRED
// transactions carry a subType; future types may add their own values.
//
// VOLUNTARY_CANCELLATION / OMGE_CANCELLATION are available on both MO
// and ITMO blocks, regardless of ITMO authorization purpose.
//
// USE_TOWARDS_NDC is MO-only: the host country counting the credit
// toward its own NDC. This never crosses a border, so it never
// triggers a first transfer or a corresponding adjustment.
//
// FIRST_TRANSFER_TOWARDS_NDC / FIRST_TRANSFER_FOR_OIMP are ITMO-only,
// and are the moment the credit is considered to have left the host
// country — gated by the block's ITMO authorization purpose
// (NDC -> FIRST_TRANSFER_TOWARDS_NDC only; OIMP/OTHER ->
// FIRST_TRANSFER_FOR_OIMP only). See
// CreditTransactionsManagementService.resolveRetirementUseFields.
export enum CreditTransactionSubTypesEnum {
  VOLUNTARY_CANCELLATION = "Voluntary Cancellations",
  USE_TOWARDS_NDC = "Use Towards NDC",
  FIRST_TRANSFER_TOWARDS_NDC = "First Transfer Towards NDC",
  FIRST_TRANSFER_FOR_OIMP = "First Transfer For OIMP",
  OMGE_CANCELLATION = "OMGE Cancellation",
}
