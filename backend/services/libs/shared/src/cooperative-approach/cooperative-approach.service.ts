import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { EntityManager, Repository } from "typeorm";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CooperativeApproachCreateDto } from "../dto/cooperative.approach.create.dto";
import { CooperativeApproachUpdateDto } from "../dto/cooperative.approach.update.dto";
import {
  CaAuthorizedEntityCreateDto,
  CaAuthorizedEntityDto,
} from "../dto/ca.authorized.entity.create.dto";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { AuthorizedEntityStatus } from "../enum/authorized.entity.status.enum";
import { AuthorizedEntitySubmissionStatus } from "../enum/authorized.entity.submission.status.enum";
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
import { AefV2WriteService } from "../aef-v2-registry/aef-v2-write.service";

// Allowed manual status transitions. Draft has none: an approach leaves
// Draft only when its initial report is submitted, which drives it to
// Submitted through markSubmitted(). From there activation is the sole
// manual move — a submitted approach can never be pulled back to Draft,
// and an active one can never be pushed back to Submitted.
const ALLOWED_TRANSITIONS: Record<
  CooperativeApproachStatus,
  CooperativeApproachStatus[]
> = {
  [CooperativeApproachStatus.DRAFT]: [],
  [CooperativeApproachStatus.SUBMITTED]: [CooperativeApproachStatus.ACTIVE],
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
    @InjectRepository(CaAuthorizedEntity)
    private authorizedEntityRepo: Repository<CaAuthorizedEntity>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService,
    private readonly countryService: CountryService,
    private readonly configService: ConfigService,
    private readonly aefV2WriteService: AefV2WriteService
  ) {}

  // Cooperative approaches are managed by a government (DNA) Root/Admin
  // only — Manager and ViewOnly are both view-only here, matching the
  // CASL ability factory's Manage grant.
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

    // The authorized entities are part of the same submission as the
    // approach itself, so they are built (and validated) against the
    // approach before anything is written, and persisted with it in one
    // transaction — a rejected entity must not leave an orphan CA.
    const entities = (dto.authorizedEntities ?? []).map((entityDto) =>
      this.buildAuthorizedEntity(approach, entityDto)
    );

    const saved = await this.cooperativeApproachRepo.manager.transaction(
      async (manager) => {
        const savedApproach = await manager.save(approach);
        if (entities.length > 0) {
          await manager.save(entities);
        }
        return savedApproach;
      }
    );
    return new DataResponseDto(HttpStatus.CREATED, {
      ...saved,
      authorizedEntities: entities,
    });
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
      this.applyStatusTransition(approach, dto.status);
    }
    if (dto.authorizationDocumentUrl !== undefined)
      approach.authorizationDocumentUrl = dto.authorizationDocumentUrl;

    approach.updatedTime = new Date().getTime();

    const saved = await this.cooperativeApproachRepo.save(approach);
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  // Manual status changes only. The Draft -> Submitted move is not
  // reachable from here by design — see markSubmitted().
  private applyStatusTransition(
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
    approach.status = newStatus;
  }

  /**
   * Drives a Draft approach to Submitted. Called by
   * InitialReportService.submitReport once the report passes its
   * completeness checks — submitting the initial report is the only way
   * an approach leaves Draft, and it carries the approach's authorized
   * entities into Submitted with it.
   *
   * Takes the caller's EntityManager so the whole thing (report,
   * approach, entities) commits or rolls back as one.
   */
  // Flips every still-Draft authorized entity under an approach to
  // Submitted. Called from markSubmitted() for the normal case (the
  // approach itself is leaving Draft), and separately by
  // InitialReportService.submitReport for every linked approach —
  // including ones already Submitted/Active — so an entity added as an
  // amendment after its approach was already filed also gets carried
  // into the initial report the next time that report is resubmitted,
  // rather than staying Draft indefinitely.
  async flipDraftEntitiesToSubmitted(
    cooperativeApproachId: string,
    manager: EntityManager,
    updatedTime: number
  ): Promise<void> {
    await manager.update(
      CaAuthorizedEntity,
      {
        cooperativeApproachId,
        submissionStatus: AuthorizedEntitySubmissionStatus.DRAFT,
      },
      {
        submissionStatus: AuthorizedEntitySubmissionStatus.SUBMITTED,
        updatedTime,
      }
    );
  }

  async markSubmitted(
    cooperativeApproachId: string,
    manager: EntityManager
  ): Promise<CooperativeApproach> {
    const approach = await manager.findOneBy(CooperativeApproach, {
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
    if (approach.status !== CooperativeApproachStatus.DRAFT) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.notDraftForSubmission",
          [cooperativeApproachId, approach.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    approach.status = CooperativeApproachStatus.SUBMITTED;
    if (!approach.caReferenceNumber) {
      // Mock of the UNFCCC review / CARP numbering: in the real Article
      // 6.2 flow the reference arrives from the Secretariat once the
      // initial report is filed, which is exactly this point.
      const refId = await this.counterService.incrementCount(
        CounterType.CA_REFERENCE,
        4
      );
      approach.caReferenceNumber = `CA${refId}`;
    }
    approach.updatedTime = new Date().getTime();

    await this.flipDraftEntitiesToSubmitted(
      cooperativeApproachId,
      manager,
      approach.updatedTime
    );

    return manager.save(approach);
  }

  // ------------------------------------------------------------------
  // Authorized entities (AEF v2 "Authorized entities" table)
  // ------------------------------------------------------------------

  // Validates an authorized entity against the approach it belongs to
  // and returns the unsaved row. Shared by the nested create path and
  // the standalone add endpoint, which differ only in when they run.
  private buildAuthorizedEntity(
    approach: CooperativeApproach,
    dto: CaAuthorizedEntityDto
  ): CaAuthorizedEntity {
    if (!approach.participatingParties.includes(dto.countryOfIncorporation)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.countryOfIncorporationNotParticipating",
          [dto.countryOfIncorporation, approach.cooperativeApproachId]
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
    entity.cooperativeApproachId = approach.cooperativeApproachId;
    entity.entityName = dto.entityName;
    entity.entityIdentifier = dto.entityIdentifier;
    // Authorizing party is always the registry's own (host) country —
    // never client-supplied.
    entity.authorizingParty = this.hostParty;
    entity.countryOfIncorporation = dto.countryOfIncorporation;
    entity.authorizationDate = dto.authorizationDate;
    entity.authorizationReference = dto.authorizationReference;
    entity.status = AuthorizedEntityStatus.ACTIVE;
    // Always starts unsubmitted. For an entity added while the approach
    // is still Draft, markSubmitted() carries it over on that first
    // filing. For one added to an already-Submitted approach (allowed
    // below), there is currently no path that flips it to Submitted —
    // it stays Draft indefinitely unless/until a future change wires
    // that up. Deliberate for now: adding is unlocked without also
    // wiring the entity into a resubmission/versioning flow.
    entity.submissionStatus = AuthorizedEntitySubmissionStatus.DRAFT;
    return entity;
  }

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
    // Entities can be added while Draft (the normal case, carried over
    // by markSubmitted on first filing), or once the approach has been
    // Submitted or is Active — an amendment. Submitted is a short-lived
    // bridge state (the approach is activated right after), so Active
    // is the realistic case this actually needs to cover. Such an
    // entity has no path back into a resubmitted initial report yet
    // (see buildAuthorizedEntity's comment), so it stays
    // submissionStatus Draft indefinitely for now; adding is unlocked
    // ahead of that wiring, not instead of it. Suspended/Completed/
    // Revoked keep the set fixed — those are terminal or paused states,
    // not ones an amendment makes sense against.
    if (
      approach.status !== CooperativeApproachStatus.DRAFT &&
      approach.status !== CooperativeApproachStatus.SUBMITTED &&
      approach.status !== CooperativeApproachStatus.ACTIVE
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.entityRequiresDraftCa",
          [dto.cooperativeApproachId, approach.status]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const saved = await this.authorizedEntityRepo.save(
      this.buildAuthorizedEntity(approach, dto)
    );
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
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: entity.cooperativeApproachId,
    });
    if (approach?.status === CooperativeApproachStatus.DRAFT) {
      // Nothing has been submitted yet, so there is no authorization
      // history to preserve — drop the row outright.
      await this.authorizedEntityRepo.delete({ id });
      return new DataResponseDto(HttpStatus.OK, entity);
    }
    // Once submitted, removal is a soft state change — the
    // authorization history must stay in the system.
    entity.status = AuthorizedEntityStatus.INACTIVE;
    entity.updatedTime = new Date().getTime();
    const saved = await this.authorizedEntityRepo.save(entity);
    // Keeps any already-filed (unfrozen) AEF V2 Table 5 row for this entity
    // from drifting — without this, a deactivation only reaches Table 5 the
    // next time an Action references the entity, or at year-end.
    await this.aefV2WriteService.syncAuthorizedEntityStatus(saved, approach?.caReferenceNumber);
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
