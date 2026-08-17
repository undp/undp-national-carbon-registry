import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { InitialReport } from "../entities/initial.report.entity";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CooperativeApproachCreateDto } from "../dto/cooperative.approach.create.dto";
import { CooperativeApproachUpdateDto } from "../dto/cooperative.approach.update.dto";
import { CaAuthorizedEntityCreateDto } from "../dto/ca.authorized.entity.create.dto";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { InitialReportStatus } from "../enum/initial.report.status.enum";
import { AuthorizedEntityStatus } from "../enum/authorized.entity.status.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { CountryService } from "../util/country.service";
import { User } from "../entities/user.entity";

// Allowed manual status transitions. Draft -> Active carries the extra
// submitted-initial-report requirement checked in update().
const ALLOWED_TRANSITIONS: Record<
  CooperativeApproachStatus,
  CooperativeApproachStatus[]
> = {
  [CooperativeApproachStatus.DRAFT]: [CooperativeApproachStatus.ACTIVE],
  [CooperativeApproachStatus.ACTIVE]: [
    CooperativeApproachStatus.SUSPENDED,
    CooperativeApproachStatus.COMPLETED,
    CooperativeApproachStatus.REVOKED,
  ],
  [CooperativeApproachStatus.SUSPENDED]: [
    CooperativeApproachStatus.ACTIVE,
    CooperativeApproachStatus.COMPLETED,
    CooperativeApproachStatus.REVOKED,
  ],
  [CooperativeApproachStatus.COMPLETED]: [],
  [CooperativeApproachStatus.REVOKED]: [],
};

@Injectable()
export class CooperativeApproachService {
  constructor(
    @InjectRepository(CooperativeApproach)
    private cooperativeApproachRepo: Repository<CooperativeApproach>,
    @InjectRepository(InitialReport)
    private initialReportRepo: Repository<InitialReport>,
    @InjectRepository(CaAuthorizedEntity)
    private authorizedEntityRepo: Repository<CaAuthorizedEntity>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly countryService: CountryService,
    private readonly configService: ConfigService
  ) {}

  // Cooperative approaches are managed by the government (DNA) Admin /
  // Root only — mirrors the retirement-action permission pattern.
  private assertCanManage(user: User) {
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      ![Role.Admin, Role.Root].includes(user.role)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.noManagePermission",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
  }

  // The registry's own country — always the CA's host party and the
  // authorizing party for any authorized entity added under it.
  private get hostParty(): string {
    return this.configService.get("systemCountry");
  }

  async getHostParty(): Promise<DataResponseDto> {
    return new DataResponseDto(HttpStatus.OK, {
      alpha2: this.hostParty,
      name: await this.countryService.getCountryName(this.hostParty),
    });
  }

  async create(
    dto: CooperativeApproachCreateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.invalidDateRange",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.COOPERATIVE_APPROACH,
      3
    );

    const approach = new CooperativeApproach();
    approach.cooperativeApproachId = `CA-${id}`;
    approach.title = dto.title;
    // Host party is derived server-side and always included among the
    // participating parties — never taken from the client.
    approach.hostParty = this.hostParty;
    approach.participatingParties = Array.from(
      new Set([this.hostParty, ...dto.participatingParties])
    );
    approach.description = dto.description;
    approach.startDate = dto.startDate;
    approach.endDate = dto.endDate;
    approach.expectedMitigationOutcomes = dto.expectedMitigationOutcomes;
    approach.environmentalIntegrityAssessment =
      dto.environmentalIntegrityAssessment;
    approach.ndcLink = dto.ndcLink;
    approach.authorizationDocumentUrl = dto.authorizationDocumentUrl;
    approach.status = CooperativeApproachStatus.DRAFT;
    approach.createdTime = now;
    approach.updatedTime = now;

    const saved = await this.cooperativeApproachRepo.save(approach);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    const resp = await this.cooperativeApproachRepo
      .createQueryBuilder("cooperative_approach")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "cooperative_approach",
            abilityCondition
          ),
          "cooperative_approach"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"cooperative_approach".${this.helperService.generateSortCol(
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

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async getById(
    cooperativeApproachId: string
  ): Promise<DataResponseDto> {
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId,
    });
    if (!approach) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.notFound",
          [cooperativeApproachId]
        ),
        HttpStatus.NOT_FOUND
      );
    }
    return new DataResponseDto(HttpStatus.OK, approach);
  }

  async update(
    dto: CooperativeApproachUpdateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (!approach) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.notFound",
          [dto.cooperativeApproachId]
        ),
        HttpStatus.NOT_FOUND
      );
    }

    if (dto.title !== undefined) approach.title = dto.title;
    if (dto.participatingParties !== undefined) {
      // The host party can never be dropped from the set.
      const nextParties = Array.from(
        new Set([this.hostParty, ...dto.participatingParties])
      );
      const removed = approach.participatingParties.filter(
        (p) => !nextParties.includes(p)
      );
      if (removed.length > 0) {
        const activeEntities = await this.authorizedEntityRepo.find({
          where: {
            cooperativeApproachId: approach.cooperativeApproachId,
            status: AuthorizedEntityStatus.ACTIVE,
          },
        });
        const stillInUse = activeEntities.find((e) =>
          removed.includes(e.countryOfIncorporation)
        );
        if (stillInUse) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "cooperativeApproach.participatingPartyInUse",
              [stillInUse.countryOfIncorporation, approach.cooperativeApproachId]
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }
      approach.participatingParties = nextParties;
    }
    if (dto.description !== undefined) approach.description = dto.description;
    if (dto.startDate !== undefined) approach.startDate = dto.startDate;
    if (dto.endDate !== undefined) approach.endDate = dto.endDate;
    if (
      approach.startDate &&
      approach.endDate &&
      approach.startDate >= approach.endDate
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.invalidDateRange",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (dto.expectedMitigationOutcomes !== undefined)
      approach.expectedMitigationOutcomes = dto.expectedMitigationOutcomes;
    if (dto.environmentalIntegrityAssessment !== undefined)
      approach.environmentalIntegrityAssessment =
        dto.environmentalIntegrityAssessment;
    if (dto.ndcLink !== undefined) approach.ndcLink = dto.ndcLink;
    if (dto.status !== undefined && dto.status !== approach.status) {
      await this.applyStatusTransition(approach, dto.status);
    }
    if (dto.authorizationDocumentUrl !== undefined)
      approach.authorizationDocumentUrl = dto.authorizationDocumentUrl;

    approach.updatedTime = new Date().getTime();

    const saved = await this.cooperativeApproachRepo.save(approach);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  private async applyStatusTransition(
    approach: CooperativeApproach,
    newStatus: CooperativeApproachStatus
  ) {
    const allowed = ALLOWED_TRANSITIONS[approach.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.invalidTransition",
          [approach.cooperativeApproachId, approach.status, newStatus]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (
      approach.status === CooperativeApproachStatus.DRAFT &&
      newStatus === CooperativeApproachStatus.ACTIVE
    ) {
      // Activation is only possible after the approach's initial
      // report has been submitted (Dec 2/CMA.3 Annex para 18).
      const submittedIr = await this.initialReportRepo.findOne({
        where: [
          {
            cooperativeApproachId: approach.cooperativeApproachId,
            status: InitialReportStatus.SUBMITTED,
          },
          {
            cooperativeApproachId: approach.cooperativeApproachId,
            status: InitialReportStatus.PUBLISHED,
          },
        ],
      });
      if (!submittedIr) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "cooperativeApproach.activationRequiresSubmittedIr",
            [approach.cooperativeApproachId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }
    if (
      newStatus === CooperativeApproachStatus.ACTIVE &&
      !approach.caReferenceNumber
    ) {
      // Mock of the UNFCCC review / CARP numbering: issue the CAxxxx
      // reference the first time the approach becomes Active.
      const refId = await this.counterService.incrementCount(
        CounterType.CA_REFERENCE,
        4
      );
      approach.caReferenceNumber = `CA${refId}`;
    }
    approach.status = newStatus;
  }

  // ------------------------------------------------------------------
  // Authorized entities (AEF v2 "Authorized entities" table)
  // ------------------------------------------------------------------

  async addAuthorizedEntity(
    dto: CaAuthorizedEntityCreateDto,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (!approach) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.notFound",
          [dto.cooperativeApproachId]
        ),
        HttpStatus.NOT_FOUND
      );
    }
    if (approach.status !== CooperativeApproachStatus.ACTIVE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.entityRequiresActiveCa",
          [dto.cooperativeApproachId]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (!approach.participatingParties.includes(dto.countryOfIncorporation)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.countryOfIncorporationNotParticipating",
          [dto.countryOfIncorporation, dto.cooperativeApproachId]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (dto.authorizationDate > Date.now()) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.authorizationDateInFuture",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const entity = new CaAuthorizedEntity();
    entity.cooperativeApproachId = dto.cooperativeApproachId;
    entity.entityName = dto.entityName;
    entity.entityIdentifier = dto.entityIdentifier;
    // Authorizing party is always the registry's own (host) country —
    // never client-supplied.
    entity.authorizingParty = this.hostParty;
    entity.countryOfIncorporation = dto.countryOfIncorporation;
    entity.authorizationDate = dto.authorizationDate;
    entity.authorizationReference = dto.authorizationReference;
    entity.status = AuthorizedEntityStatus.ACTIVE;

    const saved = await this.authorizedEntityRepo.save(entity);
    return new DataResponseDto(HttpStatus.CREATED, saved);
  }

  async removeAuthorizedEntity(
    id: string,
    user: User
  ): Promise<DataResponseDto> {
    this.assertCanManage(user);
    const entity = await this.authorizedEntityRepo.findOneBy({ id });
    if (!entity) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.authorizedEntityNotFound",
          [id]
        ),
        HttpStatus.NOT_FOUND
      );
    }
    // Soft removal — the authorization history must stay in the
    // system, so the row is only flipped to Inactive.
    entity.status = AuthorizedEntityStatus.INACTIVE;
    entity.updatedTime = new Date().getTime();
    const saved = await this.authorizedEntityRepo.save(entity);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  async queryAuthorizedEntities(
    cooperativeApproachId: string
  ): Promise<DataResponseDto> {
    const entities = await this.authorizedEntityRepo.find({
      where: { cooperativeApproachId },
      order: { createdTime: "ASC" },
    });
    return new DataResponseDto(HttpStatus.OK, entities);
  }
}
