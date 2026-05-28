import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CooperativeApproachCreateDto } from "../dto/cooperative.approach.create.dto";
import { CooperativeApproachUpdateDto } from "../dto/cooperative.approach.update.dto";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { User } from "../entities/user.entity";

@Injectable()
export class CooperativeApproachService {
  constructor(
    @InjectRepository(CooperativeApproach)
    private cooperativeApproachRepo: Repository<CooperativeApproach>,
    private readonly helperService: HelperService,
    private readonly counterService: CounterService
  ) {}

  async create(
    dto: CooperativeApproachCreateDto,
    user: User
  ): Promise<DataResponseDto> {
    const now = new Date().getTime();
    const id = await this.counterService.incrementCount(
      CounterType.COOPERATIVE_APPROACH,
      3
    );

    const approach = new CooperativeApproach();
    approach.cooperativeApproachId = `CA-${id}`;
    approach.title = dto.title;
    approach.participatingParties = dto.participatingParties;
    approach.hostParty = dto.hostParty;
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
          []
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
    const approach = await this.cooperativeApproachRepo.findOneBy({
      cooperativeApproachId: dto.cooperativeApproachId,
    });
    if (!approach) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "cooperativeApproach.notFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }

    if (dto.title !== undefined) approach.title = dto.title;
    if (dto.participatingParties !== undefined)
      approach.participatingParties = dto.participatingParties;
    if (dto.description !== undefined) approach.description = dto.description;
    if (dto.startDate !== undefined) approach.startDate = dto.startDate;
    if (dto.endDate !== undefined) approach.endDate = dto.endDate;
    if (dto.expectedMitigationOutcomes !== undefined)
      approach.expectedMitigationOutcomes = dto.expectedMitigationOutcomes;
    if (dto.environmentalIntegrityAssessment !== undefined)
      approach.environmentalIntegrityAssessment =
        dto.environmentalIntegrityAssessment;
    if (dto.ndcLink !== undefined) approach.ndcLink = dto.ndcLink;
    if (dto.status !== undefined) approach.status = dto.status;
    if (dto.authorizationDocumentUrl !== undefined)
      approach.authorizationDocumentUrl = dto.authorizationDocumentUrl;

    approach.updatedTime = new Date().getTime();

    const saved = await this.cooperativeApproachRepo.save(approach);
    return new DataResponseDto(HttpStatus.OK, saved);
  }
}
