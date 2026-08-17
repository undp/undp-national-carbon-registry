import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";

// Typed shapes for CreditTransactionsEntity.data, keyed by the
// transaction's type + subType. Type-specific fields live here instead
// of dedicated nullable columns.

// RETIRED + FIRST_TRANSFER_TOWARDS_NDC / FIRST_TRANSFER_FOR_OIMP (ITMO
// blocks only): the credits cross the country boundary into the
// ITMO-authorized cooperative approach's counterparty country.
// FIRST_TRANSFER_FOR_OIMP additionally names the authorized entity the
// credits are used for. `country` is resolved server-side from the
// block's cooperative approach — supplied by the requester only when
// the CA has more than one counterparty. `cooperativeApproachId` is
// denormalized from the block's ITMO authorization record so CA-scoped
// queries (e.g. corresponding adjustment calculations) don't need to
// join back through the block.
export interface RetirementUseData {
  country?: string;
  authorizedEntityId?: string;
  entityName?: string;
  cooperativeApproachId?: string;
  remarks?: string;
}

// RETIRED + VOLUNTARY_CANCELLATION / OMGE_CANCELLATION — never leaves
// the country, no counterparty involved.
export interface RetirementCancellationData {
  remarks?: string;
}

// ITMO_AUTHORIZED — provisional shape; the concrete structure
// (cooperative approach linkage, purpose, etc.) will be finalized when
// the ITMO authorization data model is fully defined.
export interface ItmoAuthorizationData {
  cooperativeApproachId?: string;
  authorizationPurpose?: AuthorizationPurpose;
  authorizedTimeframeStartYear?: number;
  authorizedTimeframeEndYear?: number;
  remarks?: string;
}

export type CreditTransactionData =
  | RetirementUseData
  | RetirementCancellationData
  | ItmoAuthorizationData;

// Server-resolved fields merged onto CreditRetireRequestDto before it
// is persisted as the RETIRE_REQ ledger event's txData — the
// destination country (resolved from the block's ITMO-authorized
// cooperative approach) and the authorized entity's display name
// (resolved from authorizedEntityId). Read back out of txData by the
// replicator (CreditTransactionsManagementService.buildRetirementData)
// when the PENDING CreditTransactionsEntity row is created, so the
// client never has to (and cannot) set them directly.
export interface ResolvedRetireRequestFields {
  resolvedCountry?: string;
  resolvedEntityName?: string;
  resolvedCooperativeApproachId?: string;
}
