import { ActivityStateEnum } from "../enum/activity.state.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { ProjectEntity } from "../entities/projects.entity";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ArrayContains,
  Equal,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { ProjectDataRequestDTO } from "../dto/project-data-request.dto";
import { AuditEntity } from "../entities/audit.entity";
import { ProjectAuditLogType } from "../enum/project.audit.log.type.enum";
import { ProjectSectorEnum } from "../enum/project.sector.enum";
import { User } from "../entities/user.entity";
import { ActivityEntity } from "../entities/activity.entity";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(AuditEntity)
    private readonly auditRepository: Repository<AuditEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>
  ) {}

  async getProjectsData(filters: ProjectDataRequestDTO, user: User) {
    const where: FindOptionsWhere<ProjectEntity> = {};
    if (filters) {
      // add date range filters individually
      if (filters.startDate) {
        where.createTime = MoreThanOrEqual(filters.startDate);
      }
      if (filters.endDate) {
        where.createTime = LessThanOrEqual(filters.endDate);
      }

      // add sector filter
      if (filters.sector) {
        where.sectoralScope = filters.sector;
      }

      // add isMine filter
      if (filters.isMine) {
        if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
          where.companyId = Equal(user.companyId);
        } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
          where.independentCertifiers = ArrayContains([user.companyId]);
        }
      }
    }

    const result = await this.projectRepository.find({ where: where });

    return result;
  }

  async getAllData() {
    const result = await this.projectRepository
      .createQueryBuilder("project")
      .select("COUNT(project.refId)", "totalProjects")
      .addSelect("COALESCE(SUM(project.creditIssued), 0)", "totalCreditsIssued")
      .addSelect(
        "COALESCE(SUM(project.creditRetired), 0)",
        "totalCreditsRetired"
      )
      .getRawOne();

    return {
      totalProjects: parseInt(result.totalProjects) || 0,
      totalCreditsIssued: parseInt(result.totalCreditsIssued) || 0,
      totalCreditsRetired: parseInt(result.totalCreditsRetired) || 0,
    };
  }

  async getPendingActions(user: User) {
    let projectStates: ProjectProposalStage[] = [];
    let activityStates: ActivityStateEnum[] = [];

    switch (user.companyRole) {
      case CompanyRole.DESIGNATED_NATIONAL_AUTHORITY:
        projectStates = [
          ProjectProposalStage.PENDING,
          ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER,
          ProjectProposalStage.VALIDATION_REPORT_SUBMITTED,
        ];
        activityStates = [ActivityStateEnum.VERIFICATION_REPORT_UPLOADED];
        break;

      case CompanyRole.PROJECT_DEVELOPER:
        projectStates = [
          ProjectProposalStage.APPROVED,
          ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER,
          ProjectProposalStage.PDD_REJECTED_BY_DNA,
        ];
        activityStates = [ActivityStateEnum.MONITORING_REPORT_REJECTED];
        break;

      case CompanyRole.INDEPENDENT_CERTIFIER:
        projectStates = [
          ProjectProposalStage.PDD_SUBMITTED,
          ProjectProposalStage.PDD_APPROVED_BY_DNA,
          ProjectProposalStage.VALIDATION_DNA_REJECTED,
        ];
        activityStates = [
          ActivityStateEnum.MONITORING_REPORT_UPLOADED,
          ActivityStateEnum.MONITORING_REPORT_VERIFIED,
          ActivityStateEnum.VERIFICATION_REPORT_REJECTED,
        ];
        break;

      default:
        return [];
    }

    const projectQueryOptions: any = {
      where: {
        projectProposalStage: In(projectStates),
      },
    };

    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      projectQueryOptions.where.companyId = user.companyId;
    } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
      projectQueryOptions.where.independentCertifiers = ArrayContains([
        user.companyId,
      ]);
    }

    const projectResults = await this.projectRepository.find(
      projectQueryOptions
    );

    const activityResults = await this.activityRepo.find({
      where: {
        state: In(activityStates),
      },
    });

    const projectIds = [
      ...new Set(activityResults.map((activity) => activity.projectRefId)),
    ];

    const projectsFromActivitiesQuery: any = {
      where: {
        refId: In(projectIds),
      },
    };

    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      projectsFromActivitiesQuery.where.companyId = user.companyId;
    } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
      projectsFromActivitiesQuery.where.independentCertifiers = ArrayContains([
        user.companyId,
      ]);
    }

    const projectsFromActivities = await this.projectRepository.find(
      projectsFromActivitiesQuery
    );

    const activityMap = new Map();
    activityResults.forEach((activity: ActivityEntity) => {
      if (!activityMap.has(activity.projectRefId)) {
        activityMap.set(activity.projectRefId, []);
      }
      activityMap.get(activity.projectRefId).push(activity);
    });

    projectsFromActivities.forEach((project: ProjectEntity) => {
      const projectActivities = activityMap.get(project.refId) || [];

      if (!project.activities) {
        project.activities = [];
      }

      projectActivities.forEach((activity: ActivityEntity) => {
        const existingActivityIndex = project.activities.findIndex(
          (existingActivity) => existingActivity.refId === activity.refId
        );

        if (existingActivityIndex >= 0) {
          project.activities[existingActivityIndex].state = activity.state;
        } else {
          project.activities.push(activity);
        }
      });
    });

    const allProjects = projectResults.concat(projectsFromActivities);

    return allProjects;
  }

  async getProjectSummary(user: User) {
    const [result] = await this.auditRepository.query(`
        SELECT
          (SELECT COUNT(DISTINCT "refId") 
           FROM audit_entity 
           WHERE "logType" = 'PENDING') 
           AS total_pending_projects,
          (SELECT MAX("createdTime") 
           FROM audit_entity 
           WHERE "logType" = 'PENDING' 
           AND "refId" NOT IN (SELECT "refId" FROM audit_entity WHERE "logType" != 'PENDING')) 
           AS last_pending_project_time,
          (SELECT COALESCE(SUM((data->>'amount')::INTEGER), 0) FROM audit_entity WHERE "logType" = 'CREDITS_ISSUED')
          AS total_credits_issued,
          (SELECT MAX("createdTime") FROM audit_entity WHERE "logType" = 'CREDITS_ISSUED')
          AS last_credit_issued_time,
          (SELECT COALESCE(SUM((data->>'amount')::INTEGER), 0) FROM audit_entity WHERE "logType" = 'RETIRE_APPROVED')
          AS total_credits_retired,
          (SELECT MAX("createdTime") FROM audit_entity WHERE "logType" = 'RETIRE_APPROVED') 
          AS last_retire_approved_time
    `);

    return result;
  }

  async getProjectStatusSummary(
    filters: ProjectDataRequestDTO,
    user: User
  ): Promise<any> {
    const pendingStatuses = [
      ProjectAuditLogType.PENDING,
      ProjectAuditLogType.APPROVED,
      ProjectAuditLogType.PDD_SUBMITTED,
      ProjectAuditLogType.PDD_APPROVED_BY_CERTIFIER,
      ProjectAuditLogType.PDD_APPROVED_BY_DNA,
      ProjectAuditLogType.VALIDATION_REPORT_SUBMITTED,
    ];

    const rejectedStatuses = [
      ProjectAuditLogType.REJECTED,
      ProjectAuditLogType.PDD_REJECTED_BY_CERTIFIER,
      ProjectAuditLogType.PDD_REJECTED_BY_DNA,
      ProjectAuditLogType.VALIDATION_DNA_REJECTED,
    ];

    const allLogTypes = [
      ProjectAuditLogType.PENDING,
      ProjectAuditLogType.REJECTED,
      ProjectAuditLogType.APPROVED,
      ProjectAuditLogType.PDD_SUBMITTED,
      ProjectAuditLogType.PDD_REJECTED_BY_CERTIFIER,
      ProjectAuditLogType.PDD_APPROVED_BY_CERTIFIER,
      ProjectAuditLogType.PDD_REJECTED_BY_DNA,
      ProjectAuditLogType.PDD_APPROVED_BY_DNA,
      ProjectAuditLogType.VALIDATION_REPORT_SUBMITTED,
      ProjectAuditLogType.VALIDATION_DNA_REJECTED,
      ProjectAuditLogType.AUTHORISED,
    ];
    const subQuery = this.auditRepository
      .createQueryBuilder("sub_audit")
      .select("sub_audit.refId", "projectId")
      .addSelect("MAX(sub_audit.createdTime)", "latestTime")
      .where("sub_audit.logType IN (:...logTypes)", {
        logTypes: allLogTypes,
      })
      .groupBy("sub_audit.refId");

    const latestStatusQb = this.auditRepository
      .createQueryBuilder("audit")
      .innerJoin(
        `(${subQuery.getQuery()})`,
        "latest",
        'latest."projectId" = audit.refId AND latest."latestTime" = audit.createdTime'
      )
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId")
      .where("audit.logType IN (:...logTypes)", {
        logTypes: allLogTypes,
      });

    if (filters?.startDate) {
      latestStatusQb.andWhere("audit.createdTime >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      latestStatusQb.andWhere("audit.createdTime <= :endDate", {
        endDate: filters.endDate,
      });
    }

    if (filters?.sector) {
      latestStatusQb.andWhere("project.sectoralScope = :sector", {
        sector: filters.sector,
      });
    }

    if (filters?.isMine) {
      if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
        latestStatusQb.andWhere("project.companyId = :orgId", {
          orgId: user.companyId,
        });
      } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
        latestStatusQb.andWhere(":orgId = ANY(project.independentCertifiers)", {
          orgId: user.companyId,
        });
      }
    }

    const latestAudits = await latestStatusQb.getRawMany();

    let pendingCount = 0;
    let rejectedCount = 0;
    let authorisedCount = 0;
    let lastStatusUpdateTime: number = 0;

    for (const row of latestAudits) {
      const status = row.audit_logType;

      const createdTime = Number(row.audit_createdTime);

      lastStatusUpdateTime = Math.max(lastStatusUpdateTime, createdTime);

      if (pendingStatuses.includes(status)) {
        pendingCount++;
      } else if (rejectedStatuses.includes(status)) {
        rejectedCount++;
      } else if (ProjectAuditLogType.AUTHORISED === status) {
        authorisedCount++;
      }
    }

    return {
      totalProjects: authorisedCount + pendingCount + rejectedCount,
      authorisedCount,
      pendingCount,
      rejectedCount,
      lastStatusUpdateTime: lastStatusUpdateTime || null,
    };
  }

  async getProjectsByStatusDetail(filters: ProjectDataRequestDTO, user: User) {
    const allLogTypes = [
      ProjectAuditLogType.PENDING,
      ProjectAuditLogType.REJECTED,
      ProjectAuditLogType.APPROVED,
      ProjectAuditLogType.PDD_SUBMITTED,
      ProjectAuditLogType.PDD_REJECTED_BY_CERTIFIER,
      ProjectAuditLogType.PDD_APPROVED_BY_CERTIFIER,
      ProjectAuditLogType.PDD_REJECTED_BY_DNA,
      ProjectAuditLogType.PDD_APPROVED_BY_DNA,
      ProjectAuditLogType.VALIDATION_REPORT_SUBMITTED,
      ProjectAuditLogType.VALIDATION_DNA_REJECTED,
      ProjectAuditLogType.AUTHORISED,
    ];

    const subQuery = this.auditRepository
      .createQueryBuilder("sub_audit")
      .select("sub_audit.refId", "projectId")
      .addSelect("MAX(sub_audit.createdTime)", "latestTime")
      .where("sub_audit.logType IN (:...logTypes)", {
        logTypes: allLogTypes,
      })
      .groupBy("sub_audit.refId");

    const latestStatusQb = this.auditRepository
      .createQueryBuilder("audit")
      .innerJoin(
        `(${subQuery.getQuery()})`,
        "latest",
        'latest."projectId" = audit.refId AND latest."latestTime" = audit.createdTime'
      )
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId")
      .select("audit.logType", "logType")
      .addSelect("COUNT(DISTINCT project.refId)", "count")
      .where("audit.logType IN (:...logTypes)", {
        logTypes: allLogTypes,
      });

    if (filters?.startDate) {
      latestStatusQb.andWhere("audit.createdTime >= :startDate", {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      latestStatusQb.andWhere("audit.createdTime <= :endDate", {
        endDate: filters.endDate,
      });
    }
    if (filters?.sector) {
      latestStatusQb.andWhere("project.sectoralScope = :sector", {
        sector: filters.sector,
      });
    }
    if (filters?.isMine) {
      if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
        latestStatusQb.andWhere("project.companyId = :orgId", {
          orgId: user.companyId,
        });
      } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
        latestStatusQb.andWhere(":orgId = ANY(project.independentCertifiers)", {
          orgId: user.companyId,
        });
      }
    }

    latestStatusQb.groupBy("audit.logType");
    const latestResult = await latestStatusQb.getRawMany();

    const formatted: Record<string, number> = {};
    allLogTypes.forEach((logType) => {
      formatted[logType] = 0;
    });

    for (const row of latestResult) {
      formatted[row.logType] = parseInt(row.count, 10);
    }

    return formatted;
  }

  async getProjectCountBySector(
    filters: ProjectDataRequestDTO,
    user: User
  ): Promise<Record<string, number>> {
    const subQuery = this.auditRepository
      .createQueryBuilder("sub_audit")
      .select("sub_audit.refId", "projectId")
      .addSelect("MAX(sub_audit.createdTime)", "latestTime")
      .groupBy("sub_audit.refId");

    const qb = this.auditRepository
      .createQueryBuilder("audit")
      .innerJoin(
        `(${subQuery.getQuery()})`,
        "latest",
        'latest."projectId" = audit.refId AND latest."latestTime" = audit.createdTime'
      )
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId")
      .select("project.sectoralScope", "sector")
      .addSelect("COUNT(DISTINCT project.refId)", "count")
      .groupBy("project.sectoralScope");

    if (filters?.startDate) {
      qb.andWhere("audit.createdTime >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      qb.andWhere("audit.createdTime <= :endDate", {
        endDate: filters.endDate,
      });
    }

    if (filters?.sector) {
      qb.andWhere("project.sectoralScope = :sector", {
        sector: filters.sector,
      });
    }

    if (filters?.isMine) {
      if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
        qb.andWhere("project.companyId = :orgId", {
          orgId: user.companyId,
        });
      } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
        qb.andWhere(":orgId = ANY(project.independentCertifiers)", {
          orgId: user.companyId,
        });
      }
    }

    const result = await qb.getRawMany();

    const response: Record<string, number> = {};
    for (const sectorKey in ProjectSectorEnum) {
      const sectorName = ProjectSectorEnum[sectorKey];
      response[sectorName] = 0;
    }

    for (const row of result) {
      const sector = row.sector ?? "Unknown";
      response[ProjectSectorEnum[sector]] = parseInt(row.count, 10);
    }

    return response;
  }

  async getCreditSummary(
    filters: ProjectDataRequestDTO,
    user: User
  ): Promise<any> {
    const orgId = user.companyId;

    const baseQb = this.auditRepository
      .createQueryBuilder("audit")
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId");

    const buildAmountAndTime = (
      logType: string,
      direction: "toCompanyId" | "fromCompanyId"
    ) => {
      const amountSub = this.auditRepository
        .createQueryBuilder("inner_audit")
        .select(
          `COALESCE(SUM(CAST(inner_audit."data"->>'amount' AS INTEGER)), 0)`
        )
        .where(`inner_audit."logType" = '${logType}'`);

      const timeSub = this.auditRepository
        .createQueryBuilder("inner_audit")
        .select(`MAX(inner_audit."createdTime")`)
        .where(`inner_audit."logType" = '${logType}'`);

      if (filters?.isMine) {
        amountSub.andWhere(
          `(inner_audit."data"->>'${direction}')::int = ${orgId}`
        );
        timeSub.andWhere(
          `(inner_audit."data"->>'${direction}')::int = ${orgId}`
        );
      }

      return { amountSub, timeSub };
    };

    const { amountSub: authorisedAmountSub, timeSub: lastAuthorisedTimeSub } =
      buildAmountAndTime(ProjectAuditLogType.CREDITS_AUTHORISED, "toCompanyId");

    const { amountSub: issuedAmountSub, timeSub: lastIssuedTimeSub } =
      buildAmountAndTime(ProjectAuditLogType.CREDIT_ISSUED, "toCompanyId");

    const { amountSub: transferredAmountSub, timeSub: lastTransferredTimeSub } =
      buildAmountAndTime(
        ProjectAuditLogType.CREDIT_TRANSFERED,
        "fromCompanyId"
      );

    const { amountSub: retiredAmountSub, timeSub: lastRetiredTimeSub } =
      buildAmountAndTime(ProjectAuditLogType.RETIRE_APPROVED, "fromCompanyId");

    baseQb
      .select(`(${authorisedAmountSub.getQuery()})`, "authorisedAmount")
      .addSelect(`(${lastAuthorisedTimeSub.getQuery()})`, "lastAuthorisedTime")
      .addSelect(`(${issuedAmountSub.getQuery()})`, "issuedAmount")
      .addSelect(`(${lastIssuedTimeSub.getQuery()})`, "lastIssuedTime")
      .addSelect(`(${transferredAmountSub.getQuery()})`, "transferredAmount")
      .addSelect(
        `(${lastTransferredTimeSub.getQuery()})`,
        "lastTransferredTime"
      )
      .addSelect(`(${retiredAmountSub.getQuery()})`, "retiredAmount")
      .addSelect(`(${lastRetiredTimeSub.getQuery()})`, "lastRetiredTime");

    if (filters?.startDate) {
      baseQb.andWhere(`audit."createdTime" >= :startDate`, {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      baseQb.andWhere(`audit."createdTime" <= :endDate`, {
        endDate: filters.endDate,
      });
    }

    if (filters?.sector) {
      baseQb.andWhere("project.sectoralScope = :sector", {
        sector: filters.sector,
      });
    }

    if (filters?.isMine) {
      if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
        baseQb.andWhere("project.companyId = :orgId", { orgId });
      } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
        baseQb.andWhere(":orgId = ANY(project.independentCertifiers)", {
          orgId: orgId,
        });
      }
    }

    const [result = {}] = await baseQb.getRawMany();

    return {
      authorisedAmount: parseInt(result.authorisedAmount, 10),
      lastAuthorisedTime: result.lastAuthorisedTime
        ? Number(result.lastAuthorisedTime)
        : null,

      issuedAmount: parseInt(result.issuedAmount, 10),
      lastIssuedTime: result.lastIssuedTime
        ? Number(result.lastIssuedTime)
        : null,

      transferredAmount: parseInt(result.transferredAmount, 10),
      lastTransferredTime: result.lastTransferredTime
        ? Number(result.lastTransferredTime)
        : null,

      retiredAmount: parseInt(result.retiredAmount, 10),
      lastRetiredTime: result.lastRetiredTime
        ? Number(result.lastRetiredTime)
        : null,
    };
  }

  async creditsSummaryByDate(filters: ProjectDataRequestDTO, user: User) {
    const orgId = user.companyId;

    const qb = this.auditRepository
      .createQueryBuilder("audit")
      .select(
        `to_char(to_timestamp(audit."createdTime" / 1000), 'YYYY-MM-DD')`,
        "date"
      )
      .addSelect('audit."logType"', "logType")
      .addSelect(`SUM(CAST(audit."data"->>'amount' AS INTEGER))`, "totalAmount")
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId")
      .where('audit."logType" IN (:...types)', {
        types: [
          ProjectAuditLogType.CREDITS_AUTHORISED,
          ProjectAuditLogType.CREDIT_ISSUED,
          ProjectAuditLogType.CREDIT_TRANSFERED,
          ProjectAuditLogType.RETIRE_APPROVED,
        ],
      });

    if (filters?.startDate) {
      qb.andWhere('audit."createdTime" >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      qb.andWhere('audit."createdTime" <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.sector) {
      qb.andWhere("project.sectoralScope = :sector", {
        sector: filters.sector,
      });
    }

    if (filters?.isMine) {
      if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
        qb.andWhere("project.companyId = :orgId", { orgId });
      } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
        qb.andWhere(":orgId = ANY(project.independentCertifiers)", {
          orgId: orgId,
        });
      }
    }

    qb.groupBy("date").addGroupBy('audit."logType"').orderBy("date", "DESC");

    const results = await qb.getRawMany();

    const pivoted: Record<string, any> = {};

    for (const row of results) {
      const { date, logType, totalAmount } = row;

      if (!pivoted[date]) {
        pivoted[date] = { date };
      }

      pivoted[date][logType] = parseInt(totalAmount, 10);
    }

    return Object.values(pivoted);
  }
}
