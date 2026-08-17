import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { InitialReport } from "../entities/initial.report.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { InitialReportStatus } from "../enum/initial.report.status.enum";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { InitialReportCreateDto } from "../dto/initial.report.create.dto";
import { InitialReportUpdateDto } from "../dto/initial.report.update.dto";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { User } from "../entities/user.entity";

// Restricts the query to the latest version per cooperative approach —
// older rows are edit history browsed through /initialReport/versions.
const LATEST_VERSION_PREDICATE = `("initial_report"."cooperativeApproachId", "initial_report"."version") IN (
  SELECT ir2."cooperativeApproachId", MAX(ir2."version")
  FROM initial_report ir2
  GROUP BY ir2."cooperativeApproachId"
)`;

@Injectable()
export class InitialReportService {
  constructor(
    @InjectRepository(InitialReport)
    private initialReportRepo: Repository<InitialReport>,
    @InjectRepository(CooperativeApproach)
    private cooperativeApproachRepo: Repository<CooperativeApproach>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly configService: ConfigService
  ) {}

  // Initial reports are managed by the government (DNA) Admin / Root
  // only — mirrors the retirement-action permission pattern.
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

  async generateDraft(
    dto: InitialReportCreateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (!approach) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.cooperativeApproachNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    // Initial reports can only be created for Draft cooperative
    // approaches — an Active/terminal CA already went through (or can
    // no longer go through) the reporting step.
    if (approach.status !== CooperativeApproachStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.caNotDraft",
          [dto.cooperativeApproachId, approach.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    // One logical report per cooperative approach: edits create new
    // versions of the existing report, never a second report.
    const existing = await this.initialReportRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (existing) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.alreadyExists",
          [dto.cooperativeApproachId]
        ),
        HttpStatus.CONFLICT
      );
    }

    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.INITIAL_REPORT,
      3
    );

    const report = new InitialReport();
    report.reportId = `IR-${id}`;
    report.cooperativeApproachId = dto.cooperativeApproachId;
    report.version = 1;
    report.status = InitialReportStatus.DRAFT;

    // Pre-populate from cooperative approach if fields not provided
    report.participationDemonstration = dto.participationDemonstration || {
      isPartyToParisAgreement: true,
      hasNDC: true,
      hasTrackingArrangements: true,
      hasAuthorizationArrangements: true,
      countryCode: this.configService.get("systemCountry"),
    };

    report.itmoMetrics = dto.itmoMetrics || {
      primaryMetric: "tCO2e",
      nonGhgMetrics: [],
    };

    report.caMethodDescription = dto.caMethodDescription || "";

    report.ndcQuantification = dto.ndcQuantification || {
      ndcTarget: null,
      baseYear: null,
      targetYear: null,
      sectors: [],
      ghgs: ["CO2"],
    };

    report.cooperativeApproachDetails = dto.cooperativeApproachDetails || {
      title: approach.title,
      participatingParties: approach.participatingParties,
      description: approach.description,
      duration: {
        startDate: approach.startDate,
        endDate: approach.endDate,
      },
      expectedMitigation: approach.expectedMitigationOutcomes,
    };

    report.environmentalIntegrity = dto.environmentalIntegrity || {
      noNetIncrease: approach.environmentalIntegrityAssessment || "",
      conservativeBaselines: "",
      nonPermanenceRisk: "",
      leakageRisk: "",
    };

    report.createdTime = now;
    report.updatedTime = now;

    const saved = await this.initialReportRepo.save(report);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    const baseWhere = this.helperService.generateWhereSQL(
      query,
      this.helperService.parseMongoQueryToSQLWithTable(
        "initial_report",
        abilityCondition
      ),
      "initial_report"
    );
    const qb = this.initialReportRepo.createQueryBuilder("initial_report");
    if (baseWhere) {
      qb.where(baseWhere).andWhere(LATEST_VERSION_PREDICATE);
    } else {
      qb.where(LATEST_VERSION_PREDICATE);
    }
    const resp = await qb
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

  async getById(reportId: string): Promise<DataResponseDto> {
    const report = await this.initialReportRepo.findOneBy({ reportId });
    if (!report) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    return new DataResponseDto(HttpStatus.OK, report);
  }

  // All versions of a cooperative approach's report, newest first —
  // feeds the version dropdown on the detail page.
  async getVersions(
    cooperativeApproachId: string
  ): Promise<DataResponseDto> {
    const versions = await this.initialReportRepo.find({
      where: { cooperativeApproachId },
      select: ["reportId", "version", "status", "createdTime"],
      order: { version: "DESC" },
    });
    return new DataResponseDto(HttpStatus.OK, versions);
  }

  /**
   * Append-only edit: saves the changes as a NEW version row (copying
   * the latest version and overlaying the editable sections) so every
   * edit stays auditable. The linked cooperative approach is never
   * taken from the DTO. Returns the newly created row.
   */
  async update(
    dto: InitialReportUpdateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const report = await this.initialReportRepo.findOneBy({
      reportId: dto.reportId,
    });
    if (!report) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }

    const latest = await this.getLatestVersion(report.cooperativeApproachId);
    if (latest.reportId !== report.reportId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notLatestVersion",
          [report.reportId, latest.reportId]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (latest.status !== InitialReportStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notEditable",
          [latest.reportId, latest.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.INITIAL_REPORT,
      3
    );

    const newVersion = new InitialReport();
    newVersion.reportId = `IR-${id}`;
    newVersion.cooperativeApproachId = latest.cooperativeApproachId;
    newVersion.version = latest.version + 1;
    newVersion.status = InitialReportStatus.DRAFT;
    newVersion.participationDemonstration =
      dto.participationDemonstration !== undefined
        ? dto.participationDemonstration
        : latest.participationDemonstration;
    newVersion.itmoMetrics =
      dto.itmoMetrics !== undefined ? dto.itmoMetrics : latest.itmoMetrics;
    newVersion.caMethodDescription =
      dto.caMethodDescription !== undefined
        ? dto.caMethodDescription
        : latest.caMethodDescription;
    newVersion.ndcQuantification =
      dto.ndcQuantification !== undefined
        ? dto.ndcQuantification
        : latest.ndcQuantification;
    newVersion.cooperativeApproachDetails =
      dto.cooperativeApproachDetails !== undefined
        ? dto.cooperativeApproachDetails
        : latest.cooperativeApproachDetails;
    newVersion.environmentalIntegrity =
      dto.environmentalIntegrity !== undefined
        ? dto.environmentalIntegrity
        : latest.environmentalIntegrity;
    newVersion.generatedDocumentUrl = latest.generatedDocumentUrl;
    newVersion.createdTime = now;
    newVersion.updatedTime = now;

    const saved = await this.initialReportRepo.save(newVersion);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async submitReport(reportId: string, user: User): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const report = await this.initialReportRepo.findOneBy({ reportId });
    if (!report) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    if (report.status !== InitialReportStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notEditable",
          [report.reportId, report.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    // Only the latest version of a report can be submitted.
    const latest = await this.getLatestVersion(report.cooperativeApproachId);
    if (latest.reportId !== report.reportId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notLatestVersion",
          [report.reportId, latest.reportId]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate completeness
    const missing: string[] = [];
    if (!report.participationDemonstration) missing.push("participationDemonstration");
    if (!report.itmoMetrics) missing.push("itmoMetrics");
    if (!report.ndcQuantification) missing.push("ndcQuantification");
    if (!report.cooperativeApproachDetails) missing.push("cooperativeApproachDetails");
    if (!report.environmentalIntegrity) missing.push("environmentalIntegrity");

    if (missing.length > 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.incomplete",
          [missing.join(", ")]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    report.status = InitialReportStatus.SUBMITTED;
    report.updatedTime = new Date().getTime();

    const saved = await this.initialReportRepo.save(report);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  /**
   * Check if a submitted initial report exists for a cooperative
   * approach. Consumed by the CA activation guard and the frontend
   * status-dropdown gating.
   */
  async hasSubmittedReport(cooperativeApproachId: string): Promise<boolean> {
    const report = await this.initialReportRepo.findOneBy({
      cooperativeApproachId,
      status: InitialReportStatus.SUBMITTED,
    });
    return !!report;
  }

  private async getLatestVersion(
    cooperativeApproachId: string
  ): Promise<InitialReport> {
    const latest = await this.initialReportRepo.findOne({
      where: { cooperativeApproachId },
      order: { version: "DESC" },
    });
    if (!latest) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "initialReport.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
    return latest;
  }
}
