import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataCountResponseDto } from "../shared/dto/data.count.response";
import { Programme } from "../shared/entities/programme.entity";
import { Repository } from "typeorm";
import { StatList } from "../shared/dto/stat.list.dto";
import { StatType } from "../shared/enum/stat.type.enum";

@Injectable()
export class AnalyticsAPIService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>
  ) { }

  async programmesStaticDetails(
    abilityCondition: string,
    query: StatList
  ): Promise<DataCountResponseDto> {

    let results = {}
    for (const stat of query.stats) {
      switch (stat.type) {
        case StatType.TOTAL_PROGRAMS:
        case StatType.PROGRAMS_BY_STATUS:
        case StatType.CREDIT_CERTIFIED:
          let resp = await this.programmeRepo
            .createQueryBuilder()
            .where(abilityCondition ? abilityCondition : "")
            .getCount();
          results[stat.type] = resp
          break;
      }
    }
    return new DataCountResponseDto(results);
  }
}
