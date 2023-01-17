import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataCountResponseDto } from "../shared/dto/data.count.response";
import { Programme } from "../shared/entities/programme.entity";
import { ProgrammeTransfer } from "../shared/entities/programme.transfer";
import { Repository } from "typeorm";
import { StatList } from "../shared/dto/stat.list.dto";
import { StatType } from "../shared/enum/stat.type.enum";
import { ChartStatList } from "../shared/dto/chartStats.list.dto";
import { ChartType } from "../shared/enum/chart.type.enum";
import { HelperService } from "../shared/util/helpers.service";
import { ProgrammeStage } from "../shared/enum/programme-status.enum";
import { programmeStatusRequestDto } from "../shared/dto/programmeStatus.request.dto";
import { CreditStatType } from "../shared/enum/credit.stat.type.enum";
import { chartStatsRequestDto } from "../shared/dto/chartStats.request.dto";
import { ChartStatsResponseDto } from "../shared/dto/charts.stats.response";
import {
  chartStatsResultInMonths,
  chartStatsResultInitialValueInMonths,
  chartStatsResultSend,
  chartStatsResultInitialValueSend,
} from "../shared/dto/chart.stats.result";

@Injectable()
export class AnalyticsAPIService {
  constructor(
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(ProgrammeTransfer)
    private programmeTransferRepo: Repository<ProgrammeTransfer>
  ) {}

  async programmesStaticChartsDetails(
    abilityCondition: string,
    query: ChartStatList
  ): Promise<ChartStatsResponseDto> {
    let result: chartStatsResultSend = chartStatsResultInitialValueSend;
    let resultsX: chartStatsResultSend = chartStatsResultInitialValueSend;
    let results = {};
    for (const stat of query.stats) {
      switch (stat.type) {
        case ChartType.TOTAL_PROGRAMS:
          const startTime = 1672531200000;
          const endTime = 1703894400000;
          const duration = endTime - startTime;
          const durationInDays = Math.ceil(duration / 1000 / 60 / 60 / 24);
          let sTime = startTime;
          let params: chartStatsRequestDto = {
            type: "TOTAL_PROGRAMS",
            startDate: startTime,
            endDate: endTime,
          };
          let totalProgrammesResponse = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLChartStastics(
                params,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getMany();
          let duraion: number;
          let durationCounts: number;
          if (durationInDays > 31) {
            duraion = 2592000000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24 / 30);
          } else if (durationInDays > 7) {
            duraion = 604800000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24 / 7);
          } else if (durationInDays > 1) {
            duraion = 86400000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24);
          }
          let data = {
            awaitingAuthorization: [],
            issued: [],
            rejected: [],
            programmes: [],
          };
          for (let index = 1; index <= durationCounts; index++) {
            let eTime = sTime + duraion;
            let pendingC = 0;
            let issuedC = 0;
            let rejectedC = 0;
            let programmesC = 0;
            // console.log("week count ---- ", index, { sTime, eTime });
            for (
              let indexProgramme = 0;
              indexProgramme < totalProgrammesResponse.length;
              indexProgramme++
            ) {
              if (
                totalProgrammesResponse[indexProgramme]?.createdTime >= sTime &&
                totalProgrammesResponse[indexProgramme]?.createdTime < eTime
              ) {
                let prgramme =
                  totalProgrammesResponse[indexProgramme]?.programmeId;
                programmesC++;
                if (
                  totalProgrammesResponse[indexProgramme]?.currentStage ===
                  "AwaitingAuthorization"
                ) {
                  pendingC++;
                } else if (
                  totalProgrammesResponse[indexProgramme]?.currentStage ===
                  "Issued"
                ) {
                  issuedC++;
                } else if (
                  totalProgrammesResponse[indexProgramme]?.currentStage ===
                  "Rejected"
                ) {
                  rejectedC++;
                }
              }
              if (indexProgramme === totalProgrammesResponse.length - 1) {
                data?.programmes.push(programmesC);
                data?.awaitingAuthorization.push(pendingC);
                data?.issued.push(issuedC);
                data?.rejected.push(rejectedC);
              }
            }
            sTime = eTime;
          }
          console.log("data ----------- > ", data);
          results[stat.type] = data;
          break;
      }
    }
    return new ChartStatsResponseDto(results);
  }

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
