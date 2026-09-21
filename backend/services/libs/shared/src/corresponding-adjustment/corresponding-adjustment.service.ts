import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { ConfigService } from "@nestjs/config";
import { CorrespondingAdjustment } from "../entities/corresponding.adjustment.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { InitialReport } from "../entities/initial.report.entity";
import { NdcTarget } from "../entities/ndc.target.entity";
import { NdcTargetYearlyViewEntity } from "../view-entities/ndc.target.yearly.view.entity";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";
import { isNdcMethodCompatible } from "../util/ndc-method-compatibility";
import { CaStatus } from "../enum/ca.status.enum";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { CorrespondingAdjustmentUpdateDto } from "../dto/corresponding.adjustment.update.dto";
import { CaPreviewDto } from "../dto/ca.preview.dto";
import { CaSaveDto } from "../dto/ca.save.dto";
import {
  CaPeriodSummaryDto,
  CaPeriodYearDto,
} from "../dto/ca.period.summary.dto";
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
  appliedAdjustment: number | null;
  adjustedEmissions: number | null;
  ndcTargetValue: number | null;
  safeguardCheckPassed: boolean;
  safeguardNotes: string;
}

// The NDC period covering a reporting year, plus the method that period
// was filed under. Resolved once and threaded through preview / save /
// period-summary so all three agree on the same context.
interface NdcContext {
  ndcStartYear: number;
  ndcEndYear: number;
  ndcType: NdcType;
  caMethod: CaMethod;
  // false => the period's ndc_target carries no sourceReportNumber (a
  // target migrated in from outside the registry), so caMethod is a
  // fallback rather than something actually filed. Only then may the
  // caller override it.
  caMethodResolved: boolean;
  sourceReportNumber: string | null;
}

@Injectable()
export class CorrespondingAdjustmentService {
  constructor(
    @InjectRepository(CorrespondingAdjustment)
    private caRepo: Repository<CorrespondingAdjustment>,
    @InjectRepository(CreditTransactionsEntity)
    private creditTxRepo: Repository<CreditTransactionsEntity>,
    // Resolves the caMethod a period was filed under, via
    // ndc_target.sourceReportNumber — see resolveNdcContext.
    @InjectRepository(InitialReport)
    private initialReportRepo: Repository<InitialReport>,
    @InjectRepository(NdcTarget)
    private ndcTargetRepo: Repository<NdcTarget>,
    @InjectRepository(NdcTargetYearlyViewEntity)
    private ndcTargetYearlyRepo: Repository<NdcTargetYearlyViewEntity>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly configService: ConfigService
  ) {}

  // Corresponding adjustments are a government (DNA) feature end to
  // end — no other company role gets any access. Split from
  // assertCanManage below because DNA-ViewOnly sits between the two: it
  // may calculate/preview (nothing persisted) but not save/submit.
  private assertCanView(user: User) {
    if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.noManagePermission",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
  }

  // Persisting a corresponding adjustment (save/submit/finalize/approve)
  // is managed by a government (DNA) Root/Admin only — Manager and
  // ViewOnly both stop at assertCanView (preview only), matching the
  // CASL ability factory's Manage grant.
  private assertCanManage(user: User) {
    this.assertCanView(user);
    if (![Role.Admin, Role.Root].includes(user.role)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.noManagePermission",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
  }

  // ------------------------------------------------------------------
  // NDC context + gating
  // ------------------------------------------------------------------

  /**
   * The NDC period covering `year`, and the CA method it was filed
   * under. Returns null when no period covers the year — callers decide
   * whether that's a 400 (preview/save) or a calm empty summary (the
   * period-summary read, which the form polls as the user types a year).
   *
   * caMethod comes from the initial report the target was filed from
   * rather than a denormalised column on ndc_target: initial_report is
   * already the sole writer of caMethod, so a copy would only be one
   * more thing to keep in sync. Each saved CA row still freezes its own
   * caMethod, which is the copy that actually matters for an audit.
   */
  private async resolveNdcContext(year: number): Promise<NdcContext | null> {
    const countryCode = this.configService.get("systemCountry");
    const period = await this.ndcTargetRepo.findOne({
      where: {
        country: countryCode,
        ndcStartYear: LessThanOrEqual(year),
        ndcEndYear: MoreThanOrEqual(year),
      },
    });
    if (!period) return null;

    let caMethod: CaMethod | undefined;
    if (period.sourceReportNumber) {
      const report = await this.initialReportRepo.findOneBy({
        reportNumber: period.sourceReportNumber,
      });
      caMethod = report?.caMethod;
    }

    return {
      ndcStartYear: period.ndcStartYear,
      ndcEndYear: period.ndcEndYear,
      ndcType: period.ndcType,
      // Fall back to Trajectory (the para 7a(i) default) so the form
      // still works against a target migrated in from outside the
      // registry — but flag it so the UI lets the user choose.
      caMethod: caMethod ?? CaMethod.TRAJECTORY,
      caMethodResolved: caMethod != null,
      sourceReportNumber: period.sourceReportNumber ?? null,
    };
  }

  private async resolveNdcContextOrFail(year: number): Promise<NdcContext> {
    const context = await this.resolveNdcContext(year);
    if (!context) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.ndcTargetNotDefined",
          [String(year)]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    return context;
  }

  /**
   * An adjustment can only be finalized once the period it accounts for
   * is actually over.
   *
   * Trajectory finalizes per year: each year's adjustment is that year's
   * own activity, so it's complete the moment the year ends. Averaging
   * finalizes per NDC period: the running average keeps moving as later
   * activity lands, so no year is final until the whole period is.
   */
  private assertGateOpen(context: NdcContext, year: number) {
    const isAveraging = context.caMethod === CaMethod.AVERAGING;
    const gateYear = isAveraging ? context.ndcEndYear : year;
    // UTC deliberately: a local-time boundary would let a UTC+13 server
    // accept a submission ~13h before the year is over anywhere else,
    // and reject one a UTC-11 server would accept.
    if (Date.now() >= Date.UTC(gateYear + 1, 0, 1)) return;

    throw new HttpException(
      isAveraging
        ? this.helperService.formatReqMessagesString(
            "correspondingAdjustment.ndcPeriodNotOver",
            [
              String(context.ndcStartYear),
              String(context.ndcEndYear),
              String(context.ndcEndYear + 1),
            ]
          )
        : this.helperService.formatReqMessagesString(
            "correspondingAdjustment.reportingYearNotOver",
            [String(year), String(year + 1)]
          ),
      HttpStatus.BAD_REQUEST
    );
  }

  // ------------------------------------------------------------------
  // Preview / save
  // ------------------------------------------------------------------

  /**
   * Computes a year's adjustment and returns the whole period's table
   * with that year overlaid — WITHOUT persisting anything. Splitting
   * this out from save() is what stops an exploratory Calculate from
   * writing a row (and burning a CA-ADJ id) on every click.
   */
  async previewCA(dto: CaPreviewDto, user: User): Promise<DataResponseDto> {
    // Deliberately assertCanView, not assertCanManage — nothing is
    // persisted here, so a DNA-ViewOnly user may calculate a preview
    // even though they cannot save or submit one (see saveCA below).
    this.assertCanView(user);
    const context = await this.resolveNdcContextOrFail(dto.year);
    const caMethod = this.effectiveCaMethod(context, dto.caMethodOverride);

    const computed = await this.computeCaFields(
      dto.year,
      context,
      caMethod,
      dto.reportingYearEmission
    );
    const summary = await this.getPeriodSummaryFor(context);

    // Overlay the reporting year's column with the not-yet-saved
    // numbers so the table the user sees is the table they'd get.
    const row = summary.years.find((y) => y.year === dto.year);
    if (row) {
      row.annualEmission = dto.reportingYearEmission;
      row.appliedAdjustment = computed.appliedAdjustment;
      row.adjustedBalance = computed.adjustedEmissions;
      row.isPreview = true;
    }

    // Averaging: saving this year also materialises every earlier
    // elapsed year (see recomputeOpenAveragingYears), so the preview has
    // to show those columns too — otherwise Calculate and Save would
    // disagree about which years the table covers. Each is the running
    // average as at that year, so they must be computed individually
    // rather than repeating the reporting year's figure.
    if (caMethod === CaMethod.AVERAGING) {
      await this.overlayElapsedAveragingYears(summary, context, dto.year);
    }

    return new DataResponseDto(HttpStatus.OK, {
      ...summary,
      caMethod,
      reportingYear: dto.year,
      computed,
      safeguardCheckPassed: computed.safeguardCheckPassed,
      safeguardNotes: computed.safeguardNotes,
    });
  }

  /**
   * Persists the year's adjustment. Exactly one row exists per year, so
   * this is a find-or-create: a Draft is overwritten in place (that's
   * the "recalculate until the year closes" path), and anything already
   * finalized is refused.
   *
   * Under Averaging every still-Draft year from the period start up to
   * the reporting year is recomputed too, because each year's running
   * average shifts as later activity lands. All figures are re-derived
   * from ledger transactions, so the cascade is idempotent.
   */
  async saveCA(dto: CaSaveDto, user: User): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const context = await this.resolveNdcContextOrFail(dto.year);
    const caMethod = this.effectiveCaMethod(context, dto.caMethodOverride);

    if (dto.submit) this.assertGateOpen(context, dto.year);

    try {
      await this.caRepo.manager.transaction(async (manager) => {
        await this.upsertYear(
          manager,
          dto.year,
          context,
          caMethod,
          dto.reportingYearEmission,
          dto.remarks,
          dto.submit === true
        );

        if (caMethod === CaMethod.AVERAGING) {
          await this.recomputeOpenAveragingYears(
            manager,
            context,
            dto.year,
            dto.submit === true
          );
        }
      });
    } catch (error: any) {
      // The FOR UPDATE below covers concurrent updates; a race between
      // two first-saves for a virgin year still lands on the unique
      // constraint.
      if (error?.code === "23505") {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "correspondingAdjustment.concurrentCalculation",
            [String(dto.year)]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }

    const summary = await this.getPeriodSummaryFor(context);
    const saved = await this.caRepo.findOneBy({ year: dto.year });
    return new DataResponseDto(HttpStatus.OK, {
      ...summary,
      caMethod,
      reportingYear: dto.year,
      caId: saved?.caId ?? null,
      status: saved?.status ?? null,
      safeguardCheckPassed: saved?.safeguardCheckPassed ?? null,
      safeguardNotes: saved?.safeguardNotes ?? null,
    });
  }

  // The method the server derived, unless it genuinely couldn't derive
  // one — only then does a caller-supplied override win.
  private effectiveCaMethod(
    context: NdcContext,
    override?: CaMethod
  ): CaMethod {
    return !context.caMethodResolved && override ? override : context.caMethod;
  }

  /**
   * Creates or overwrites one year's row inside an open transaction.
   * Returns the persisted entity.
   */
  private async upsertYear(
    manager: any,
    year: number,
    context: NdcContext,
    caMethod: CaMethod,
    reportingYearEmission: number | null,
    remarks: string | undefined,
    submit: boolean,
    // See computeCaFields — Averaging evaluates one uniform average for
    // the whole period, anchored at the year actually being reported.
    averagingAnchorYear?: number
  ): Promise<CorrespondingAdjustment> {
    const existing = await manager
      .getRepository(CorrespondingAdjustment)
      .createQueryBuilder("ca")
      .setLock("pessimistic_write")
      .where("ca.year = :year", { year })
      .getOne();

    if (existing && existing.status !== CaStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.alreadyFinalized",
          [String(year), existing.caId, existing.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const emission =
      reportingYearEmission ??
      (existing?.reportingYearEmission != null
        ? Number(existing.reportingYearEmission)
        : null);

    const computed = await this.computeCaFields(
      year,
      context,
      caMethod,
      emission,
      averagingAnchorYear
    );

    const now = new Date().getTime();
    const ca = existing ?? new CorrespondingAdjustment();
    if (!existing) {
      const id = await this.counterService.incrementCount(
        CounterType.CORRESPONDING_ADJUSTMENT,
        3
      );
      ca.caId = `CA-ADJ-${id}`;
      ca.createdTime = now;
      ca.year = year;
      ca.metric = "tCO2e";
    }
    ca.ndcType = context.ndcType;
    ca.caMethod = caMethod;
    ca.reportingYearEmission = emission;
    ca.authorizedItmos = computed.authorizedItmos;
    ca.firstTransferredItmos = computed.firstTransferredItmos;
    ca.acquiredItmos = computed.acquiredItmos;
    ca.usedTowardsNdcItmos = computed.usedTowardsNdcItmos;
    ca.cancelledItmos = computed.cancelledItmos;
    ca.emissionsBalance = computed.emissionsBalance;
    ca.cumulativeFirstTransferred = computed.cumulativeFirstTransferred;
    ca.indicativeAnnualAdjustment = computed.indicativeAnnualAdjustment;
    ca.appliedAdjustment = computed.appliedAdjustment;
    ca.ndcTarget = computed.ndcTargetValue;
    ca.adjustedEmissions = computed.adjustedEmissions;
    ca.safeguardCheckPassed = computed.safeguardCheckPassed;
    ca.safeguardNotes = computed.safeguardNotes;
    if (remarks !== undefined) ca.remarks = remarks;
    if (submit) ca.status = CaStatus.SUBMITTED;
    else if (!existing) ca.status = CaStatus.DRAFT;
    ca.updatedTime = now;

    return manager.getRepository(CorrespondingAdjustment).save(ca);
  }

  /**
   * Averaging only: materialise and re-derive every elapsed year from
   * the period start up to (but excluding) the year just saved.
   *
   * Driven off the year SPAN, not off the rows that happen to exist —
   * under Averaging every elapsed year has a well-defined adjustment
   * (cumulative balance ÷ elapsed years) derived purely from ledger
   * transactions, so a year with no row yet is a missing record rather
   * than a year with nothing to say. Iterating existing rows instead
   * left those years permanently blank in the period table, excluded
   * them from finalizePeriod (which only submits rows that exist), and
   * kept their first-transfer activity out of the reconciliation total.
   *
   * Years already Submitted/Approved are skipped — a filed figure is
   * never silently rewritten by a later calculation. Checked here up
   * front rather than letting upsertYear's own guard throw, since that
   * would abort the whole cascade over a year we simply meant to leave
   * alone.
   */
  private async recomputeOpenAveragingYears(
    manager: any,
    context: NdcContext,
    upToYear: number,
    submit: boolean
  ): Promise<void> {
    const existing: CorrespondingAdjustment[] = await manager
      .getRepository(CorrespondingAdjustment)
      .createQueryBuilder("ca")
      .setLock("pessimistic_write")
      .where("ca.year >= :start AND ca.year < :end", {
        start: context.ndcStartYear,
        end: upToYear,
      })
      .orderBy("ca.year", "ASC")
      .getMany();
    const statusByYear = new Map(existing.map((r) => [r.year, r.status]));

    for (let year = context.ndcStartYear; year < upToYear; year++) {
      const status = statusByYear.get(year);
      if (status != null && status !== CaStatus.DRAFT) continue;
      await this.upsertYear(
        manager,
        year,
        context,
        CaMethod.AVERAGING,
        null,
        undefined,
        submit,
        // Anchored at the reporting year so every year in the period
        // ends up with the same uniform average.
        upToYear
      );
    }
  }

  /**
   * Averaging only: fill in the period table's earlier elapsed years for
   * a PREVIEW, mirroring what recomputeOpenAveragingYears would persist.
   *
   * A year that already has a Submitted/Approved row keeps its filed
   * figure — saving wouldn't touch it either, so the preview must not
   * pretend otherwise. Everything else is recomputed from ledger data.
   * adjustedBalance is only derivable where that year has a recorded
   * emission, so it stays null otherwise rather than being invented.
   */
  private async overlayElapsedAveragingYears(
    summary: CaPeriodSummaryDto,
    context: NdcContext,
    upToYear: number
  ): Promise<void> {
    for (const row of summary.years) {
      if (row.year >= upToYear || row.year < context.ndcStartYear) continue;
      if (row.status != null && row.status !== CaStatus.DRAFT) continue;

      const computed = await this.computeCaFields(
        row.year,
        context,
        CaMethod.AVERAGING,
        row.annualEmission,
        upToYear
      );
      row.appliedAdjustment = computed.appliedAdjustment;
      row.adjustedBalance = computed.adjustedEmissions;
      row.isPreview = true;
    }
  }

  /**
   * Averaging only: finalize the whole NDC period in one action, once
   * the period is over. Every Draft year in the period is submitted
   * together — under Averaging no individual year is meaningful on its
   * own, so there is no per-year submit for it.
   */
  async finalizePeriod(year: number, user: User): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const context = await this.resolveNdcContextOrFail(year);
    this.assertGateOpen(context, year);

    const updatedCount = await this.caRepo.manager.transaction(
      async (manager) => {
        const rows: CorrespondingAdjustment[] = await manager
          .getRepository(CorrespondingAdjustment)
          .createQueryBuilder("ca")
          .setLock("pessimistic_write")
          .where("ca.year BETWEEN :start AND :end", {
            start: context.ndcStartYear,
            end: context.ndcEndYear,
          })
          .andWhere("ca.status = :status", { status: CaStatus.DRAFT })
          .orderBy("ca.year", "ASC")
          .getMany();

        const now = new Date().getTime();
        for (const row of rows) {
          row.status = CaStatus.SUBMITTED;
          row.updatedTime = now;
          await manager.getRepository(CorrespondingAdjustment).save(row);
        }
        return rows.length;
      }
    );

    if (updatedCount === 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.nothingToFinalize",
          [String(context.ndcStartYear), String(context.ndcEndYear)]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const summary = await this.getPeriodSummaryFor(context);
    return new DataResponseDto(HttpStatus.OK, {
      ...summary,
      finalizedYears: updatedCount,
    });
  }

  // ------------------------------------------------------------------
  // Period summary — backs the years-across table
  // ------------------------------------------------------------------

  async getPeriodSummary(year: number): Promise<DataResponseDto> {
    const context = await this.resolveNdcContext(year);
    if (!context) {
      // 200, not 400: the calculate form polls this as the user types a
      // year, and a year outside every NDC period deserves a calm
      // inline warning rather than an error toast.
      return new DataResponseDto(HttpStatus.OK, {
        hasNdcTarget: false,
        ndcStartYear: null,
        ndcEndYear: null,
        ndcType: null,
        caMethod: null,
        caMethodResolved: false,
        sourceReportNumber: null,
        years: [],
      } as CaPeriodSummaryDto);
    }
    return new DataResponseDto(
      HttpStatus.OK,
      await this.getPeriodSummaryFor(context)
    );
  }

  private async getPeriodSummaryFor(
    context: NdcContext
  ): Promise<CaPeriodSummaryDto> {
    const countryCode = this.configService.get("systemCountry");
    const { ndcStartYear: start, ndcEndYear: end } = context;

    const [targets, adjustments] = await Promise.all([
      this.ndcTargetYearlyRepo.find({
        where: { country: countryCode, targetYear: Between(start, end) },
      }),
      this.caRepo.find({ where: { year: Between(start, end) } }),
    ]);
    const targetByYear = new Map(targets.map((t) => [t.targetYear, t]));
    const caByYear = new Map(adjustments.map((a) => [a.year, a]));

    // Driven off the period span, not off the view rows: a year the
    // view skipped (e.g. a malformed target) still gets a column rather
    // than silently vanishing from the table.
    const years: CaPeriodYearDto[] = [];
    for (let y = start; y <= end; y++) {
      const target = targetByYear.get(y);
      const ca = caByYear.get(y);
      const annualEmission =
        ca?.reportingYearEmission != null
          ? Number(ca.reportingYearEmission)
          : null;
      const appliedAdjustment =
        ca?.appliedAdjustment != null ? Number(ca.appliedAdjustment) : null;
      years.push({
        year: y,
        ndcTarget:
          target?.singleYearTarget != null
            ? Number(target.singleYearTarget)
            : null,
        annualEmission,
        appliedAdjustment,
        adjustedBalance:
          annualEmission != null && appliedAdjustment != null
            ? annualEmission + appliedAdjustment
            : null,
        caId: ca?.caId ?? null,
        status: ca?.status ?? null,
      });
    }

    return {
      hasNdcTarget: true,
      ndcStartYear: start,
      ndcEndYear: end,
      ndcType: context.ndcType,
      caMethod: context.caMethod,
      caMethodResolved: context.caMethodResolved,
      sourceReportNumber: context.sourceReportNumber,
      years,
    };
  }

  /**
   * Annotates a Draft record. Remarks only — every quantitative field is
   * derived from ledger data, and caMethod is now derived from the NDC
   * period the year falls in, so neither is hand-editable here.
   * Recalculation goes through saveCA, which is the single write path
   * for the numbers.
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

    if (dto.remarks !== undefined) {
      ca.remarks = dto.remarks;
    }
    ca.updatedTime = new Date().getTime();

    const saved = await this.caRepo.save(ca);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  /**
   * The calculation core, shared by preview and save.
   *
   * SingleYear splits on caMethod — the two are genuinely different
   * numbers (Decision 2/CMA.3 para 7a):
   *   Trajectory (7a(i))  the year's own net first-transfer balance.
   *   Averaging  (7a(ii)) the running average across the NDC period so
   *                       far: cumulative balance ÷ elapsed years.
   * Either way the adjusted balance is `reportingYearEmission +
   * appliedAdjustment`, judged against this year's point on the
   * interpolated trajectory.
   *
   * The reporting year's emissions are passed in (collected on the
   * form) rather than read from the Emission table, so a calculation
   * never depends on a separate inventory record existing first.
   *
   * MultiYear is retained but unreachable — submitReport hard-codes
   * SingleYear, so nothing ever writes a MultiYear ndc_target.
   */
  private async computeCaFields(
    year: number,
    context: NdcContext,
    caMethod: CaMethod,
    reportingYearEmission: number | null,
    // Averaging only: the year the running average is evaluated AT.
    // Under Averaging the period carries ONE uniform adjustment, not a
    // per-year figure — so a cascade over earlier years passes the year
    // actually being reported here, and every row in the period gets
    // the same average rather than "the average as at its own year".
    // Defaults to `year`, which is the reporting year's own case.
    averagingAnchorYear?: number
  ): Promise<ComputedCaFields> {
    const ndcType = context.ndcType;
    if (!isNdcMethodCompatible(ndcType, caMethod)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "correspondingAdjustment.methodNotCompatibleWithNdcType",
          [caMethod, ndcType]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const countryCode = this.configService.get("systemCountry");

    // UTC boundaries: a local-time window would bucket transactions in
    // the first/last hours of a year differently depending on the
    // container's TZ.
    const yearAggregates = await this.aggregateTransactions(
      Date.UTC(year, 0, 1),
      Date.UTC(year + 1, 0, 1)
    );
    const emissionsBalance =
      yearAggregates.firstTransferredItmos - yearAggregates.acquiredItmos;

    if (ndcType === NdcType.SINGLE_YEAR) {
      // ndc_target holds one row per period, not per year (see NdcTarget
      // / ndc.target.yearly.view.entity.ts) — this year's interpolated
      // point is read off the yearly view, which only ever emits
      // SingleYear rows.
      const yearlyTarget = await this.ndcTargetYearlyRepo.findOne({
        where: { targetYear: year, country: countryCode },
      });
      if (!yearlyTarget) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "correspondingAdjustment.ndcTargetNotDefined",
            [String(year)]
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      let appliedAdjustment = emissionsBalance;
      let cumulativeFirstTransferred: number | undefined;
      // Averaging only — populated below, used to feed the safeguard
      // check a cumulative-vs-cumulative comparison instead of the
      // per-year one Trajectory uses.
      let cumulativeTrajectory: number | undefined;
      let cumulativeAdjustedBalance: number | null | undefined;

      if (caMethod === CaMethod.AVERAGING) {
        // Evaluated at the anchor, NOT at this row's own year: Averaging
        // spreads the period's cumulative balance evenly, so every year
        // carries the same figure. Giving each year "the average as at
        // itself" would make the period sum Σ(cumulative(S..y)/(y-S+1))
        // instead of the cumulative total, so the adjustments would
        // never reconcile against actual first-transfer activity — and
        // a per-year figure is what Trajectory is for.
        const anchorYear = averagingAnchorYear ?? year;
        const elapsedYears = anchorYear - context.ndcStartYear + 1;
        const cumulativeAggregates = await this.aggregateTransactions(
          Date.UTC(context.ndcStartYear, 0, 1),
          Date.UTC(anchorYear + 1, 0, 1)
        );
        cumulativeFirstTransferred =
          cumulativeAggregates.firstTransferredItmos -
          cumulativeAggregates.acquiredItmos;
        appliedAdjustment =
          elapsedYears > 0
            ? cumulativeFirstTransferred / elapsedYears
            : cumulativeFirstTransferred;

        // Dec 2/CMA.3 para 9's safeguard is evaluated against the whole
        // period under Averaging, not year by year (the per-year target
        // and per-year adjusted balance are indicative display figures
        // only — see CaPeriodTable's "Cumulative Adjusted Balance" /
        // "Cumulative Trajectory" rows on the frontend, which this
        // mirrors). Cumulative Trajectory sums every year's interpolated
        // target from the period start through the anchor year.
        const cumulativeTargetRows = await this.ndcTargetYearlyRepo.find({
          where: {
            country: countryCode,
            targetYear: Between(context.ndcStartYear, anchorYear),
          },
        });
        cumulativeTrajectory = cumulativeTargetRows.reduce(
          (sum, t) => sum + Number(t.singleYearTarget),
          0
        );

        // Cumulative Adjusted Balance sums every year's reported
        // emissions from the period start through the anchor year, plus
        // the (undivided) cumulative first-transferred balance — same
        // shape as the MultiYear period-end reconciliation below, just
        // evaluated every year instead of only at the period's end.
        const priorRows = await this.caRepo.find({
          where: { year: Between(context.ndcStartYear, anchorYear) },
        });
        const priorWithEmission = priorRows.filter(
          (r) => r.year !== year && r.reportingYearEmission != null
        );
        const cumulativeInventory = priorWithEmission.reduce(
          (sum, r) => sum + Number(r.reportingYearEmission),
          0
        );
        const haveAllYears =
          priorWithEmission.length + (reportingYearEmission != null ? 1 : 0) >=
          elapsedYears;
        cumulativeAdjustedBalance = haveAllYears
          ? cumulativeInventory +
            (reportingYearEmission != null ? Number(reportingYearEmission) : 0) +
            cumulativeFirstTransferred
          : null;
      }

      const adjustedEmissions =
        reportingYearEmission != null
          ? Number(reportingYearEmission) + appliedAdjustment
          : null;
      const target = yearlyTarget.singleYearTarget ?? null;
      const { safeguardCheckPassed, safeguardNotes } =
        caMethod === CaMethod.AVERAGING
          ? this.evaluateSafeguard(
              cumulativeAdjustedBalance ?? null,
              cumulativeTrajectory ?? null,
              cumulativeAdjustedBalance === null
                ? `Cannot reconcile: missing reporting-year emissions for one or more years in [${context.ndcStartYear}, ${
                    averagingAnchorYear ?? year
                  }].`
                : undefined
            )
          : this.evaluateSafeguard(adjustedEmissions, target);
      return {
        ...yearAggregates,
        emissionsBalance,
        cumulativeFirstTransferred,
        appliedAdjustment,
        adjustedEmissions,
        ndcTargetValue: target,
        safeguardCheckPassed,
        safeguardNotes,
      };
    }

    // MultiYear — the period row's budget fields are no longer
    // duplicated per year, so one lookup by span gives the whole thing.
    const ndcTargetRow = await this.ndcTargetRepo.findOne({
      where: {
        country: countryCode,
        ndcType: NdcType.MULTI_YEAR,
        ndcStartYear: LessThanOrEqual(year),
        ndcEndYear: MoreThanOrEqual(year),
      },
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
      Date.UTC(periodStart, 0, 1),
      Date.UTC(year + 1, 0, 1)
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
      const adjustedEmissions =
        reportingYearEmission != null && indicativeAnnualAdjustment != null
          ? Number(reportingYearEmission) + indicativeAnnualAdjustment
          : null;
      return {
        ...yearAggregates,
        emissionsBalance,
        cumulativeFirstTransferred,
        indicativeAnnualAdjustment,
        appliedAdjustment: indicativeAnnualAdjustment,
        adjustedEmissions,
        ndcTargetValue: target,
        safeguardCheckPassed: true,
        safeguardNotes: `Indicative annual adjustment only (${elapsedYears} of ${
          periodEnd - periodStart + 1
        } years elapsed) — the full safeguard check applies at period end (${periodEnd}).`,
      };
    }

    // Period-end reconciliation: compare the full cumulative balance
    // against the full-period budget. The per-year inventory figures
    // come from the saved adjustments' own reportingYearEmission, since
    // that is now the sole source for a year's emissions.
    const periodRows = await this.caRepo.find({
      where: { year: Between(periodStart, periodEnd) },
    });
    const withEmission = periodRows.filter(
      (r) => r.reportingYearEmission != null
    );
    const cumulativeInventory = withEmission.reduce(
      (sum, r) => sum + Number(r.reportingYearEmission),
      0
    );
    const expectedYears = periodEnd - periodStart + 1;
    // The reporting year itself may not be saved yet — count it in.
    const haveAllYears =
      withEmission.filter((r) => r.year !== year).length +
        (reportingYearEmission != null ? 1 : 0) >=
      expectedYears;
    const adjustedEmissions = haveAllYears
      ? cumulativeInventory +
        (reportingYearEmission != null &&
        !withEmission.some((r) => r.year === year)
          ? Number(reportingYearEmission)
          : 0) +
        cumulativeFirstTransferred
      : null;
    const { safeguardCheckPassed, safeguardNotes } = this.evaluateSafeguard(
      adjustedEmissions,
      target,
      adjustedEmissions === null
        ? `Cannot reconcile: missing reporting-year emissions for one or more years in [${periodStart}, ${periodEnd}].`
        : undefined
    );

    return {
      ...yearAggregates,
      emissionsBalance,
      cumulativeFirstTransferred,
      indicativeAnnualAdjustment,
      appliedAdjustment: indicativeAnnualAdjustment,
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

    // emissionsBalance, NOT appliedAdjustment — deliberately. The gap
    // measures how much first-transfer activity has an adjustment
    // recorded against it, and emissionsBalance is that year's actual
    // activity. Under Averaging the applied figure is a running average
    // instead, and Σ(cumulative(S..Y)/(Y-S+1)) ≠ cumulative(S..E), so
    // summing it would never reconcile to zero even when every year is
    // correctly filed.
    //
    // Drafts are included: with one row per year enforced, a Draft is
    // the year's single working figure rather than one of N duplicates.
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
    // An adjustment can only be finalized once the period it accounts
    // for is over — the reporting year for Trajectory, the whole NDC
    // period for Averaging (which is finalized via finalizePeriod, so
    // this call rejects for Averaging until 1 Jan after the period ends).
    const context = await this.resolveNdcContextOrFail(ca.year);
    this.assertGateOpen(context, ca.year);

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
