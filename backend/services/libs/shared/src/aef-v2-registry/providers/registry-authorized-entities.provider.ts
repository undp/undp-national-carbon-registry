import { AefT5AuthorizedEntitiesCreateInput, AuthorizedEntitiesProvider, formatSubmissionDate } from "@app/aef-v2";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { AuthorizedEntityStatus } from "../../enum/authorized.entity.status.enum";
import { AuthorizedEntitySubmissionStatus } from "../../enum/authorized.entity.submission.status.enum";
import { CaAuthorizedEntity } from "../../entities/ca.authorized.entity.entity";
import { CooperativeApproach } from "../../entities/cooperative.approach.entity";
import { CountryService } from "../../util/country.service";
import { mapCaAuthorizedEntityToAef } from "../mappers/aef-authorized-entity.mapper";

/**
 * Computes Table 5 from this registry's `CaAuthorizedEntity` table.
 *
 * Same honesty caveat as `RegistryHoldingsProvider`, on a smaller surface:
 * `status` is a mutable soft-delete flag with only `updatedTime` to date it,
 * so an entity deactivated and reactivated within the same year cannot be
 * reconstructed exactly as of any instant between those two events. An
 * entity authorized before `asOf` is included if it is still Active, or if
 * it only became Inactive after `asOf`.
 */
@Injectable()
export class RegistryAuthorizedEntitiesProvider implements AuthorizedEntitiesProvider {
  constructor(
    @InjectRepository(CaAuthorizedEntity)
    private readonly authorizedEntityRepo: Repository<CaAuthorizedEntity>,
    @InjectRepository(CooperativeApproach)
    private readonly cooperativeApproachRepo: Repository<CooperativeApproach>,
    private readonly countryService: CountryService
  ) {}

  async getAuthorizedEntities(params: {
    reportedYear: number;
    asOf: Date;
  }): Promise<AefT5AuthorizedEntitiesCreateInput[]> {
    const asOfMs = params.asOf.getTime();

    const entities = await this.authorizedEntityRepo
      .createQueryBuilder("entity")
      // authorizationDate is mandatory going forward (see
      // CaAuthorizedEntityCreateDto), but rows created before that became
      // true may still have it null — createdTime is always present, so it
      // is the fallback rather than a reason to exclude the entity.
      .where("COALESCE(entity.authorizationDate, entity.createdTime) <= :asOf", {
        asOf: asOfMs,
      })
      .andWhere("(entity.status = :active OR entity.updatedTime > :asOf)", {
        active: AuthorizedEntityStatus.ACTIVE,
        asOf: asOfMs,
      })
      // Only entities that went through initial-report submission are
      // reportable — a draft approach's entities are not yet authorized.
      // .andWhere("entity.submissionStatus = :submitted", {
      //   submitted: AuthorizedEntitySubmissionStatus.SUBMITTED,
      // })
      .getMany();

    const cooperativeApproachIds = [...new Set(entities.map((entity) => entity.cooperativeApproachId))];
    const cooperativeApproaches = cooperativeApproachIds.length
      ? await this.cooperativeApproachRepo.findBy({ cooperativeApproachId: In(cooperativeApproachIds) })
      : [];
    const cooperativeApproachById = new Map(
      cooperativeApproaches.map((ca) => [ca.cooperativeApproachId, ca])
    );

    const rows: AefT5AuthorizedEntitiesCreateInput[] = [];
    for (const entity of entities) {
      const ca = cooperativeApproachById.get(entity.cooperativeApproachId);
      const alpha3 = entity.countryOfIncorporation
        ? await this.countryService.getAlpha3(entity.countryOfIncorporation)
        : undefined;
      const authorizationDate = formatSubmissionDate(
        new Date(Number(entity.authorizationDate ?? entity.createdTime))
      );

      rows.push(mapCaAuthorizedEntityToAef(entity, ca?.caReferenceNumber, alpha3, authorizationDate));
    }
    return rows;
  }
}
