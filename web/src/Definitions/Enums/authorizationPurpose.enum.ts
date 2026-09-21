// Mirrors backend AuthorizationPurpose (libs/shared/src/enum/authorization.purpose.enum.ts).
// The purpose an ITMO block was authorized for — gates which
// retirement subtypes ("use" options) are available for it.
export enum AuthorizationPurpose {
  NDC = 'UseTowardsNDC',
  OIMP = 'OtherInternationalMitigationPurposes',
  OTHER = 'OtherPurposes',
}

// Single source of truth for the human-readable label of each purpose —
// used both by the ITMO authorization request form (itmoAuthRequestModal)
// and by the credit block history graph, which surfaces the purpose on an
// ITMO_AUTH node.
export const AUTHORIZATION_PURPOSE_LABELS: Record<AuthorizationPurpose, string> = {
  [AuthorizationPurpose.NDC]: 'Use Towards NDC',
  [AuthorizationPurpose.OIMP]: 'Other International Mitigation Purposes',
  [AuthorizationPurpose.OTHER]: 'Other Purposes',
};
