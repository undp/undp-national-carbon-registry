import { ActivityStateEnum } from "../enum/activity.state.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { ProjectEntity } from "../entities/projects.entity";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ArrayContains,
  Brackets,
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
import { User } from "../entities/user.entity";
import { ActivityEntity } from "../entities/activity.entity";
import { InfSectoralScopeEnum } from "../enum/inf.sectoral.scope.enum";
import { InfSectorEnum } from "../enum/inf.sector.enum";

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
        where.sector = filters.sector;
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
      .addSelect("COALESCE(SUM(project.creditRetired), 0)", "totalCreditsRetired")
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
      projectQueryOptions.where.independentCertifiers = ArrayContains([user.companyId]);
    }

    const projectResults = await this.projectRepository.find(projectQueryOptions);

    const activityResults = await this.activityRepo.find({
      where: {
        state: In(activityStates),
      },
      order: { updatedTime: "ASC" },
    });

    const projectIds = [...new Set(activityResults.map((activity) => activity.projectRefId))];

    const projectsFromActivitiesQuery: any = {
      where: {
        refId: In(projectIds),
      },
    };

    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      projectsFromActivitiesQuery.where.companyId = user.companyId;
    } else if (user.companyRole === CompanyRole.INDEPENDENT_CERTIFIER) {
      projectsFromActivitiesQuery.where.independentCertifiers = ArrayContains([user.companyId]);
    }

    const projectsFromActivities = await this.projectRepository.find(projectsFromActivitiesQuery);

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
        project.updateTime = activity.updatedTime;
      });
    });

    const allProjects = projectResults.concat(projectsFromActivities);

    return allProjects.length
      ? allProjects.sort((a, b) => {
          return b.updateTime - a.updateTime;
        })
      : [];
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

  async getProjectStatusSummary(filters: ProjectDataRequestDTO, user: User): Promise<any> {
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
      latestStatusQb.andWhere("project.sector = :sector", {
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
      latestStatusQb.andWhere("project.sector = :sector", {
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
      .select("project.sector", "sector")
      .addSelect("COUNT(DISTINCT project.refId)", "count")
      .groupBy("project.sector");

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
      qb.andWhere("project.sector = :sector", {
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
    for (const sectorKey in InfSectorEnum) {
      const sectorName = InfSectorEnum[sectorKey];
      response[sectorName] = 0;
    }

    for (const row of result) {
      const sector = row.sector ?? "Unknown";
      response[InfSectorEnum[sector]] = parseInt(row.count, 10);
    }

    return response;
  }
  async getProjectCountBySectorScope(
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
      qb.andWhere("project.sector = :sector", {
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
    for (const sectorKey in InfSectoralScopeEnum) {
      const sectorName = InfSectoralScopeEnum[sectorKey];
      response[sectorName] = 0;
    }

    for (const row of result) {
      const sector = row.sector ?? "Unknown";
      response[InfSectoralScopeEnum[sector]] = parseInt(row.count, 10);
    }

    return response;
  }

  async getCreditSummary(filters: ProjectDataRequestDTO, user: User): Promise<any> {
    const orgId = user.companyId;
    const isMine = !!(filters?.isMine && user.companyRole === CompanyRole.PROJECT_DEVELOPER);

    const qb = this.auditRepository
      .createQueryBuilder("audit")
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId")
      .select(
        `
        SUM(
          CASE
            WHEN audit."logType" = :creditsAuth
             AND (
               :isMine = false
               OR (audit.data->>'toCompanyId')::int = :orgId
             )
            THEN (audit.data->>'amount')::int
            ELSE 0
          END
        )`,
        "authorisedAmount"
      )
      .addSelect(
        `
        MAX(
          CASE
            WHEN audit."logType" = :creditsAuth
             AND (
               :isMine = false
               OR (audit.data->>'toCompanyId')::int = :orgId
             )
            THEN audit."createdTime"
          END
        )`,
        "lastAuthorisedTime"
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN audit."logType" = :creditIssued
             AND (
               :isMine = false
               OR (audit.data->>'toCompanyId')::int = :orgId
             )
            THEN (audit.data->>'amount')::int
            ELSE 0
          END
        )`,
        "issuedAmount"
      )
      .addSelect(
        `
        MAX(
          CASE
            WHEN audit."logType" = :creditIssued
             AND (
               :isMine = false
               OR (audit.data->>'toCompanyId')::int = :orgId
             )
            THEN audit."createdTime"
          END
        )`,
        "lastIssuedTime"
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN audit."logType" = :creditTransferred
             AND (
               :isMine = true
               AND (audit.data->>'toCompanyId')::int = :orgId
               OR
               :isMine = false
               AND (audit.data->>'fromCompanyId')::int = :orgId
             )
            THEN (audit.data->>'amount')::int
            ELSE 0
          END
        )`,
        "transferredAmount"
      )
      .addSelect(
        `
        MAX(
          CASE
            WHEN audit."logType" = :creditTransferred
             AND (
               :isMine = true
               AND (audit.data->>'toCompanyId')::int = :orgId
               OR
               :isMine = false
               AND (audit.data->>'fromCompanyId')::int = :orgId
             )
            THEN audit."createdTime"
          END
        )`,
        "lastTransferredTime"
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN audit."logType" = :retireApproved
             AND (
               :isMine = false
               OR (audit.data->>'fromCompanyId')::int = :orgId
             )
            THEN (audit.data->>'amount')::int
            ELSE 0
          END
        )`,
        "retiredAmount"
      )
      .addSelect(
        `
        MAX(
          CASE
            WHEN audit."logType" = :retireApproved
             AND (
               :isMine = false
               OR (audit.data->>'fromCompanyId')::int = :orgId
             )
            THEN audit."createdTime"
          END
        )`,
        "lastRetiredTime"
      )
      .where(filters?.startDate ? "audit.createdTime >= :startDate" : "1=1", {
        startDate: filters?.startDate,
      })
      .andWhere(filters?.endDate ? "audit.createdTime <= :endDate" : "1=1", {
        endDate: filters?.endDate,
      })
      .andWhere(filters?.sector ? "project.sector = :sector" : "1=1", {
        sector: filters?.sector,
      })
      .setParameters({
        creditsAuth: ProjectAuditLogType.CREDITS_AUTHORISED,
        creditIssued: ProjectAuditLogType.CREDIT_ISSUED,
        creditTransferred: ProjectAuditLogType.CREDIT_TRANSFERED,
        retireApproved: ProjectAuditLogType.RETIRE_APPROVED,
        orgId,
        isMine,
      });

    const result = await qb.getRawOne();

    return {
      authorisedAmount: parseInt(result.authorisedAmount, 10),
      lastAuthorisedTime: result.lastAuthorisedTime ? Number(result.lastAuthorisedTime) : null,
      issuedAmount: parseInt(result.issuedAmount, 10),
      lastIssuedTime: result.lastIssuedTime ? Number(result.lastIssuedTime) : null,
      transferredAmount: parseInt(result.transferredAmount, 10),
      lastTransferredTime: result.lastTransferredTime ? Number(result.lastTransferredTime) : null,
      retiredAmount: parseInt(result.retiredAmount, 10),
      lastRetiredTime: result.lastRetiredTime ? Number(result.lastRetiredTime) : null,
    };
  }

  async creditsSummaryByDate(filters: ProjectDataRequestDTO, user: User) {
    const orgId = user.companyId;
    const isPD = filters?.isMine && user.companyRole === CompanyRole.PROJECT_DEVELOPER;

    const inboundTypes = [
      ProjectAuditLogType.CREDITS_AUTHORISED,
      ProjectAuditLogType.CREDIT_ISSUED,
    ];
    const outboundTypes = [
      ProjectAuditLogType.CREDIT_TRANSFERED,
      ProjectAuditLogType.RETIRE_APPROVED,
    ];

    if (isPD) {
      inboundTypes.push(ProjectAuditLogType.CREDIT_TRANSFERED);
      const idx = outboundTypes.indexOf(ProjectAuditLogType.CREDIT_TRANSFERED);
      if (idx > -1) outboundTypes.splice(idx, 1);
    }

    const qb = this.auditRepository
      .createQueryBuilder("audit")
      .select(`to_char(to_timestamp(audit."createdTime" / 1000), 'YYYY-MM-DD')`, "date")
      .addSelect('audit."logType"', "logType")
      .addSelect(`SUM(CAST(audit."data"->>'amount' AS INTEGER))`, "totalAmount")
      .innerJoin(ProjectEntity, "project", "project.refId = audit.refId")
      .where('audit."logType" IN (:...allTypes)', {
        allTypes: [...inboundTypes, ...outboundTypes],
      });

    if (filters?.startDate) {
      qb.andWhere('audit."createdTime" >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      qb.andWhere('audit."createdTime" <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.sector) {
      qb.andWhere("project.sector = :sector", { sector: filters.sector });
    }

    if (isPD) {
      qb.andWhere(
        new Brackets((qb1) => {
          qb1
            .where(
              `(audit."data"->>'toCompanyId')::int = :orgId
             AND audit."logType" IN (:...inboundTypes)`,
              { orgId, inboundTypes }
            )
            .orWhere(
              `(audit."data"->>'fromCompanyId')::int = :orgId
             AND audit."logType" IN (:...outboundTypes)`,
              { orgId, outboundTypes }
            );
        })
      );
    }

    qb.groupBy("date").addGroupBy('audit."logType"').orderBy("date", "DESC");

    const results = await qb.getRawMany();
    const pivoted: Record<string, any> = {};
    for (const { date, logType, totalAmount } of results) {
      pivoted[date] ??= { date };
      pivoted[date][logType] = parseInt(totalAmount, 10);
    }
    return Object.values(pivoted);
  }
}
