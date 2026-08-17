import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { CorrespondingAdjustment } from "../entities/corresponding.adjustment.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { Emission } from "../entities/emission.entity";
import { NdcTarget } from "../entities/ndc.target.entity";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";
import { CaStatus } from "../enum/ca.status.enum";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { CorrespondingAdjustmentUpdateDto } from "../dto/corresponding.adjustment.update.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { User } from "../entities/user.entity";

interface TransactionAggregates {
  firstTransferredItmos: number;
  acquiredItmos: number;
  usedTowardsNdcItmos: number;
  cancelledItmos: number;
  authorizedItmos: number;
}

interface ComputedCaFields extends TransactionAggregates {
  emissionsBalance: number;
  cumulativeFirstTransferred?: number;
  indicativeAnnualAdjustment?: number;
  adjustedEmissions: number | null;
  ndcTargetValue: number | null;
  safeguardCheckPassed: boolean;
  safeguardNotes: string;
}

@Injectable()
export class CorrespondingAdjustmentService {
  constructor(
    @InjectRepository(CorrespondingAdjustment)
    private caRepo: Repository<CorrespondingAdjustment>,
    @InjectRepository(CreditTransactionsEntity)
    private creditTxRepo: Repository<CreditTransactionsEntity>,
    @InjectRepository(Emission)
    private emissionRepo: Repository<Emission>,
    @InjectRepository(NdcTarget)
    private ndcTargetRepo: Repository<NdcTarget>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly configService: ConfigService
  ) {}

  // Corresponding adjustments are managed by the government (DNA)
  // Admin / Root only — mirrors the pattern used for cooperative
  // approaches / initial reports / ITMO authorization.
  private assertCanManage(user: User) {
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      ![Role.Admin, Role.Root].includes(user.role)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.noManagePermission",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
  }

  async calculateCA(
    year: number,
    cooperativeApproachId: string,
    ndcType: NdcType,
    caMethod: CaMethod,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);

    const computed = await this.computeCaFields(
      year,
      cooperativeApproachId,
      ndcType,
      caMethod
    );

    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.CORRESPONDING_ADJUSTMENT,
      3
    );

    const ca = new CorrespondingAdjustment();
    ca.caId = `CA-ADJ-${id}`;
    ca.year = year;
    ca.cooperativeApproachId = cooperativeApproachId;
    ca.metric = "tCO2e";
    ca.ndcType = ndcType;
    ca.caMethod = caMethod;
    ca.authorizedItmos = computed.authorizedItmos;
    ca.firstTransferredItmos = computed.firstTransferredItmos;
    ca.acquiredItmos = computed.acquiredItmos;
    ca.usedTowardsNdcItmos = computed.usedTowardsNdcItmos;
    ca.cancelledItmos = computed.cancelledItmos;
    ca.emissionsBalance = computed.emissionsBalance;
    ca.cumulativeFirstTransferred = computed.cumulativeFirstTransferred;
    ca.indicativeAnnualAdjustment = computed.indicativeAnnualAdjustment;
    ca.ndcTarget = computed.ndcTargetValue;
    ca.adjustedEmissions = computed.adjustedEmissions;
    ca.safeguardCheckPassed = computed.safeguardCheckPassed;
    ca.safeguardNotes = computed.safeguardNotes;
    ca.status = CaStatus.DRAFT;
    ca.createdTime = now;
    ca.updatedTime = now;

    const saved = await this.caRepo.save(ca);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  /**
   * Edits a Draft record: only `caMethod` and `remarks` are directly
   * editable (the quantitative fields are derived from ledger data —
   * hand-editing them would break the audit trail). Changing `caMethod`
   * re-runs the same computation used by calculateCA, in place, for the
   * record's existing year/CA/ndcType.
   */
  async update(
    dto: CorrespondingAdjustmentUpdateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const ca = await this.caRepo.findOneBy({ caId: dto.caId });
    if (!ca) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    if (ca.status !== CaStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notEditable",
          [ca.caId, ca.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (dto.caMethod !== undefined && dto.caMethod !== ca.caMethod) {
      const computed = await this.computeCaFields(
        ca.year,
        ca.cooperativeApproachId,
        ca.ndcType,
        dto.caMethod
      );
      ca.caMethod = dto.caMethod;
      ca.authorizedItmos = computed.authorizedItmos;
      ca.firstTransferredItmos = computed.firstTransferredItmos;
      ca.acquiredItmos = computed.acquiredItmos;
      ca.usedTowardsNdcItmos = computed.usedTowardsNdcItmos;
      ca.cancelledItmos = computed.cancelledItmos;
      ca.emissionsBalance = computed.emissionsBalance;
      ca.cumulativeFirstTransferred = computed.cumulativeFirstTransferred;
      ca.indicativeAnnualAdjustment = computed.indicativeAnnualAdjustment;
      ca.ndcTarget = computed.ndcTargetValue;
      ca.adjustedEmissions = computed.adjustedEmissions;
      ca.safeguardCheckPassed = computed.safeguardCheckPassed;
      ca.safeguardNotes = computed.safeguardNotes;
    }
    if (dto.remarks !== undefined) {
      ca.remarks = dto.remarks;
    }
    ca.updatedTime = new Date().getTime();

    const saved = await this.caRepo.save(ca);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  /**
   * Shared computation core for calculateCA and update(): resolves the
   * NDC target, aggregates ledger activity, and branches on ndcType per
   * Decision 2/CMA.3 — SingleYear compares this year's transferred
   * amount directly against the year's target; MultiYear tracks the
   * indicative annual adjustment (cumulative transferred ÷ elapsed
   * years) during the period and reconciles against the full-period
   * budget only once the period's final year is reached (per the
   * Article 6.2 Deep-Dive's worked example, there is no meaningful
   * safeguard check mid-period — only the reconciled cumulative figure
   * is ever compared against a target).
   */
  private async computeCaFields(
    year: number,
    cooperativeApproachId: string,
    ndcType: NdcType,
    caMethod: CaMethod
  ): Promise<ComputedCaFields> {
    // SingleYear accepts Trajectory/Averaging (computed identically —
    // this registry has no separate trajectory-baseline data source to
    // differentiate them); MultiYear requires the MultiYear method.
    const methodValid =
      ndcType === NdcType.SINGLE_YEAR
        ? caMethod === CaMethod.TRAJECTORY || caMethod === CaMethod.AVERAGING
        : caMethod === CaMethod.MULTI_YEAR;
    if (!methodValid) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.methodNotCompatibleWithNdcType",
          [caMethod, ndcType]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const countryCode = this.configService.get("systemCountry");
    const ndcTargetRow = await this.ndcTargetRepo.findOne({
      where: { year: String(year), country: countryCode },
    });
    if (!ndcTargetRow) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.ndcTargetNotDefined",
          [String(year)]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (ndcTargetRow.ndcType !== ndcType) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.ndcTypeMismatch",
          [String(year), ndcTargetRow.ndcType, ndcType]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const yearAggregates = await this.aggregateTransactions(
      new Date(year, 0, 1).getTime(),
      new Date(year + 1, 0, 1).getTime(),
      cooperativeApproachId
    );
    const emissionsBalance =
      yearAggregates.firstTransferredItmos - yearAggregates.acquiredItmos;

    if (ndcType === NdcType.SINGLE_YEAR) {
      const emission = await this.emissionRepo.findOne({
        where: { year: String(year), country: countryCode },
      });
      const adjustedEmissions =
        emission?.totalCo2WithoutLand?.co2eq != null
          ? Number(emission.totalCo2WithoutLand.co2eq) + emissionsBalance
          : null;
      const target = ndcTargetRow.singleYearTarget ?? null;
      const { safeguardCheckPassed, safeguardNotes } = this.evaluateSafeguard(
        adjustedEmissions,
        target
      );
      return {
        ...yearAggregates,
        emissionsBalance,
        adjustedEmissions,
        ndcTargetValue: target,
        safeguardCheckPassed,
        safeguardNotes,
      };
    }

    // MultiYear
    const periodStart = ndcTargetRow.budgetPeriodStartYear;
    const periodEnd = ndcTargetRow.budgetPeriodEndYear;
    if (!periodStart || !periodEnd) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.multiYearPeriodNotDefined",
          [String(year)]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const elapsedYears = year - periodStart + 1;
    const cumulativeAggregates = await this.aggregateTransactions(
      new Date(periodStart, 0, 1).getTime(),
      new Date(year + 1, 0, 1).getTime(),
      cooperativeApproachId
    );
    const cumulativeFirstTransferred =
      cumulativeAggregates.firstTransferredItmos -
      cumulativeAggregates.acquiredItmos;
    const indicativeAnnualAdjustment =
      elapsedYears > 0 ? cumulativeFirstTransferred / elapsedYears : null;

    const target = ndcTargetRow.cumulativeBudget ?? null;

    if (year < periodEnd) {
      // Mid-period: only the indicative annual figure is reported.
      // Per the Deep-Dive's worked example, no safeguard check is
      // evaluated until the period-end reconciliation.
      const emission = await this.emissionRepo.findOne({
        where: { year: String(year), country: countryCode },
      });
      const adjustedEmissions =
        emission?.totalCo2WithoutLand?.co2eq != null &&
        indicativeAnnualAdjustment != null
          ? Number(emission.totalCo2WithoutLand.co2eq) +
            indicativeAnnualAdjustment
          : null;
      return {
        ...yearAggregates,
        emissionsBalance,
        cumulativeFirstTransferred,
        indicativeAnnualAdjustment,
        adjustedEmissions,
        ndcTargetValue: target,
        safeguardCheckPassed: true,
        safeguardNotes: `Indicative annual adjustment only (${elapsedYears} of ${
          periodEnd - periodStart + 1
        } years elapsed) — the full safeguard check applies at period end (${periodEnd}).`,
      };
    }

    // Period-end reconciliation: compare the full cumulative balance
    // against the full-period budget.
    const periodYears: string[] = [];
    for (let y = periodStart; y <= periodEnd; y++) {
      periodYears.push(String(y));
    }
    const periodEmissions = await this.emissionRepo.find({
      where: { year: In(periodYears), country: countryCode },
    });
    const cumulativeInventory = periodEmissions.reduce(
      (sum, e) => sum + Number(e.totalCo2WithoutLand?.co2eq ?? 0),
      0
    );
    const adjustedEmissions =
      periodEmissions.length === periodYears.length
        ? cumulativeInventory + cumulativeFirstTransferred
        : null;
    const { safeguardCheckPassed, safeguardNotes } = this.evaluateSafeguard(
      adjustedEmissions,
      target,
      adjustedEmissions === null
        ? `Cannot reconcile: missing national inventory data for one or more years in [${periodStart}, ${periodEnd}].`
        : undefined
    );

    return {
      ...yearAggregates,
      emissionsBalance,
      cumulativeFirstTransferred,
      indicativeAnnualAdjustment,
      adjustedEmissions,
      ndcTargetValue: target,
      safeguardCheckPassed,
      safeguardNotes,
    };
  }

  private evaluateSafeguard(
    adjustedEmissions: number | null,
    target: number | null,
    missingDataNote?: string
  ): { safeguardCheckPassed: boolean; safeguardNotes: string } {
    if (missingDataNote) {
      return { safeguardCheckPassed: true, safeguardNotes: missingDataNote };
    }
    if (target == null || adjustedEmissions === null) {
      return {
        safeguardCheckPassed: true,
        safeguardNotes:
          "Safeguard check could not be performed: missing NDC target or emissions data.",
      };
    }
    if (adjustedEmissions > target) {
      return {
        safeguardCheckPassed: false,
        safeguardNotes: `Adjusted emissions (${adjustedEmissions.toFixed(
          2
        )}) exceed the NDC target (${target}). Participation in cooperative approaches may lead to a net increase in emissions.`,
      };
    }
    return {
      safeguardCheckPassed: true,
      safeguardNotes: `Adjusted emissions (${adjustedEmissions.toFixed(
        2
      )}) are within the NDC target (${target}).`,
    };
  }

  private async aggregateTransactions(
    windowStart: number,
    windowEnd: number,
    cooperativeApproachId?: string
  ): Promise<TransactionAggregates> {
    const qb = this.creditTxRepo
      .createQueryBuilder("tx")
      .where("tx.createTime >= :windowStart AND tx.createTime < :windowEnd", {
        windowStart,
        windowEnd,
      });
    if (cooperativeApproachId) {
      qb.andWhere("tx.data->>'cooperativeApproachId' = :caId", {
        caId: cooperativeApproachId,
      });
    }
    const transactions = await qb.getMany();

    let firstTransferredItmos = 0;
    let acquiredItmos = 0;
    let usedTowardsNdcItmos = 0;
    let cancelledItmos = 0;
    let authorizedItmos = 0;

    for (const tx of transactions) {
      switch (tx.type) {
        case CreditTransactionTypesEnum.ITMO_AUTHORIZED:
          authorizedItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.ACQUIRED:
          // Reserved for a future acquiring-side implementation —
          // never emitted today, so this is always 0. Kept wired into
          // every downstream formula (emissionsBalance, the
          // reconciliation summary) so acquire support slots in
          // without further changes here.
          acquiredItmos += Number(tx.amount);
          break;
        case CreditTransactionTypesEnum.RETIRED:
          // First transfer is the only trigger that moves the
          // emissions balance (Deep-Dive C.1/Q5) — it fires on RETIRED
          // rows (ITMO Use-Towards-NDC / Use-For-OIMP approval, see
          // Step 4), never on TRANSFERED rows (domestic, MO-only).
          if (tx.isFirstTransfer) {
            firstTransferredItmos += Number(tx.amount);
          }
          if (tx.subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC) {
            usedTowardsNdcItmos += Number(tx.amount);
          } else if (
            tx.subType === CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION ||
            tx.subType === CreditTransactionSubTypesEnum.OMGE_CANCELLATION
          ) {
            cancelledItmos += Number(tx.amount);
          }
          break;
      }
    }

    return {
      firstTransferredItmos,
      acquiredItmos,
      usedTowardsNdcItmos,
      cancelledItmos,
      authorizedItmos,
    };
  }

  /**
   * Registry-wide, all-time reconciliation: how much first-transfer
   * (net of acquired) activity has ever happened versus how much has
   * been recorded as a corresponding adjustment so far (Draft included
   * — a Draft row is already "recorded", just not yet finalized). Backs
   * the CA table's top-of-page summary strip.
   */
  async getReconciliationSummary(): Promise<DataResponseDto> {
    const totals = await this.creditTxRepo
      .createQueryBuilder("tx")
      .select(
        `SUM(CASE WHEN tx."type" = :retired AND tx."isFirstTransfer" = true THEN tx."amount" ELSE 0 END)`,
        "totalFirstTransferredItmos"
      )
      .addSelect(
        `SUM(CASE WHEN tx."type" = :acquired THEN tx."amount" ELSE 0 END)`,
        "totalAcquiredItmos"
      )
      .setParameters({
        retired: CreditTransactionTypesEnum.RETIRED,
        acquired: CreditTransactionTypesEnum.ACQUIRED,
      })
      .getRawOne();

    const { sum: totalRecordedCAdjRaw } = await this.caRepo
      .createQueryBuilder("ca")
      .select("SUM(ca.emissionsBalance)", "sum")
      .getRawOne();

    const totalFirstTransferredItmos = Number(
      totals?.totalFirstTransferredItmos ?? 0
    );
    const totalAcquiredItmos = Number(totals?.totalAcquiredItmos ?? 0);
    const totalRecordedCAdj = Number(totalRecordedCAdjRaw ?? 0);
    const outstandingGap =
      totalFirstTransferredItmos - totalAcquiredItmos - totalRecordedCAdj;

    return new DataResponseDto(HttpStatus.OK, {
      totalFirstTransferredItmos,
      totalAcquiredItmos,
      totalRecordedCAdj,
      outstandingGap,
    });
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
    this.assertCanManage(user);
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
    if (ca.status !== CaStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notEditable",
          [ca.caId, ca.status]
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
    this.assertCanManage(user);
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
    if (ca.status !== CaStatus.SUBMITTED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.notSubmitted",
          [ca.caId, ca.status]
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
