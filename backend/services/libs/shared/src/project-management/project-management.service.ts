import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { HelperService } from "../util/helpers.service";
import { CompanyService } from "../company/company.service";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { plainToClass } from "class-transformer";
import { ProjectEntity } from "../entities/projects.entity";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { DocType } from "../enum/document.type";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProjectCreateDto } from "../dto/project.create.dto";
import { DocumentEntity } from "../entities/document.entity";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DocumentStatus } from "../enum/document.status";
import { DataResponseDto } from "../dto/data.response.dto";
import { UpdateProjectProposalStageDto } from "../dto/updateProjectProposalStage.dto";
import { NoObjectionLetterGenerateService } from "../util/document-generators/no.objection.letter.gen";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { ProjectViewEntity } from "../view-entities/project.view.entity";
import { ProjectDetailsViewEntity } from "../view-entities/projectDetails.view.entity";
import { ProjectAuditLogType } from "../enum/project.audit.log.type.enum";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { EmailTemplates } from "../email-helper/email.template";
import { DocumentManagementService } from "../document-management/document-management.service";
import { Role } from "../casl/role.enum";
import { DataResponseMessageDto } from "../dto/data.response.message";
import { ActivityViewEntity } from "../view-entities/activity.view.entity";
import { FilterEntry } from "../dto/filter.entry";

@Injectable()
export class ProjectManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly counterService: CounterService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    @InjectRepository(DocumentEntity)
    private documentRepo: Repository<DocumentEntity>,
    private readonly noObjectionLetterGenerateService: NoObjectionLetterGenerateService,
    @InjectRepository(ProjectViewEntity)
    private projectViewRepo: Repository<ProjectViewEntity>,
    @InjectRepository(ProjectDetailsViewEntity)
    private projectDetailsViewRepo: Repository<ProjectDetailsViewEntity>,
    @InjectRepository(ActivityViewEntity)
    private activityViewEntityRepo: Repository<ActivityViewEntity>,
    private readonly emailHelperService: EmailHelperService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly auditLogService: AuditLogsService
  ) {}

  async getLogs(refId: string) {
    return await this.auditLogService.getLogs(refId);
  }

  async query(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    let permissionFilter: FilterEntry;
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      permissionFilter = {
        key: "companyId",
        operation: "=",
        value: user.companyId,
      };
    } else if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      permissionFilter = {
        key: "independentCertifiers",
        operation: "@>",
        value: `{${user.companyId}}`, // PostgreSQL array containment syntax
      };
    }
    if (permissionFilter) {
      if (query.filterAnd) {
        query.filterAnd.push(permissionFilter);
      } else {
        query.filterAnd = [permissionFilter];
      }
    }
    const skip = query.size * query.page - query.size;
    let resp = await this.projectViewRepo
      .createQueryBuilder("document_entity")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "document_entity",
            abilityCondition
          ),
          "document_entity"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"document_entity".${this.helperService.generateSortCol(
            query?.sort?.key
          )}`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .offset(skip)
      .limit(query.size)
      .getManyAndCount();

    if (resp.length > 0) {
      resp[0] = resp[0].map((e) => ({
        ...e,
        company: {
          companyId: e.companyId,
          name: e.name,
          logo: e.logo,
        },
      }));
    }

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async getProjectById(programmeId: string, user: User): Promise<any> {
    if (!programmeId)
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "Project ID is required",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );

    const project = await this.projectDetailsViewRepo
      .createQueryBuilder("project")
      .where("project.refId = :programmeId", { programmeId })
      .getOne();
    if (!project)
      throw new HttpException(
        this.helperService.formatReqMessagesString("Project not found", []),
        HttpStatus.NOT_FOUND
      );
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      if (project.company.companyId != user.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.unauthorized",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    } else if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      const numberArray = project.certifierId.map((item) => Number(item));
      if (!numberArray.includes(user.companyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.unauthorized",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    }

    const allDocuments = await this.documentManagementService.queryAll(
      programmeId
    );
    const documents = {};
    const documentContents = {};
    allDocuments.forEach((doc) => {
      if (!documents[doc.type] || doc.version > documents[doc.type].version) {
        documents[doc.type] = {
          documentType: doc.type,
          refId: doc.id,
          version: doc.version,
        };
        documentContents[doc.type] = doc.content;
      }
    });
    const infRefId = documents[DocumentTypeEnum.INITIAL_NOTIFICATION_FORM]
      ? documents[DocumentTypeEnum.INITIAL_NOTIFICATION_FORM].refId
      : null;
    const infContent = documentContents[
      DocumentTypeEnum.INITIAL_NOTIFICATION_FORM
    ]
      ? documentContents[DocumentTypeEnum.INITIAL_NOTIFICATION_FORM]
      : null;

    const certifiers = await this.companyService.findByCompanyIds({
      companyIds: project.certifierId,
    });

    const independentCertifiers = certifiers?.map((company) => company.name);

    const activities = await this.activityViewEntityRepo.find({
      where: { projectRefId: programmeId },
    });

    const projectDetails = {
      activities,
      infRefId,
      ...project,
      ...infContent,
      documents,
      independentCertifiers,
    };

    return projectDetails;
  }
}
