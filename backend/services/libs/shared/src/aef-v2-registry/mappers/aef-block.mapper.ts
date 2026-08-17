import { CreditBlocksEntity } from "../../entities/credit.blocks.entity";
import { ProjectEntity } from "../../entities/projects.entity";
import { AEF_V2_SECTORAL_SCOPE_MITIGATION_TYPE, GHG_METRIC } from "./aef-code.maps";

// The block fields T3 Actions and T4 Holdings share — same semantics, same
// source. Kept pure (no repository/service calls) so range and
// cooperative-approach-reference resolution, which do need I/O, are the
// caller's job; this only shapes already-resolved values into AEF fields.
// See libs/aef-v2/src/tables/common.ts for why projectId/unitId are the
// registry's own refId/creditBlockId, never the itmoSerial-derived range.

export interface AefBlockMapperContext {
  /** This registry's Party, ISO 3166-1 alpha-3. Always the first-transferring Party. */
  party: string;
  partyItmoRegistryId?: string;
  defaultMitigationType: string;
}

export interface AefBlockFields {
  cooperativeApproachId: string;
  authorizationId: string;
  firstTransferringPartyId: string;
  partyItmoRegistryId?: string;
  itmoFirstId: number;
  itmoLastId: number;
  metric: string;
  quantityTCo2: number;
  mitigationType: string;
  vintageYear: number;
  projectId: string;
  unitId: string;
}

export function mapCreditBlockToAefBlockFields(
  creditBlock: CreditBlocksEntity,
  project: Pick<ProjectEntity, "sectoralScope">,
  range: { start: number; end: number },
  caReferenceNumber: string,
  ctx: AefBlockMapperContext
): AefBlockFields {
  return {
    cooperativeApproachId: caReferenceNumber,
    // The ITMO_AUTHORIZED CreditTransactionsEntity id — already unique,
    // already alphanumeric, and the one identifier both an Action and a
    // Holding row can derive without a join back to Table 2.
    authorizationId: creditBlock.itmoAuthorizationRecord,
    firstTransferringPartyId: ctx.party,
    partyItmoRegistryId: ctx.partyItmoRegistryId,
    itmoFirstId: range.start,
    itmoLastId: range.end,
    metric: GHG_METRIC,
    quantityTCo2: creditBlock.creditAmount,
    mitigationType:
      AEF_V2_SECTORAL_SCOPE_MITIGATION_TYPE[project.sectoralScope] ??
      ctx.defaultMitigationType,
    vintageYear: Number(creditBlock.vintage),
    projectId: creditBlock.projectRefId,
    unitId: creditBlock.creditBlockId,
  };
}
