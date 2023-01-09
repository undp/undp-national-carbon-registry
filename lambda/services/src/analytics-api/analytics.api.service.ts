import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataCountResponseDto } from "../shared/dto/data.count.response";
import { Programme } from "../shared/entities/programme.entity";
import { Repository } from "typeorm";
import { StatList } from "../shared/dto/stat.list.dto";
import { StatType } from "../shared/enum/stat.type.enum";
import { HelperService } from "../shared/util/helpers.service";
import { ProgrammeStage } from "../shared/enum/programme-status.enum";

@Injectable()
export class AnalyticsAPIService {
  constructor(
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>
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
          const type = "currentStage";
          let programmeByStatus = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLStastics(
                type,
                stat.value,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[ProgrammeStage[stat.value]] = programmeByStatus;
          break;

        case StatType.CREDIT_CERTIFIED:
          let creditCertifiedResponse = await this.programmeRepo
            .createQueryBuilder()
            .where(
              abilityCondition
                ? this.helperService.parseMongoQueryToSQL(abilityCondition)
                : ""
            )
            .getCount();
          results[stat.type] = creditCertifiedResponse;
          break;
      }
    }
    return new DataCountResponseDto(results);
  }
}
