import { AefSubmissionDefaults, AefT4HoldingsCreateInput, HoldingsProvider } from "@app/aef-v2";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AccountType } from "../../enum/account.type.enum";
import { CreditBlocksEntity } from "../../entities/credit.blocks.entity";
import { ProjectEntity } from "../../entities/projects.entity";
import { SerialNumberManagementService } from "../../serial-number-management/serial-number-management.service";
import { resolvePartyItmoRegistryId } from "../aef-v2-defaults.factory";
import { AEF_SUBMISSION_DEFAULTS } from "../aef-v2.tokens";
import { mapCreditBlockToAefBlockFields } from "../mappers/aef-block.mapper";
import { AEF_V2_T4_HOLDINGS_ALWAYS_NA } from "../mappers/aef-code.maps";

/**
 * Computes Table 4 holdings from this registry's own `CreditBlocksEntity`.
 *
 * **Approximate as-at reconstruction, not exact — read this before trusting
 * `asOf` for anything but the present.** Splits are range-preserving and
 * retirement is terminal with a stable `txTime`, so the query below —
 * every ITMO block whose terminal event (if any) has not yet happened at
 * `asOf` — reconstructs the right *union of ranges* for any past instant.
 * Two things it does **not** get exactly right, both inherent to this
 * schema rather than fixable here:
 *
 *  1. A block still `HOLDING` that moved (split/transferred) after `asOf`
 *     carries its *current*, post-`asOf` range on this row — the missing
 *     complement is a sibling block this same query also returns, so the
 *     union is correct even though a single row's boundary may not match
 *     31 December exactly.
 *  2. The moment a block *became* an ITMO is only available while its
 *     `txType` is still `ITMO_AUTH`; a later movement overwrites `txTime`.
 *     A snapshot taken with `asOf` before the authorization can therefore
 *     wrongly include the block.
 *
 * `AEF_V2.holdingsSource=actions` — replaying this registry's own written
 * `t3Actions` rows instead — closes both gaps, but only for years after the
 * write hook (`AefV2WriteService`) has been recording them. It is not
 * implemented here yet; `blocks` is the only source today.
 */
@Injectable()
export class RegistryHoldingsProvider implements HoldingsProvider {
  constructor(
    @InjectRepository(CreditBlocksEntity)
    private readonly creditBlocksRepo: Repository<CreditBlocksEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly serialNumberManagementService: SerialNumberManagementService,
    private readonly configService: ConfigService,
    @Inject(AEF_SUBMISSION_DEFAULTS)
    private readonly defaults: AefSubmissionDefaults
  ) {}

  async getHoldings(params: { reportedYear: number; asOf: Date }): Promise<AefT4HoldingsCreateInput[]> {
    const asOfMs = params.asOf.getTime();
    const separator = this.configService.get<string>("serialNumber.seperator") || "-";

    const blocks = await this.creditBlocksRepo
      .createQueryBuilder("block")
      .where("block.itmoAuthorizationRecord IS NOT NULL")
      .andWhere("block.itmoSerial IS NOT NULL")
      .andWhere("(block.accountType = :holding OR block.txTime > :asOf)", {
        holding: AccountType.HOLDING,
        asOf: asOfMs,
      })
      .getMany();

    const ctx = {
      party: this.defaults.aefT1SubmissionParty,
      partyItmoRegistryId: resolvePartyItmoRegistryId(
        this.configService,
        this.defaults.aefT1SubmissionParty
      ),
      defaultMitigationType: this.configService.get<string>("AEF_V2.defaultMitigationType"),
    };

    const rows: AefT4HoldingsCreateInput[] = [];
    for (const block of blocks) {
      const project = await this.projectRepo.findOneBy({ refId: block.projectRefId });
      if (!project) {
        // A block whose project no longer resolves is a data problem
        // elsewhere in the registry, not something a holdings snapshot
        // should fail over — skip it and let the gap show up on review.
        continue;
      }
      const range = this.serialNumberManagementService.getBlockRange(block.itmoSerial);
      const caReferenceNumber = block.itmoSerial.split(separator)[0];
      const fields = mapCreditBlockToAefBlockFields(block, project, range, caReferenceNumber, ctx);

      rows.push({
        aefT4HoldingsCooperativeApproachId: fields.cooperativeApproachId,
        aefT4HoldingsAuthorizationId: fields.authorizationId,
        aefT4HoldingsFirstTransferringPartyId: fields.firstTransferringPartyId,
        aefT4HoldingsPartyItmoRegistryId: fields.partyItmoRegistryId,
        aefT4HoldingsItmoFirstId: fields.itmoFirstId,
        aefT4HoldingsItmoLastId: fields.itmoLastId,
        aefT4HoldingsMetric: fields.metric,
        aefT4HoldingsQuantityTCo2: fields.quantityTCo2,
        aefT4HoldingsMitigationType: fields.mitigationType,
        aefT4HoldingsVintageYear: fields.vintageYear,
        ...AEF_V2_T4_HOLDINGS_ALWAYS_NA,
        projectId: fields.projectId,
        unitId: fields.unitId,
      });
    }
    return rows;
  }
}
