import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ItmoAccount } from "../entities/itmo.account.entity";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { DataResponseDto } from "../dto/data.response.dto";
import { HelperService } from "../util/helpers.service";

/**
 * Read-only service exposing the ItmoAccount entity.
 *
 * Dec 2/CMA.3 Annex paragraph 29 requires each Party's national
 * registry to expose its holding, retirement, and cancellation
 * accounts. AEF submission software (Dec 4/CMA.6 Annex II) consumes
 * these per-account balances. The ItmoAccount table was declared in
 * Phase 2 but had no HTTP surface; this service closes that gap.
 *
 * Write paths (create / update / delete) are deliberately omitted:
 * account balances are derived from CreditBlocksEntity ledger events,
 * not from human-directed writes. A future phase that introduces
 * materialised-view maintenance will own the update path.
 */
@Injectable()
export class ItmoAccountService {
  constructor(
    @InjectRepository(ItmoAccount)
    private itmoAccountRepo: Repository<ItmoAccount>,
    private readonly helperService: HelperService
  ) {}

  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const qb = this.itmoAccountRepo.createQueryBuilder("acc");
    const where = this.helperService.generateWhereSQL(query, abilityCondition);
    if (where) qb.where(where);
    if (query?.sort?.key) {
      qb.orderBy(
        `acc."${query.sort.key}"`,
        query.sort.order === "DESC" ? "DESC" : "ASC"
      );
    } else {
      qb.orderBy(`acc."createdTime"`, "DESC");
    }
    if (query?.size && query?.page) {
      qb.skip((query.page - 1) * query.size).take(query.size);
    }
    const [items, total] = await qb.getManyAndCount();
    return new DataListResponseDto(items, total);
  }

  async getByCompany(companyId: number): Promise<DataResponseDto> {
    const items = await this.itmoAccountRepo.find({
      where: { companyId },
      order: { accountType: "ASC" },
    });
    return new DataResponseDto(HttpStatus.OK, items);
  }
}
