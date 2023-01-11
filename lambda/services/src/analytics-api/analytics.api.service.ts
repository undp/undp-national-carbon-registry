import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataCountResponseDto } from "../shared/dto/data.count.response";
import { Programme } from "../shared/entities/programme.entity";
import { ProgrammeTransfer } from "../shared/entities/programme.transfer";
import { Repository } from "typeorm";
import { StatList } from "../shared/dto/stat.list.dto";
import { StatType } from "../shared/enum/stat.type.enum";
import { HelperService } from "../shared/util/helpers.service";
import { ProgrammeStage } from "../shared/enum/programme-status.enum";
import { programmeStatusRequestDto } from "src/shared/dto/programmeStatus.request.dto";
import { CreditStatType } from "../shared/enum/credit.stat.type.enum";

@Injectable()
export class AnalyticsAPIService {
  constructor(
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(ProgrammeTransfer)
    private programmeTransferRepo: Repository<ProgrammeTransfer>
  ) {}

  async programmesStaticDetails(
    abilityCondition: string,
    query: StatList
  ): Promise<DataCountResponseDto> {
    let results = {};
    for (const stat of query.stats) {
      switch (stat.type) {
        case StatType.TOTAL_PROGRAMS:
          let totalProgrammesResponse = await this.programmeRepo
            .createQueryBuilder()
            .where(
              abilityCondition
                ? this.helperService.parseMongoQueryToSQL(abilityCondition)
                : ""
            )
            .getCount();
          results[stat.type] = totalProgrammesResponse;
          break;

        case StatType.PROGRAMS_BY_STATUS:
          const values: programmeStatusRequestDto = {
            type: "PROGRAMS_BY_STATUS",
            value: stat.value,
          };
          let programmeByStatus = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLStastics(
                values,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[stat.value] = programmeByStatus;
          break;

        case StatType.TRANSFER_REQUEST:
          let transferRequest = await this.programmeTransferRepo
            .createQueryBuilder()
            .where(
              abilityCondition
                ? this.helperService.parseMongoQueryToSQL(abilityCondition)
                : ""
            )
            .getCount();
          results[stat.type] = transferRequest;
          break;

        case StatType.CREDIT_STATS_BALANCE:
        case StatType.CREDIT_STATS_TRANSFERRED:
        case StatType.CREDIT_STATS_RETIRED:
          let creditStat = await this.programmeRepo
            .createQueryBuilder()
            .select(`SUM("${CreditStatType[stat.type]}")`)
            .where(
              abilityCondition
                ? this.helperService.parseMongoQueryToSQL(abilityCondition)
                : ""
            )
            .getRawOne();
          results[stat.type] = creditStat;
          break;

        case StatType.CREDIT_CERTIFIED_BALANCE:
        case StatType.CREDIT_CERTIFIED_TRANSFERRED:
        case StatType.CREDIT_CERTIFIED_RETIRED:
          const certifiedRequestParams: programmeStatusRequestDto = {
            type: stat.type,
          };
          let creditCertifiedResponse = await this.programmeRepo
            .createQueryBuilder()
            .select(`SUM("${CreditStatType[stat.type]}")`)
            .where(
              this.helperService.generateWhereSQLStastics(
                certifiedRequestParams,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawOne();
          results[stat.type] = creditCertifiedResponse;
          break;
      }
    }
    return new DataCountResponseDto(results);
  }
}
