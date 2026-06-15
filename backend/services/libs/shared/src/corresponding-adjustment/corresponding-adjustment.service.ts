import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { CorrespondingAdjustment } from "../entities/corresponding.adjustment.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { Emission } from "../entities/emission.entity";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";
import { CaStatus } from "../enum/ca.status.enum";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { User } from "../entities/user.entity";

@Injectable()
export class CorrespondingAdjustmentService {
  constructor(
    @InjectRepository(CorrespondingAdjustment)
    private caRepo: Repository<CorrespondingAdjustment>,
    @InjectRepository(CreditTransactionsEntity)
    private creditTxRepo: Repository<CreditTransactionsEntity>,
    @InjectRepository(Emission)
    private emissionRepo: Repository<Emission>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly configService: ConfigService
  ) {}

  async calculateCA(
    year: number,
    cooperativeApproachId: string,
    ndcType: NdcType,
    caMethod: CaMethod,
    ndcTarget: number,
    user: User
  ): Promise<DataResponseDto> {
    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.CORRESPONDING_ADJUSTMENT,
      3
    );

    // NOTE: `ndcType` (single-year vs multi-year) and `caMethod` (trajectory /
    // averaging / multi-year) are accepted and persisted (see below) but are NOT
    // yet applied to the calculation. Decision 2/CMA.3 annex para 7 prescribes a
    // different corresponding-adjustment method per case — single-year trajectory
    // (7(a)(i)), single-year averaging via cumulative ÷ elapsed years (7(a)(ii)),
    // and multi-year with an end-of-period cumulative true-up (7(b)) — plus a
    // finalization step (para 12). This implementation performs one flat annual
    // calculation (the single-year transaction window below) for all of them.
    //
    // These method-specific paths are intentionally not implemented yet: the CMA
    // requested further guidance on corresponding adjustments for single-year and
    // multi-year NDCs (Decision 2/CMA.3 para 3(b)) and that guidance has not been
    // issued, so the exact arithmetic (especially averaging and the cumulative
    // reconciliation) is not yet settled. Branch on `caMethod` here once the
    // methodology is finalized and SME-confirmed.
    // See docs/a6/compliance-remediation-plan.md (F2).

    // Fetch all credit transactions for the year
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year + 1, 0, 1).getTime();

    const transactions = await this.creditTxRepo
      .createQueryBuilder("tx")
      .where("tx.createTime >= :yearStart AND tx.createTime < :yearEnd", {
        yearStart,
        yearEnd,
      })
      .andWhere(
        cooperativeApproachId
          ? "tx.cooperativeApproachId = :caId"
          : "1=1",
        { caId: cooperativeApproachId }
      )
      .getMany();

    // Aggregate by transaction type
    let authorizedItmos = 0;
    let firstTransferredItmos = 0;
    let acquiredItmos = 0;
    let usedTowardsNdcItmos = 0;
    let cancelledItmos = 0;

    for (const tx of transactions) {
      switch (tx.type) {
        case CreditTransactionTypesEnum.AUTHORIZED:
          authorizedItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.FIRST_TRANSFER:
          firstTransferredItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.ACQUIRED:
          acquiredItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.USE_TOWARDS_NDC:
          usedTowardsNdcItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.VOLUNTARY_CANCELLATION:
        case CreditTransactionTypesEnum.OMGE_CANCELLATION:
          cancelledItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.ISSUED:
          authorizedItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.TRANSFERED:
          if (tx.isFirstTransfer) {
            firstTransferredItmos += Number(tx.amount);
          }
          break;
      }
    }

    // Calculate emissions balance per para. 8 of Decision 2/CMA.3:
    // Add ITMOs authorized and first transferred (outgoing)
    // Subtract ITMOs used towards NDC (incoming used)
    const emissionsBalance =
      firstTransferredItmos - acquiredItmos + usedTowardsNdcItmos;

    // Fetch national emissions for the year
    const countryCode = this.configService.get("systemCountry");
    const emission = await this.emissionRepo.findOne({
      where: { year: String(year), country: countryCode },
    });

    let adjustedEmissions: number = null;
    if (emission?.totalCo2WithoutLand?.co2eq) {
      // Adjusted emissions = reported emissions + CAs
      // For transferring party: add first transferred, subtract acquired
      adjustedEmissions =
        Number(emission.totalCo2WithoutLand.co2eq) + emissionsBalance;
    }

    // Safeguard check: adjusted emissions should not exceed NDC target
    let safeguardCheckPassed = true;
    let safeguardNotes = "";
    if (ndcTarget && adjustedEmissions !== null) {
      if (adjustedEmissions > ndcTarget) {
        safeguardCheckPassed = false;
        safeguardNotes = `Adjusted emissions (${adjustedEmissions.toFixed(2)}) exceed NDC target (${ndcTarget}). Participation in cooperative approaches may lead to a net increase in emissions.`;
      } else {
        safeguardNotes = `Adjusted emissions (${adjustedEmissions !== null ? adjustedEmissions.toFixed(2) : "N/A"}) are within NDC target (${ndcTarget}).`;
      }
    } else {
      // Dec 2/CMA.3 annex para 7 requires participation to result in "no net
      // increase" in emissions. If the NDC target or national emissions data is
      // missing we cannot demonstrate that, so the check must NOT silently pass —
      // record it as not-passed rather than leaving the default `true`.
      safeguardCheckPassed = false;
      safeguardNotes =
        "Safeguard check could not be performed: missing NDC target or emissions data.";
    }

    const ca = new CorrespondingAdjustment();
    ca.caId = `CA-ADJ-${id}`;
    ca.year = year;
    ca.cooperativeApproachId = cooperativeApproachId;
    ca.metric = "tCO2e";
    // Stored for record-keeping and future use only — not applied to the
    // calculation above (pending CMA guidance; see the NOTE at the top of this
    // method and docs/a6/compliance-remediation-plan.md F2).
    ca.ndcType = ndcType;
    ca.caMethod = caMethod;
    ca.authorizedItmos = authorizedItmos;
    ca.firstTransferredItmos = firstTransferredItmos;
    ca.acquiredItmos = acquiredItmos;
    ca.usedTowardsNdcItmos = usedTowardsNdcItmos;
    ca.cancelledItmos = cancelledItmos;
    ca.emissionsBalance = emissionsBalance;
    ca.ndcTarget = ndcTarget;
    ca.adjustedEmissions = adjustedEmissions;
    ca.safeguardCheckPassed = safeguardCheckPassed;
    ca.safeguardNotes = safeguardNotes;
    ca.status = CaStatus.DRAFT;
    ca.createdTime = now;
    ca.updatedTime = now;

    const saved = await this.caRepo.save(ca);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    const resp = await this.caRepo
      .createQueryBuilder("ca")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "ca",
            abilityCondition
          ),
          "ca"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"ca".${this.helperService.generateSortCol(query?.sort?.key)}`,
        query?.sort?.order
      )
      .offset(skip)
      .limit(query.size)
      .getManyAndCount();

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async getById(caId: string): Promise<DataResponseDto> {
    const ca = await this.caRepo.findOneBy({ caId });
    if (!ca) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    return new DataResponseDto(HttpStatus.OK, ca);
  }

  async submit(caId: string, user: User): Promise<DataResponseDto> {
    const ca = await this.caRepo.findOneBy({ caId });
    if (!ca) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    // Only a DRAFT corresponding adjustment may be submitted. Guarding here keeps
    // submit non-idempotent-safe: re-submitting an already SUBMITTED/APPROVED
    // record (or skipping the draft stage) is rejected rather than silently
    // overwriting the status.
    if (ca.status !== CaStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.onlyDraftCanBeSubmitted",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    ca.status = CaStatus.SUBMITTED;
    ca.updatedTime = new Date().getTime();
    const saved = await this.caRepo.save(ca);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  async approve(caId: string, user: User): Promise<DataResponseDto> {
    const ca = await this.caRepo.findOneBy({ caId });
    if (!ca) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    // Only a SUBMITTED corresponding adjustment can be approved. Without this the
    // APPROVED terminal state was unreachable (never assigned anywhere).
    if (ca.status !== CaStatus.SUBMITTED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.onlySubmittedCanBeApproved",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    ca.status = CaStatus.APPROVED;
    ca.updatedTime = new Date().getTime();
    const saved = await this.caRepo.save(ca);
    return new DataResponseDto(HttpStatus.OK, saved);
  }
}
