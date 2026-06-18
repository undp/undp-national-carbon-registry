export enum CreditActionType {
  // RETIREMENT is retained only for the pending-request (accept/reject/cancel)
  // workflow, which still reads stored "retirement" transactions. New create
  // flows use the Article 6.2 actions below. Per Decisions 2/CMA.3 & 6/CMA.4
  // an ITMO is transferred, used (towards NDC / for OIMP) or cancelled
  // (voluntary / OMGE) — "retire/retirement" is Article 6.4 mechanism wording.
  RETIREMENT = 'RETIREMENT',
  TRANSFER = 'TRANSFER',
  USE = 'USE',
  CANCEL = 'CANCEL',
}
