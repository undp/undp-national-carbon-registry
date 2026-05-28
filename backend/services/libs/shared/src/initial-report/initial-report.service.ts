import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { InitialReport } from "../entities/initial.report.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { InitialReportStatus } from "../enum/initial.report.status.enum";
import { InitialReportCreateDto } from "../dto/initial.report.create.dto";
import { InitialReportUpdateDto } from "../dto/initial.report.update.dto";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { User } from "../entities/user.entity";

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

  async generateDraft(
    dto: InitialReportCreateDto,
    user: User
  ): Promise<DataResponseDto> {
    // Verify cooperative approach exists
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

    // Check if an initial report already exists for this cooperative approach
    const existing = await this.initialReportRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (existing) {
      throw new HttpException(
        "An initial report already exists for this cooperative approach. Use update instead.",
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

  async update(
    dto: InitialReportUpdateDto,
    user: User
  ): Promise<DataResponseDto> {
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

    if (report.status === InitialReportStatus.PUBLISHED) {
      throw new HttpException(
        "Published initial reports cannot be modified.",
        HttpStatus.BAD_REQUEST
      );
    }

    if (dto.participationDemonstration !== undefined)
      report.participationDemonstration = dto.participationDemonstration;
    if (dto.itmoMetrics !== undefined) report.itmoMetrics = dto.itmoMetrics;
    if (dto.caMethodDescription !== undefined)
      report.caMethodDescription = dto.caMethodDescription;
    if (dto.ndcQuantification !== undefined)
      report.ndcQuantification = dto.ndcQuantification;
    if (dto.cooperativeApproachDetails !== undefined)
      report.cooperativeApproachDetails = dto.cooperativeApproachDetails;
    if (dto.environmentalIntegrity !== undefined)
      report.environmentalIntegrity = dto.environmentalIntegrity;

    report.updatedTime = new Date().getTime();

    const saved = await this.initialReportRepo.save(report);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  async submitReport(reportId: string, user: User): Promise<DataResponseDto> {
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

    // Validate completeness
    const missing: string[] = [];
    if (!report.participationDemonstration) missing.push("participationDemonstration");
    if (!report.itmoMetrics) missing.push("itmoMetrics");
    if (!report.ndcQuantification) missing.push("ndcQuantification");
    if (!report.cooperativeApproachDetails) missing.push("cooperativeApproachDetails");
    if (!report.environmentalIntegrity) missing.push("environmentalIntegrity");

    if (missing.length > 0) {
      throw new HttpException(
        `Initial report is incomplete. Missing sections: ${missing.join(", ")}`,
        HttpStatus.BAD_REQUEST
      );
    }

    report.status = InitialReportStatus.SUBMITTED;
    report.updatedTime = new Date().getTime();

    const saved = await this.initialReportRepo.save(report);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  /**
   * Check if a submitted initial report exists for a cooperative approach.
   * Used as a guard before first ITMO authorization.
   */
  async hasSubmittedReport(cooperativeApproachId: string): Promise<boolean> {
    const report = await this.initialReportRepo.findOneBy({
      cooperativeApproachId,
      status: InitialReportStatus.SUBMITTED,
    });
    return !!report;
  }
}
