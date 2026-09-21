import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { InitialReport } from "../entities/initial.report.entity";
import { InitialReportCooperativeApproach } from "../entities/initial.report.cooperative.approach.entity";
import { InitialReportVersion } from "../entities/initial.report.version.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { AuthorizedEntitySubmissionStatus } from "../enum/authorized.entity.submission.status.enum";
import { NdcDetailsPeriod } from "../entities/ndc.details.period.entity";
import { NdcTarget } from "../entities/ndc.target.entity";
import { InitialReportStatus } from "../enum/initial.report.status.enum";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { NdcType } from "../enum/ndc.type.enum";
import { InitialReportCreateDto } from "../dto/initial.report.create.dto";
import { InitialReportUpdateDto } from "../dto/initial.report.update.dto";
import { InitialReportCooperativeApproachDto } from "../dto/initial.report.cooperative.approach.dto";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { User } from "../entities/user.entity";
import { CooperativeApproachService } from "../cooperative-approach/cooperative-approach.service";
import { validateNdcTrajectory } from "./ndc-trajectory";
import { isNdcMethodCompatible } from "../util/ndc-method-compatibility";

// These feed the frozen NDC trajectory and any corresponding
// adjustments already calculated against it — see the update() guard
// below, which blocks changing them once the report has ever been
// filed. caMethodDescription is deliberately excluded: pure narrative
// text with no downstream calculation.
const TRAJECTORY_FIELD_KEYS = [
  "ndcStartYear",
  "ndcEndYear",
  "ndcType",
  "baseYear",
  "baseYearEmission",
  "ndcTarget",
  "caMethod",
] as const;

const GENERAL_FIELD_KEYS = [
  "ndcStartYear",
  "ndcEndYear",
  "ndcType",
  "baseYear",
  "baseYearEmission",
  "ndcTarget",
  "caMethod",
  "caMethodDescription",
  "sectors",
  "participationDemonstration",
  "itmoMetrics",
  "environmentalIntegrity",
] as const;

// What submitReport insists on before a report can be filed. Everything
// in the general set except caMethodDescription, which is optional at
// generate time (the create DTO marks it @IsOptional and generate
// defaults it to ""), so demanding it only at submit would block filing
// on a field the user was never required to fill in. Excluded for the
// same reason it is left out of TRAJECTORY_FIELD_KEYS above: pure
// narrative text with no downstream calculation.
const SUBMIT_REQUIRED_FIELD_KEYS = GENERAL_FIELD_KEYS.filter(
  (key) => key !== "caMethodDescription"
);

@Injectable()
export class InitialReportService {
  constructor(
    @InjectRepository(InitialReport)
    private initialReportRepo: Repository<InitialReport>,
    @InjectRepository(InitialReportCooperativeApproach)
    private linkRepo: Repository<InitialReportCooperativeApproach>,
    @InjectRepository(InitialReportVersion)
    private versionRepo: Repository<InitialReportVersion>,
    @InjectRepository(CooperativeApproach)
    private cooperativeApproachRepo: Repository<CooperativeApproach>,
    // Only used to resolve a submitter's display name for getVersion —
    // getVersions does the equivalent lookup via a raw leftJoin instead.
    @InjectRepository(User)
    private userRepo: Repository<User>,
    // Used by getById to attach each live link's current authorized
    // entities (so the draft page can show entities added after the
    // approach was already filed, not just what a frozen version's
    // snapshot captured). NdcDetailsPeriod / NdcTarget are still only
    // ever touched inside submitReport's transaction, via
    // manager.getRepository(...) — no standalone repo needed for those.
    @InjectRepository(CaAuthorizedEntity)
    private authorizedEntityRepo: Repository<CaAuthorizedEntity>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly configService: ConfigService,
    private readonly cooperativeApproachService: CooperativeApproachService
  ) {}

  // Initial reports are managed by a government (DNA) Root/Admin only —
  // Manager and ViewOnly are both view-only here, matching the CASL
  // ability factory's Manage grant.
  private assertCanManage(user: User) {
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      ![Role.Admin, Role.Root].includes(user.role)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.noManagePermission",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
  }

  private get hostCountry(): string {
    return this.configService.get("systemCountry");
  }

  private applyGeneralFields(
    report: InitialReport,
    dto: InitialReportCreateDto
  ) {
    if (dto.ndcStartYear !== undefined) report.ndcStartYear = dto.ndcStartYear;
    if (dto.ndcEndYear !== undefined) report.ndcEndYear = dto.ndcEndYear;
    if (dto.ndcType !== undefined) report.ndcType = dto.ndcType;
    if (dto.baseYear !== undefined) report.baseYear = dto.baseYear;
    if (dto.baseYearEmission !== undefined)
      report.baseYearEmission = dto.baseYearEmission;
    if (dto.ndcTarget !== undefined) report.ndcTarget = dto.ndcTarget;
    if (dto.caMethod !== undefined) report.caMethod = dto.caMethod;
    if (dto.caMethodDescription !== undefined)
      report.caMethodDescription = dto.caMethodDescription;
    if (dto.sectors !== undefined) report.sectors = dto.sectors;
    if (dto.participationDemonstration !== undefined)
      report.participationDemonstration = dto.participationDemonstration;
    if (dto.itmoMetrics !== undefined) report.itmoMetrics = dto.itmoMetrics;
    if (dto.environmentalIntegrity !== undefined)
      report.environmentalIntegrity = dto.environmentalIntegrity;
  }

  // Guarantees "no two initial reports may cover overlapping NDC
  // periods" at the point the period is chosen, not just at submit — a
  // second Draft whose period intersects an existing one (e.g. an
  // existing 2021-2030 blocks a new 2021-2031, not just an exact repeat
  // of 2021-2030) is rejected immediately rather than only surfacing as
  // a conflict when someone eventually tries to submit it. Backed by a
  // DB-level partial GIST exclusion constraint (see the migration) as
  // the real guarantee; this is what turns that constraint into a clear
  // message naming the report already holding the overlapping period.
  private async assertPeriodAvailable(
    ndcStartYear: number | undefined,
    ndcEndYear: number | undefined,
    excludeReportNumber?: string
  ) {
    if (ndcStartYear == null || ndcEndYear == null) return;
    const qb = this.initialReportRepo
      .createQueryBuilder("initial_report")
      .where('initial_report."ndcStartYear" IS NOT NULL')
      .andWhere('initial_report."ndcEndYear" IS NOT NULL')
      // Two inclusive ranges [a,b] and [c,d] overlap iff a <= d AND c <= b.
      .andWhere('initial_report."ndcStartYear" <= :ndcEndYear')
      .andWhere('initial_report."ndcEndYear" >= :ndcStartYear')
      .setParameters({ ndcStartYear, ndcEndYear });
    if (excludeReportNumber) {
      qb.andWhere('initial_report."reportNumber" != :excludeReportNumber', {
        excludeReportNumber,
      });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.periodAlreadyClaimedBy",
          [String(ndcStartYear), String(ndcEndYear), existing.reportNumber]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // A target at or above the base year's own emissions would mean a
  // flat or rising trajectory rather than the reduction an NDC target
  // is supposed to represent — the interpolation in ndc-trajectory.ts
  // divides fine either way, so nothing there would catch it. Checked
  // at generate/update, alongside assertPeriodAvailable, so a report
  // can't be drafted into this state in the first place rather than
  // only failing much later at submit.
  private assertEmissionTargetValid(
    baseYearEmission: number | undefined | null,
    ndcTarget: number | undefined | null
  ) {
    if (baseYearEmission == null || ndcTarget == null) return;
    if (Number(baseYearEmission) <= Number(ndcTarget)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.emissionMustExceedTarget",
          [String(baseYearEmission), String(ndcTarget)]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private isUniqueViolation(error: any): boolean {
    // 23505 = unique_violation, 23P01 = exclusion_violation (the GIST
    // overlap constraint raises the latter, not the former).
    return error?.code === "23505" || error?.code === "23P01";
  }

  async generateDraft(
    dto: InitialReportCreateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    await this.assertPeriodAvailable(dto.ndcStartYear, dto.ndcEndYear);
    this.assertEmissionTargetValid(dto.baseYearEmission, dto.ndcTarget);

    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.INITIAL_REPORT,
      3
    );

    const report = new InitialReport();
    report.reportNumber = `IR-${id}`;
    report.status = InitialReportStatus.DRAFT;
    // Displayed as "v1.0" from the moment a report is generated, not
    // "v0.0" — matches the version the first submit actually produces
    // (see submitReport's isFirstSubmission below), so a fresh Draft
    // doesn't show a version number that no submission will ever use.
    report.majorVersion = 1;
    report.minorVersion = 0;
    this.applyGeneralFields(report, dto);
    // Sensible empty defaults so the detail page has something to render
    // before the sections are filled in — mirrors the shape the old
    // per-CA generateDraft pre-populated, minus anything CA-specific.
    if (report.participationDemonstration === undefined) {
      report.participationDemonstration = {
        isPartyToParisAgreement: true,
        hasNDC: true,
        hasTrackingArrangements: true,
        hasAuthorizationArrangements: true,
        countryCode: this.hostCountry,
      };
    }
    if (report.itmoMetrics === undefined) {
      report.itmoMetrics = { primaryMetric: "tCO2e", nonGhgMetrics: [] };
    }
    if (report.environmentalIntegrity === undefined) {
      report.environmentalIntegrity = {
        noNetIncrease: "",
        conservativeBaselines: "",
        nonPermanenceRisk: "",
        leakageRisk: "",
      };
    }
    report.caMethodDescription = report.caMethodDescription ?? "";
    report.sectors = report.sectors ?? [];
    report.createdTime = now;
    report.updatedTime = now;

    let saved: InitialReport;
    try {
      saved = await this.initialReportRepo.save(report);
    } catch (error: any) {
      // Backstop against a concurrent generate racing this one for the
      // same period — the upfront check above is TOCTOU, the partial
      // unique index on (ndcStartYear, ndcEndYear) is what actually
      // guarantees it.
      if (this.isUniqueViolation(error)) {
        await this.assertPeriodAvailable(dto.ndcStartYear, dto.ndcEndYear);
      }
      throw error;
    }
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    const resp = await this.initialReportRepo
      .createQueryBuilder("initial_report")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "initial_report",
            abilityCondition
          ),
          "initial_report"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"initial_report".${this.helperService.generateSortCol(
            query?.sort?.key
          )}`,
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

  private async getReportOrFail(reportNumber: string): Promise<InitialReport> {
    const report = await this.initialReportRepo.findOneBy({ reportNumber });
    if (!report) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("initialReport.notFound", []),
        HttpStatus.NOT_FOUND
      );
    }
    return report;
  }

  private async getLiveLinks(
    reportNumber: string
  ): Promise<InitialReportCooperativeApproach[]> {
    return this.linkRepo.find({
      where: { reportNumber, removedInMajor: IsNull() },
      order: { createdTime: "ASC" },
    });
  }

  // The version the next submit will mint. Single source of truth for
  // both the pending-version label the detail page renders on its draft
  // row and the numbers submitReport actually writes — deriving it
  // separately in the browser would let the UI promise v3.0 while the
  // server files v2.1.
  private computeNextVersion(
    report: InitialReport,
    versionCount: number,
    anyNewlyAdded: boolean
  ): { majorVersion: number; minorVersion: number } {
    if (versionCount === 0) return { majorVersion: 1, minorVersion: 0 };
    if (anyNewlyAdded)
      return { majorVersion: report.majorVersion + 1, minorVersion: 0 };
    return {
      majorVersion: report.majorVersion,
      minorVersion: report.minorVersion + 1,
    };
  }

  // The live report plus its currently-linked cooperative approaches —
  // what the detail page renders for the working draft/latest filing.
  async getById(reportNumber: string): Promise<DataResponseDto> {
    const report = await this.getReportOrFail(reportNumber);
    const links = await this.getLiveLinks(reportNumber);
    const approachIds = links.map((l) => l.cooperativeApproachId);

    // Each link's current authorized entities — not just what a frozen
    // version's snapshot captured at submit time. An entity added to an
    // approach after it was already filed (an amendment, still Draft
    // submissionStatus — see addAuthorizedEntity) has no version to
    // show up in yet, so this live view is the only place it's visible
    // at all until that filing path exists.
    const entities = approachIds.length
      ? await this.authorizedEntityRepo.find({
          where: { cooperativeApproachId: In(approachIds) },
        })
      : [];

    // Same problem for the approach's own scalar fields (title,
    // participating parties, ...): link.cooperativeApproachDetails is
    // frozen at the moment addCooperativeApproach ran, same as the
    // entity set was. Overlay the live CooperativeApproach row here
    // too, so an edit made after linking shows up on the still-open
    // draft rather than only in whatever gets filed next.
    const liveApproaches = approachIds.length
      ? await this.cooperativeApproachRepo.find({
          where: { cooperativeApproachId: In(approachIds) },
        })
      : [];

    const cooperativeApproaches = links.map((link) => {
      const liveApproach = liveApproaches.find(
        (a) => a.cooperativeApproachId === link.cooperativeApproachId
      );
      return {
        ...link,
        cooperativeApproachDetails: liveApproach
          ? this.snapshotApproach(liveApproach)
          : link.cooperativeApproachDetails,
        authorizedEntities: entities.filter(
          (e) => e.cooperativeApproachId === link.cooperativeApproachId
        ),
      };
    });

    const versionCount = await this.versionRepo.count({
      where: { reportNumber },
    });
    // Whether a NEW cooperative approach is waiting to be filed for the
    // first time — this is what forces a MAJOR bump (matches
    // submitReport's own `anyNewlyAdded`, which is keyed the same way).
    // submitReport's `anyNewlyAdded` additionally requires the approach
    // to still be CA-status Draft, which isn't worth a second query
    // here: addCooperativeApproach refuses non-Draft approaches and
    // nothing else moves a linked approach out of Draft outside
    // submitReport's own loop, and the mismatch branch throws rather
    // than filing — so this is accurate whenever a submit would
    // succeed at all.
    const hasNewApproach = links.some((link) => link.addedInMajor == null);

    // Whether there is ANYTHING to submit — broader than hasNewApproach.
    // An authorized entity can be added to an approach that's already
    // been filed (an amendment, still submissionStatus Draft — see
    // addAuthorizedEntity), which doesn't touch any link's addedInMajor
    // at all but is still a real pending change: submitReport carries
    // it into a MINOR-bumped version via flipDraftEntitiesToSubmitted.
    // Exposed as `hasPendingApproachChange` — the frontend uses this to
    // decide whether Submit has anything to file, not to predict
    // major-vs-minor (that's pendingVersion, which stays keyed on
    // hasNewApproach alone).
    const hasPendingApproachChange =
      hasNewApproach ||
      entities.some(
        (e) => e.submissionStatus === AuthorizedEntitySubmissionStatus.DRAFT
      );

    return new DataResponseDto(HttpStatus.OK, {
      ...report,
      cooperativeApproaches,
      versionCount,
      hasPendingApproachChange,
      pendingVersion: this.computeNextVersion(
        report,
        versionCount,
        hasNewApproach
      ),
    });
  }

  async update(
    dto: InitialReportUpdateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const report = await this.getReportOrFail(dto.reportNumber);

    const versionCount = await this.versionRepo.count({
      where: { reportNumber: dto.reportNumber },
    });
    if (versionCount > 0) {
      const changed = TRAJECTORY_FIELD_KEYS.some((key) => {
        const incoming = dto[key];
        if (incoming === undefined) return false;
        const current = report[key];
        // decimal columns come back as strings; normalize both sides
        // through Number() rather than risk a string/number mismatch
        // false-positive. ndcType/caMethod stay plain string compares.
        return typeof current === "number" || typeof incoming === "number"
          ? Number(incoming) !== Number(current)
          : incoming !== current;
      });
      if (changed) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "initialReport.trajectoryFieldsLocked",
            [dto.reportNumber]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    await this.assertPeriodAvailable(
      dto.ndcStartYear ?? report.ndcStartYear,
      dto.ndcEndYear ?? report.ndcEndYear,
      report.reportNumber
    );
    this.assertEmissionTargetValid(
      dto.baseYearEmission ?? report.baseYearEmission,
      dto.ndcTarget ?? report.ndcTarget
    );
    this.applyGeneralFields(report, dto);
    // The report is mutable in place; a Submitted filing simply reopens
    // as a Draft the moment it is touched again. The next submit becomes
    // whatever version the link-set changes dictate.
    if (report.status === InitialReportStatus.SUBMITTED) {
      report.status = InitialReportStatus.DRAFT;
    }
    report.updatedTime = new Date().getTime();

    let saved: InitialReport;
    try {
      saved = await this.initialReportRepo.save(report);
    } catch (error: any) {
      if (this.isUniqueViolation(error)) {
        await this.assertPeriodAvailable(
          report.ndcStartYear,
          report.ndcEndYear,
          report.reportNumber
        );
      }
      throw error;
    }
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  /**
   * Discards the current Draft state. What that means depends on
   * whether anything has ever actually been filed:
   *
   *  - Never submitted (no InitialReportVersion rows exist): there is
   *    nothing to preserve, so the whole report — and any cooperative
   *    approach links on it, none of which have been filed either — is
   *    deleted outright. This frees the NDC period for a fresh Generate.
   *
   *  - Reopened (it WAS Submitted, then touched again — an edit, or an
   *    approach added/removed): deleting the report would destroy real
   *    filed history, so instead this reverts the live row back to
   *    exactly what the last submitted version's snapshot recorded, and
   *    flips status back to Submitted. Any approach link added since
   *    that submit (addedInMajor still null — never itself filed) is
   *    removed; nothing else needs undoing, because
   *    removeCooperativeApproach can only ever remove a link in that
   *    same still-pending state to begin with.
   */
  async discardDraft(
    reportNumber: string,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const report = await this.getReportOrFail(reportNumber);
    if (report.status !== InitialReportStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notDraft",
          [report.reportNumber, report.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const versionCount = await this.versionRepo.count({
      where: { reportNumber },
    });

    if (versionCount === 0) {
      await this.linkRepo.delete({ reportNumber });
      await this.initialReportRepo.delete({ reportNumber });
      return new DataResponseDto(HttpStatus.OK, {
        reportNumber,
        deleted: true,
      });
    }

    const lastVersion = await this.versionRepo.findOneBy({
      reportNumber,
      majorVersion: report.majorVersion,
      minorVersion: report.minorVersion,
    });
    if (!lastVersion) {
      // Should be unreachable: majorVersion/minorVersion are only ever
      // set to a version's own numbers, at the moment that version is
      // written, in the same transaction (submitReport). Guard anyway
      // rather than reverting to fields that don't exist.
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.versionNotFound",
          [reportNumber, `${report.majorVersion}.${report.minorVersion}`]
        ),
        HttpStatus.NOT_FOUND
      );
    }

    await this.linkRepo.delete({ reportNumber, addedInMajor: IsNull() });

    const general = lastVersion.snapshot.general;
    for (const key of GENERAL_FIELD_KEYS) {
      (report as any)[key] = general[key];
    }
    report.status = InitialReportStatus.SUBMITTED;
    report.updatedTime = new Date().getTime();

    const saved = await this.initialReportRepo.save(report);
    return new DataResponseDto(HttpStatus.OK, {
      reportNumber,
      deleted: false,
      report: saved,
    });
  }

  // ------------------------------------------------------------------
  // Cooperative approaches on the report
  // ------------------------------------------------------------------

  private snapshotApproach(approach: CooperativeApproach) {
    return {
      title: approach.title,
      hostParty: approach.hostParty,
      participatingParties: approach.participatingParties,
      description: approach.description,
      startDate: approach.startDate,
      endDate: approach.endDate,
      expectedMitigationOutcomes: approach.expectedMitigationOutcomes,
      environmentalIntegrityAssessment: approach.environmentalIntegrityAssessment,
      caReferenceNumber: approach.caReferenceNumber,
    };
  }

  async addCooperativeApproach(
    dto: InitialReportCooperativeApproachDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const report = await this.getReportOrFail(dto.reportNumber);
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (!approach) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.cooperativeApproachNotFound",
          [dto.cooperativeApproachId]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    // Approaches are submitted as part of a filing, so the set is fixed
    // once an approach leaves Draft — mirrors the Draft-gate on adding
    // authorized entities to the approach itself.
    if (approach.status !== CooperativeApproachStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.approachNotDraft",
          [dto.cooperativeApproachId, approach.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const existingLink = await this.linkRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (existingLink) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.approachAlreadyLinked",
          [dto.cooperativeApproachId, existingLink.reportNumber]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const link = new InitialReportCooperativeApproach();
    link.reportNumber = dto.reportNumber;
    link.cooperativeApproachId = dto.cooperativeApproachId;
    link.addedInMajor = null;
    link.cooperativeApproachDetails = this.snapshotApproach(approach);

    if (report.status === InitialReportStatus.SUBMITTED) {
      report.status = InitialReportStatus.DRAFT;
      report.updatedTime = new Date().getTime();
      await this.initialReportRepo.save(report);
    }

    const saved = await this.linkRepo.save(link);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async removeCooperativeApproach(
    dto: InitialReportCooperativeApproachDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const link = await this.linkRepo.findOneBy({
      reportNumber: dto.reportNumber,
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (!link) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.approachLinkNotFound",
          [dto.cooperativeApproachId, dto.reportNumber]
        ),
        HttpStatus.NOT_FOUND
      );
    }
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    // Once an approach has been through a submit it has a minted
    // caReferenceNumber and flipped authorized-entity rows — both
    // irreversible — so its link must be too. CA-status Draft is the
    // signal: an approach can only ever leave Draft via markSubmitted.
    if (approach && approach.status !== CooperativeApproachStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.approachNotRemovable",
          [dto.cooperativeApproachId, approach.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    await this.linkRepo.delete({ id: link.id });
    return new DataResponseDto(HttpStatus.OK, link);
  }

  // ------------------------------------------------------------------
  // Submission
  // ------------------------------------------------------------------

  private buildMissingFields(report: InitialReport): string[] {
    return SUBMIT_REQUIRED_FIELD_KEYS.filter((key) => {
      const value = (report as any)[key];
      if (Array.isArray(value)) return value.length === 0;
      return value === undefined || value === null || value === "";
    });
  }

  async submitReport(
    reportNumber: string,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const report = await this.getReportOrFail(reportNumber);

    const missing = this.buildMissingFields(report);
    if (missing.length > 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("initialReport.incomplete", [
          missing.join(", "),
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    // MultiYear NDCs are not supported yet — the field and enum value
    // are kept so enabling it later needs no schema change, but the
    // trajectory this service writes only knows how to interpolate a
    // single-year target.
    if (report.ndcType === NdcType.MULTI_YEAR) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.multiYearNotSupported",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    // Same rule the corresponding-adjustment calculation enforces —
    // catching an incompatible pairing here means a report can never be
    // filed with a caMethod its own ndcType would reject downstream.
    if (!isNdcMethodCompatible(report.ndcType, report.caMethod)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.methodNotCompatibleWithNdcType",
          [report.caMethod, report.ndcType]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const trajectoryProblems = validateNdcTrajectory({
      ndcStartYear: report.ndcStartYear,
      ndcEndYear: report.ndcEndYear,
      baseYear: report.baseYear,
      targetYear: report.ndcEndYear,
    });
    if (trajectoryProblems.length > 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.invalidNdcPeriod",
          [trajectoryProblems.join(", ")]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const liveLinks = await this.getLiveLinks(reportNumber);
    if (liveLinks.length === 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.noCooperativeApproach",
          [reportNumber]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    // The base-year emission is collected directly on the report (see
    // the entity comment) — buildMissingFields above already guarantees
    // it's set by this point, so filing never depends on someone having
    // entered a separate Emission record for that year first.
    const baseYearEmission = Number(report.baseYearEmission);

    const saved = await this.initialReportRepo.manager.transaction(
      async (manager) => {
        // Ordered lock so two concurrent submits touching overlapping
        // approaches cannot deadlock against each other.
        const lockedLinks = await manager
          .getRepository(InitialReportCooperativeApproach)
          .createQueryBuilder("link")
          .setLock("pessimistic_write")
          .where("link.reportNumber = :reportNumber", { reportNumber })
          .andWhere("link.removedInMajor IS NULL")
          .orderBy("link.cooperativeApproachId", "ASC")
          .getMany();

        let anyNewlyAdded = false;
        const approachSnapshots: any[] = [];

        for (const link of lockedLinks) {
          const approach = await manager
            .getRepository(CooperativeApproach)
            .findOneBy({ cooperativeApproachId: link.cooperativeApproachId });
          if (!approach) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "initialReport.approachNotFound",
                [link.cooperativeApproachId]
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          if (approach.status === CooperativeApproachStatus.DRAFT) {
            anyNewlyAdded = anyNewlyAdded || link.addedInMajor == null;
            await this.cooperativeApproachService.markSubmitted(
              link.cooperativeApproachId,
              manager
            );
          } else if (link.addedInMajor == null) {
            // Should be unreachable: addCooperativeApproach only links
            // Draft approaches, and nothing else can move a linked
            // approach out of Draft except this loop. Guard anyway
            // rather than silently filing an approach with no
            // caReferenceNumber.
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "initialReport.approachNotDraft",
                [link.cooperativeApproachId, approach.status]
              ),
              HttpStatus.BAD_REQUEST
            );
          } else {
            // Already filed in an earlier version, so it won't go
            // through markSubmitted again (that only fires for
            // approaches still Draft). But an authorized entity can be
            // added to it afterward as an amendment (still Draft
            // submissionStatus — see
            // CooperativeApproachService.addAuthorizedEntity), and this
            // resubmission is exactly the moment that entity gets
            // carried into a filing.
            await this.cooperativeApproachService.flipDraftEntitiesToSubmitted(
              link.cooperativeApproachId,
              manager,
              new Date().getTime()
            );
          }

          const entities = await manager
            .getRepository(CaAuthorizedEntity)
            .find({ where: { cooperativeApproachId: link.cooperativeApproachId } });

          approachSnapshots.push({
            cooperativeApproachId: link.cooperativeApproachId,
            addedInMajor: link.addedInMajor,
            details: this.snapshotApproach(approach),
            authorizedEntities: entities,
          });
        }

        // Same rule getById exposes as pendingVersion — see
        // computeNextVersion. Determined by version-row existence
        // rather than by comparing against a magic baseline, so the
        // pre-submit majorVersion/minorVersion (just a display
        // placeholder set at generateDraft) is free to be whatever
        // reads best.
        const versionCount = await manager
          .getRepository(InitialReportVersion)
          .count({ where: { reportNumber } });
        const { majorVersion: newMajor, minorVersion: newMinor } =
          this.computeNextVersion(report, versionCount, anyNewlyAdded);

        // Tracked explicitly (rather than inferred later by comparing
        // addedInMajor against newMajor) because on a pure minor bump
        // newMajor equals the report's already-stamped major, so that
        // comparison would coincidentally match an approach added in a
        // PREVIOUS submission and misreport it as having changed here.
        const newlyStampedApproachIds: string[] = [];
        if (anyNewlyAdded) {
          for (const link of lockedLinks) {
            if (link.addedInMajor == null) {
              link.addedInMajor = newMajor;
              await manager.save(link);
              newlyStampedApproachIds.push(link.cooperativeApproachId);
              // approachSnapshots was built above, before this stamp —
              // patch its copy too so the frozen snapshot doesn't
              // permanently record "never added" for an approach that
              // was, in fact, just added in this very version.
              const snapshotEntry = approachSnapshots.find(
                (s) => s.cooperativeApproachId === link.cooperativeApproachId
              );
              if (snapshotEntry) snapshotEntry.addedInMajor = newMajor;
            }
          }
        }

        // Claim (or create) the ndc_details_period row for this span.
        // UNIQUE (ndcStartYear, ndcEndYear, country) on ndc_target and
        // the UNIQUE ndcPeriodId on initial_report are what actually
        // enforce "one report per NDC period" — this just resolves the
        // id to store.
        let period = await manager.getRepository(NdcDetailsPeriod).findOne({
          where: {
            startYear: report.ndcStartYear,
            endYear: report.ndcEndYear,
            deleted: false,
          },
        });
        if (!period) {
          period = manager.getRepository(NdcDetailsPeriod).create({
            startYear: report.ndcStartYear,
            endYear: report.ndcEndYear,
            finalized: false,
            deleted: false,
          });
          period = await manager.getRepository(NdcDetailsPeriod).save(period);
        }
        report.ndcPeriodId = period.id;

        // Upsert the single ndc_target row for this period. The report
        // is the source of truth once submitted — a later resubmit
        // overwrites the same row rather than accumulating history,
        // matching the "adopt and overwrite" rule for filed data.
        let ndcTarget = await manager.getRepository(NdcTarget).findOne({
          where: {
            ndcStartYear: report.ndcStartYear,
            ndcEndYear: report.ndcEndYear,
            country: this.hostCountry,
          },
        });
        if (!ndcTarget) {
          ndcTarget = manager.getRepository(NdcTarget).create({
            country: this.hostCountry,
            ndcStartYear: report.ndcStartYear,
            ndcEndYear: report.ndcEndYear,
          });
        }
        ndcTarget.ndcType = NdcType.SINGLE_YEAR;
        ndcTarget.baseYear = report.baseYear;
        ndcTarget.baseYearEmission = baseYearEmission;
        ndcTarget.targetYear = report.ndcEndYear;
        ndcTarget.ndcTarget = report.ndcTarget;
        ndcTarget.sourceReportNumber = report.reportNumber;
        ndcTarget.updatedAt = new Date();
        if (!ndcTarget.createdAt) ndcTarget.createdAt = new Date();
        try {
          await manager.getRepository(NdcTarget).save(ndcTarget);
        } catch (error: any) {
          if (error?.code === "23505") {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "initialReport.periodAlreadyClaimed",
                [String(report.ndcStartYear), String(report.ndcEndYear)]
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          throw error;
        }

        // Freeze the whole filing.
        const version = new InitialReportVersion();
        version.reportNumber = report.reportNumber;
        version.majorVersion = newMajor;
        version.minorVersion = newMinor;
        version.changedCooperativeApproachId =
          newlyStampedApproachIds.length === 1
            ? newlyStampedApproachIds[0]
            : null;
        version.submittedBy = user?.id ? String(user.id) : undefined;
        version.submittedTime = new Date().getTime();
        version.snapshot = {
          general: {
            ndcStartYear: report.ndcStartYear,
            ndcEndYear: report.ndcEndYear,
            ndcType: report.ndcType,
            baseYear: report.baseYear,
            baseYearEmission: report.baseYearEmission,
            ndcTarget: report.ndcTarget,
            caMethod: report.caMethod,
            caMethodDescription: report.caMethodDescription,
            sectors: report.sectors,
            participationDemonstration: report.participationDemonstration,
            itmoMetrics: report.itmoMetrics,
            environmentalIntegrity: report.environmentalIntegrity,
          },
          cooperativeApproaches: approachSnapshots,
        };

        try {
          await manager.getRepository(InitialReportVersion).save(version);
        } catch (error: any) {
          if (error?.code === "23505") {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "initialReport.periodAlreadyClaimed",
                [String(report.ndcStartYear), String(report.ndcEndYear)]
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          throw error;
        }

        report.status = InitialReportStatus.SUBMITTED;
        report.majorVersion = newMajor;
        report.minorVersion = newMinor;
        report.updatedTime = new Date().getTime();
        try {
          return await manager.getRepository(InitialReport).save(report);
        } catch (error: any) {
          if (error?.code === "23505") {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "initialReport.periodAlreadyClaimed",
                [String(report.ndcStartYear), String(report.ndcEndYear)]
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          throw error;
        }
      }
    );

    return new DataResponseDto(HttpStatus.OK, saved);
  }

  /**
   * Has this cooperative approach ever been part of a submitted initial
   * report. Consumed by the programme authorize gate
   * (programme.service.ts), which requires a submitted report before an
   * Article 6 programme under this approach can be authorized.
   */
  async hasSubmittedReport(cooperativeApproachId: string): Promise<boolean> {
    const link = await this.linkRepo.findOneBy({ cooperativeApproachId });
    return !!link && link.addedInMajor != null;
  }

  // Widened beyond the entity's own columns for the versions table: a
  // per-row cooperative-approach count and the submitter's display
  // name. Deliberately raw SQL rather than returning the full snapshot
  // for client-side counting — snapshot.cooperativeApproaches embeds
  // each approach's full authorized-entity set, so a mature report's
  // snapshots are easily hundreds of KB each; this needs one integer
  // per row instead. getRawMany() returns submittedTime and
  // cooperativeApproachCount as STRINGS (bigint/int8 marshalling) —
  // callers must Number(...) both.
  async getVersions(reportNumber: string): Promise<DataResponseDto> {
    const versions = await this.versionRepo
      .createQueryBuilder("version")
      // Text comparison, not an int cast on submittedBy: it's nullable
      // text, and a cast on a non-numeric legacy value would raise
      // 22P02 and kill the whole query rather than just fail to match.
      .leftJoin(User, "submitter", 'submitter.id::text = version."submittedBy"')
      .select([
        'version.id AS "id"',
        'version."majorVersion" AS "majorVersion"',
        'version."minorVersion" AS "minorVersion"',
        'version."submittedTime" AS "submittedTime"',
        'version."changedCooperativeApproachId" AS "changedCooperativeApproachId"',
        'version."submittedBy" AS "submittedBy"',
        'submitter.name AS "submittedByName"',
        `CASE WHEN jsonb_typeof(version.snapshot -> 'cooperativeApproaches') = 'array'
              THEN jsonb_array_length(version.snapshot -> 'cooperativeApproaches')
              ELSE 0 END AS "cooperativeApproachCount"`,
        // Just the ids, not the full snapshot entries (which carry
        // every approach's authorized-entity set) — enough for the
        // versions table to render them as pills without the payload
        // cost the class comment above warns about.
        `(SELECT COALESCE(jsonb_agg(elem ->> 'cooperativeApproachId'), '[]'::jsonb)
            FROM jsonb_array_elements(version.snapshot -> 'cooperativeApproaches') elem
         ) AS "cooperativeApproachIds"`,
      ])
      .where('version."reportNumber" = :reportNumber', { reportNumber })
      .orderBy('version."majorVersion"', "DESC")
      .addOrderBy('version."minorVersion"', "DESC")
      .getRawMany();
    return new DataResponseDto(HttpStatus.OK, versions);
  }

  async getVersion(
    reportNumber: string,
    majorVersion: number,
    minorVersion: number
  ): Promise<DataResponseDto> {
    const version = await this.versionRepo.findOneBy({
      reportNumber,
      majorVersion,
      minorVersion,
    });
    if (!version) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.versionNotFound",
          [reportNumber, `${majorVersion}.${minorVersion}`]
        ),
        HttpStatus.NOT_FOUND
      );
    }
    // submittedBy is a bare user id string; resolve a display name the
    // same way getVersions does, but as a single lookup since this is
    // already a single-row fetch — no need for the raw-SQL join here,
    // and findOneBy above must keep returning `snapshot` as a parsed
    // object rather than going through getRawMany().
    let submittedByName: string | undefined;
    const submitterId = Number(version.submittedBy);
    if (version.submittedBy && !Number.isNaN(submitterId)) {
      const submitter = await this.userRepo.findOne({
        where: { id: submitterId },
      });
      submittedByName = submitter?.name;
    }
    return new DataResponseDto(HttpStatus.OK, { ...version, submittedByName });
  }
}
