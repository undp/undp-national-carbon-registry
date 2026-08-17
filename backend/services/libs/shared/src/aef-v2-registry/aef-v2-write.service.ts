import {
  AefStore,
  AefSubmissionDefaults,
  ensureSubmissionForYear,
  formatSubmissionDate,
  linkAuthorizationToEntity,
  recordAction,
  recordAuthorization,
  recordAuthorizedEntity,
} from "@app/aef-v2";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EntityManager } from "typeorm";

import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { RetirementUseData } from "../dto/credit.transaction.data.types";
import { TxType } from "../enum/txtype.enum";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { CountryService } from "../util/country.service";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { AefStoreFactory } from "./aef-v2-store.factory";
import { resolvePartyItmoRegistryId } from "./aef-v2-defaults.factory";
import { AEF_SUBMISSION_DEFAULTS } from "./aef-v2.tokens";
import {
  AEF_V2_ACTION_BY_SUBTYPE,
  AEF_V2_T3_ACTIONS_ALWAYS_NA,
  AEF_V2_T3_AUTHORIZATION_ACTION_NA,
  NOT_APPLICABLE,
} from "./mappers/aef-code.maps";
import { AefBlockMapperContext, mapCreditBlockToAefBlockFields } from "./mappers/aef-block.mapper";
import { mapItmoAuthorizationToAefAuthorization } from "./mappers/aef-authorization.mapper";
import { mapCaAuthorizedEntityToAef } from "./mappers/aef-authorized-entity.mapper";

/**
 * Writes AEF V2 rows through `@app/aef-v2` (never touching `aef_v2_*`
 * repositories directly), driven by the same ledger events V1's
 * `AefReportManagementService.handleAefRecord` reacts to — but a **different
 * event set**, because a V1 issuance is a mitigation outcome, not an ITMO.
 *
 * The V2 event set:
 *
 *  - `TxType.ITMO_AUTH`, the first time a block gains
 *    `itmoAuthorizationRecord` — Table 2 Authorization + a Table 3
 *    "Authorization" Action.
 *  - `TxType.RETIRE`, approved (`CreditTransactionStatusEnum.COMPLETED`), on
 *    an ITMO block, with a subtype `AEF_V2_ACTION_BY_SUBTYPE` maps — a Table
 *    3 Action. `USE_TOWARDS_NDC` is MO-only and never reaches here.
 *  - Everything else (`ISSUE`, domestic `TRANSFER`, MO-only cancellations)
 *    is not an AEF action. See the mappers' docblocks for why.
 *
 * Called from `CreditTransactionsManagementService.handleTransactionRecords`
 * alongside — not instead of — the V1 call, inside the replicator's own
 * transaction. See `AefStoreFactory` for why the store must be bound to that
 * transaction's `EntityManager` — every repository read in this class must
 * be too, via `em.getRepository(...)` rather than an `@InjectRepository`
 * bound to the default connection. Retirement approval is the case that
 * actually bites: `CreditTransactionsManagementService.handleTransactionRecords`
 * flips the retirement's status to COMPLETED via `em.update(...)` earlier in
 * this *same* transaction, and a read through a differently-connected repo
 * cannot see that write until it commits — so a status check against it
 * would always see the pre-approval value.
 */
@Injectable()
export class AefV2WriteService {
  private readonly logger = new Logger(AefV2WriteService.name);

  constructor(
    private readonly storeFactory: AefStoreFactory,
    @Inject(AEF_SUBMISSION_DEFAULTS) private readonly defaults: AefSubmissionDefaults,
    private readonly configService: ConfigService,
    private readonly serialNumberManagementService: SerialNumberManagementService,
    private readonly countryService: CountryService
  ) {}

  async recordCreditBlockEvent(
    creditBlock: CreditBlocksEntity,
    em: EntityManager,
    previousCreditBlock?: CreditBlocksEntity
  ): Promise<void> {
    try {
      if (this.isNewItmoAuthorization(creditBlock, previousCreditBlock)) {
        await this.recordAuthorizationAndAction(creditBlock, em);
        return;
      }
      if (creditBlock.txType === TxType.RETIRE) {
        await this.recordRetirementAction(creditBlock, em);
      }
      // ISSUE, domestic TRANSFER, CREDIT_BLOCK_SPLIT and everything else:
      // not an AEF V2 action.
    } catch (error) {
      this.logger.error(
        `AEF V2 write failed for credit block ${creditBlock.creditBlockId}: ${error.message}`,
        error.stack
      );
      // An ITMO movement missing its AEF row is a defect in a legally filed
      // report — default to failing loudly (and rolling back the ledger
      // transaction with it) rather than silently drifting. Opt out with
      // AEF_STRICT_WRITE=false to degrade to log-and-continue instead.
      if (this.configService.get<boolean>("AEF_V2.strictWrite") !== false) {
        throw error;
      }
    }
  }

  private isNewItmoAuthorization(
    creditBlock: CreditBlocksEntity,
    previous?: CreditBlocksEntity
  ): boolean {
    return (
      creditBlock.txType === TxType.ITMO_AUTH &&
      !!creditBlock.itmoAuthorizationRecord &&
      !previous?.itmoAuthorizationRecord
    );
  }

  private blockContext(): AefBlockMapperContext {
    return {
      party: this.defaults.aefT1SubmissionParty,
      partyItmoRegistryId: resolvePartyItmoRegistryId(
        this.configService,
        this.defaults.aefT1SubmissionParty
      ),
      defaultMitigationType: this.configService.get<string>("AEF_V2.defaultMitigationType"),
    };
  }

  private separator(): string {
    return this.configService.get<string>("serialNumber.seperator") || "-";
  }

  private async recordAuthorizationAndAction(
    creditBlock: CreditBlocksEntity,
    em: EntityManager
  ): Promise<void> {
    if (!creditBlock.itmoSerial) {
      this.logger.warn(
        `Skipping AEF V2 authorization: credit block ${creditBlock.creditBlockId} has no itmoSerial`
      );
      return;
    }

    const project = await em
      .getRepository(ProjectEntity)
      .findOneBy({ refId: creditBlock.projectRefId });
    if (!project) {
      this.logger.warn(
        `Skipping AEF V2 authorization: no project ${creditBlock.projectRefId} for credit block ${creditBlock.creditBlockId}`
      );
      return;
    }

    const authRequest = await em
      .getRepository(CreditTransactionsEntity)
      .findOneBy({ id: creditBlock.itmoAuthorizationRecord });
    if (!authRequest) {
      this.logger.warn(
        `Skipping AEF V2 authorization: no request record ${creditBlock.itmoAuthorizationRecord}`
      );
      return;
    }

    const requestData = (authRequest.data ?? {}) as {
      cooperativeApproachId?: string;
      authorizationPurpose?: AuthorizationPurpose;
      authorizedTimeframeStartYear?: number;
      authorizedTimeframeEndYear?: number;
    };
    const ca = requestData.cooperativeApproachId
      ? await em
          .getRepository(CooperativeApproach)
          .findOneBy({ cooperativeApproachId: requestData.cooperativeApproachId })
      : undefined;

    const store = this.storeFactory.forManager(em);

    // Idempotent against a replayed ledger event: don't insert a second
    // Table 2 row for an authorization this store has already recorded.
    const existing = await store.find("t2Authorizations", {
      where: { aefT2AuthorizationsId: creditBlock.itmoAuthorizationRecord },
      pageSize: 1,
    });
    const authorization =
      existing.data[0] ??
      (await recordAuthorization(
        store,
        this.defaults,
        mapItmoAuthorizationToAefAuthorization(
          {
            authorizationRecordId: creditBlock.itmoAuthorizationRecord,
            requestData: {
              cooperativeApproachId: requestData.cooperativeApproachId,
              authorizationPurpose: requestData.authorizationPurpose,
            },
            requestAmount: authRequest.amount,
            authorizedTimeframeStartYear: requestData.authorizedTimeframeStartYear,
            authorizedTimeframeEndYear: requestData.authorizedTimeframeEndYear,
            cooperativeApproach: ca ? { caReferenceNumber: ca.caReferenceNumber } : undefined,
            project: { sector: project.sector, sectoralScope: project.sectoralScope, refId: project.refId },
            creditBlockId: creditBlock.creditBlockId,
          },
          // The request's own createTime predates approval, sometimes by a
          // long margin — this event (ITMO_AUTH) IS the approval, so its own
          // txTime is the one timestamp that actually captures "authorized
          // at". Matches what aefT3ActionsDate uses just below.
          formatSubmissionDate(new Date(creditBlock.txTime))
        )
      ));

    const range = this.serialNumberManagementService.getBlockRange(creditBlock.itmoSerial);
    const caReferenceNumber = creditBlock.itmoSerial.split(this.separator())[0];
    const blockFields = mapCreditBlockToAefBlockFields(
      creditBlock,
      project,
      range,
      caReferenceNumber,
      this.blockContext()
    );

    await recordAction(store, this.defaults, {
      aefT3ActionsDate: new Date(creditBlock.txTime).toISOString(),
      aefT3ActionsType: "Authorization",
      aefT3ActionsSubtype: "Authorization",
      aefT3ActionsCooperativeApproachId: blockFields.cooperativeApproachId,
      aefT3ActionsAuthorizationId: blockFields.authorizationId,
      aefT3ActionsFirstTransferringPartyId: blockFields.firstTransferringPartyId,
      aefT3ActionsPartyItmoRegistryId: blockFields.partyItmoRegistryId,
      aefT3ActionsItmoFirstId: blockFields.itmoFirstId,
      aefT3ActionsItmoLastId: blockFields.itmoLastId,
      aefT3ActionsMetric: blockFields.metric,
      aefT3ActionsQuantityTCo2: blockFields.quantityTCo2,
      aefT3ActionsMitigationType: blockFields.mitigationType,
      aefT3ActionsVintageYear: blockFields.vintageYear,
      ...AEF_V2_T3_ACTIONS_ALWAYS_NA,
      ...AEF_V2_T3_AUTHORIZATION_ACTION_NA,
      projectId: blockFields.projectId,
      unitId: blockFields.unitId,
      aefT2AuthorizationsId: authorization.id,
    });
  }

  private async recordRetirementAction(creditBlock: CreditBlocksEntity, em: EntityManager): Promise<void> {
    if (!creditBlock.itmoAuthorizationRecord) {
      // MO block — never an ITMO, so never an AEF action. Covers domestic
      // Use-Towards-NDC and every MO-only cancellation.
      return;
    }
    const txData = creditBlock.txData as { transactionId?: string } | undefined;
    if (!txData?.transactionId) {
      return;
    }

    const retireTx = await em
      .getRepository(CreditTransactionsEntity)
      .findOneBy({ id: txData.transactionId });
    if (!retireTx || retireTx.status !== CreditTransactionStatusEnum.COMPLETED) {
      // Not yet approved, or this ledger event is a reject/cancel outcome —
      // nothing actually moved.
      return;
    }

    const mapping = retireTx.subType ? AEF_V2_ACTION_BY_SUBTYPE[retireTx.subType] : undefined;
    if (!mapping) {
      // USE_TOWARDS_NDC never reaches here (MO-only, guarded above); any
      // other unmapped subtype is treated the same way — not an AEF action.
      return;
    }

    if (!creditBlock.itmoSerial) {
      this.logger.warn(
        `Skipping AEF V2 action: credit block ${creditBlock.creditBlockId} has no itmoSerial`
      );
      return;
    }
    const project = await em
      .getRepository(ProjectEntity)
      .findOneBy({ refId: creditBlock.projectRefId });
    if (!project) {
      this.logger.warn(
        `Skipping AEF V2 action: no project ${creditBlock.projectRefId} for credit block ${creditBlock.creditBlockId}`
      );
      return;
    }

    const store = this.storeFactory.forManager(em);

    // Resolved once and reused for both this Action and any Table 5 write it
    // triggers below (see ensureAuthorizedEntityRecorded's docblock) — both
    // must land under the same year's Submission, or the year-end snapshot's
    // reconciliation can never find the entity row to update instead of
    // duplicating it.
    const { record: submission } = await ensureSubmissionForYear(
      store,
      this.defaults,
      new Date(creditBlock.txTime).getUTCFullYear()
    );

    const range = this.serialNumberManagementService.getBlockRange(creditBlock.itmoSerial);
    const caReferenceNumber = creditBlock.itmoSerial.split(this.separator())[0];
    const blockFields = mapCreditBlockToAefBlockFields(
      creditBlock,
      project,
      range,
      caReferenceNumber,
      this.blockContext()
    );

    const useData = (retireTx.data ?? {}) as RetirementUseData;
    const acquiringParty = useData.country
      ? await this.countryService.getAlpha3(useData.country)
      : undefined;

    const existingAuthorization = await store.find("t2Authorizations", {
      where: { aefT2AuthorizationsId: creditBlock.itmoAuthorizationRecord },
      pageSize: 1,
    });

    // Real-time Table 5 write: an OIMP first-transfer/use Action must
    // reference an entity that exists in Table 5 *now*, not only after the
    // year-end snapshot runs. usingAuthorizedEntityId and the ensured T5
    // row's id both derive from the same entity — see the helper's docblock.
    let usingAuthorizedEntityId: string | undefined;
    let entityRecordId: string | undefined;
    let purposeOfUseOimp: string | undefined;
    if (
      retireTx.subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP &&
      useData.authorizedEntityId
    ) {
      const ensured = await this.ensureAuthorizedEntityRecorded(
        store,
        useData.authorizedEntityId,
        submission.id,
        em
      );
      if (ensured) {
        usingAuthorizedEntityId = ensured.key;
        entityRecordId = ensured.id;
        // The entity's current name, not useData.entityName (a snapshot
        // taken at retirement request time) — ensureAuthorizedEntityRecorded
        // just re-fetched the live row, so this reflects a rename that
        // happened between request and approval.
        purposeOfUseOimp = `First transferred to ${ensured.name}`;
      }
    }

    // Cancellations (voluntary or OMGE) never cross a border and never
    // involve an authorized entity — drives the NA overrides below, which
    // apply to both cancellation subtypes identically.
    const isCancellation =
      retireTx.subType === CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION ||
      retireTx.subType === CreditTransactionSubTypesEnum.OMGE_CANCELLATION;

    await recordAction(
      store,
      this.defaults,
      {
        aefT3ActionsDate: new Date(creditBlock.txTime).toISOString(),
        aefT3ActionsType: mapping.type,
        aefT3ActionsSubtype: mapping.subtype,
        aefT3ActionsCooperativeApproachId: blockFields.cooperativeApproachId,
        aefT3ActionsAuthorizationId: blockFields.authorizationId,
        aefT3ActionsFirstTransferringPartyId: blockFields.firstTransferringPartyId,
        aefT3ActionsPartyItmoRegistryId: blockFields.partyItmoRegistryId,
        aefT3ActionsItmoFirstId: blockFields.itmoFirstId,
        aefT3ActionsItmoLastId: blockFields.itmoLastId,
        aefT3ActionsMetric: blockFields.metric,
        aefT3ActionsQuantityTCo2: blockFields.quantityTCo2,
        aefT3ActionsMitigationType: blockFields.mitigationType,
        aefT3ActionsVintageYear: blockFields.vintageYear,
        ...AEF_V2_T3_ACTIONS_ALWAYS_NA,
        // Acquiring participating Party ID: only applicable to "first
        // transfer" (NDC or OIMP, both cross a border) — never to a
        // cancellation, which stays entirely domestic.
        aefT3ActionsAcquiringPartyId: isCancellation ? NOT_APPLICABLE : acquiringParty,
        // Using/cancelling participating Party ID: only meaningful for a
        // domestic NDC first-transfer (the acquiring Party *is* the "using"
        // Party there) — NA for cancellations and for OIMP, where the OIMP
        // authorized entity fills the equivalent role instead (below).
        aefT3ActionsUsingParticipatingPartyId:
          retireTx.subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC
            ? acquiringParty
            : NOT_APPLICABLE,
        // Using/cancelling authorized entity ID: only ever computed above
        // for an OIMP first-transfer with a resolved entity — already
        // undefined for every other subtype, so this NA-falls-back exactly
        // where requested (cancellations and NDC) without needing its own
        // subtype check.
        aefT3ActionsUsingAuthorizedEntityId: usingAuthorizedEntityId ?? NOT_APPLICABLE,
        // Purpose for which the ITMO has been used towards/cancelled for
        // OIMP: only ever computed above for an OIMP first-transfer —
        // already undefined for cancellations and NDC, so this NA-falls-back
        // exactly where requested, same pattern as UsingAuthorizedEntityId above.
        aefT3ActionsPurposeOfUseOimp: purposeOfUseOimp ?? NOT_APPLICABLE,
        projectId: blockFields.projectId,
        unitId: blockFields.unitId,
        aefT2AuthorizationsId: existingAuthorization.data[0]?.id,
      },
      { submissionId: submission.id }
    );

    // Finally exercises the circular T2<->T5 FK the schema was built for
    // (see the README on AefV2Module) — both rows now definitely exist.
    if (existingAuthorization.data[0]?.id && entityRecordId) {
      await linkAuthorizationToEntity(store, existingAuthorization.data[0].id, entityRecordId);
    }
  }

  /**
   * Ensures a Table 5 row exists for `entityId` (a `CaAuthorizedEntity.id`),
   * filed under `submissionId` — the *referencing Action's* year, deliberately
   * not the entity's own `authorizationDate` year. `snapshotAuthorizedEntitiesForYear`
   * reconciles by `(aefT1SubmissionId, aefT5AuthorizedEntitiesId)`; filing
   * this row under any other year's submission would make that reconciliation
   * miss it, producing a duplicate at year end instead of an update.
   *
   * Idempotent, mirroring the existing Table 2 pattern in
   * `recordAuthorizationAndAction`: a second Action referencing the same
   * entity later in the year updates the existing row — picking up a rename
   * or deactivation that happened between the two — rather than duplicating
   * it.
   *
   * Uses the same `mapCaAuthorizedEntityToAef` mapper the year-end snapshot's
   * `RegistryAuthorizedEntitiesProvider` uses, so a real-time row and a
   * snapshot-computed row for the same entity are shaped identically.
   */
  private async ensureAuthorizedEntityRecorded(
    store: AefStore,
    entityId: string,
    submissionId: string,
    em: EntityManager
  ): Promise<{ id: string; key: string; name: string } | undefined> {
    const entity = await em.getRepository(CaAuthorizedEntity).findOneBy({ id: entityId });
    if (!entity) {
      this.logger.warn(`Skipping AEF V2 authorized-entity write: no entity ${entityId}`);
      return undefined;
    }

    const ca = await em
      .getRepository(CooperativeApproach)
      .findOneBy({ cooperativeApproachId: entity.cooperativeApproachId });
    const alpha3 = entity.countryOfIncorporation
      ? await this.countryService.getAlpha3(entity.countryOfIncorporation)
      : undefined;
    // authorizationDate is mandatory going forward; createdTime is the
    // fallback for entities created before that became true — see
    // RegistryAuthorizedEntitiesProvider, which uses the same expression.
    const authorizationDate = formatSubmissionDate(
      new Date(Number(entity.authorizationDate ?? entity.createdTime))
    );

    const input = mapCaAuthorizedEntityToAef(entity, ca?.caReferenceNumber, alpha3, authorizationDate);
    // Same expression Table 5's own business key uses — see
    // aef-authorized-entity.mapper.ts. Table 3's reference must match this
    // exactly, or the two never resolve to each other (the bug this method
    // exists to close).
    const key = entity.entityIdentifier ?? entity.id;

    const existing = await store.find("t5AuthorizedEntities", {
      where: { aefT5AuthorizedEntitiesId: key, aefT1SubmissionId: submissionId },
      pageSize: 1,
    });

    const record = existing.data[0]
      ? await store.update("t5AuthorizedEntities", existing.data[0].id, {
          ...input,
          aefT1SubmissionId: submissionId,
        })
      : await recordAuthorizedEntity(store, this.defaults, input, { submissionId });

    return { id: record.id, key, name: entity.entityName };
  }
}
