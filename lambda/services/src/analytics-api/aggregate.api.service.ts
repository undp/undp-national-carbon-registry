import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataCountResponseDto } from "../shared/dto/data.count.response";
import { Programme } from "../shared/entities/programme.entity";
import { Repository } from "typeorm";
import { StatList } from "../shared/dto/stat.list.dto";
import { StatType } from "../shared/enum/stat.type.enum";
import { HelperService } from "../shared/util/helpers.service";
import { ProgrammeTransferViewEntityQuery } from "../shared/entities/programmeTransfer.view.entity";
import { QueryDto } from "../shared/dto/query.dto";
import { FilterEntry } from "../shared/dto/filter.entry";
import { SortEntry } from "../shared/dto/sort.entry";
import { AggrEntry } from "../shared/dto/aggr.entry";
import { Company } from "../shared/entities/company.entity";
import { StatFilter } from "../shared/dto/stat.filter";
import { ProgrammeStage } from "../shared/enum/programme-status.enum";

@Injectable()
export class AggregateAPIService {
  constructor(
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(ProgrammeTransferViewEntityQuery)
    private programmeTransferRepo: Repository<ProgrammeTransferViewEntityQuery>
  ) {}

  private getFilterAndByStatFilter(
    statFilter: StatFilter,
    mineFilter: FilterEntry
  ) {
    const filters: FilterEntry[] = [];
    if (statFilter) {
      if (statFilter.startTime) {
        filters.push({
          key: "createdTime",
          operation: ">=",
          value: statFilter.startTime,
        });
      }
      if (statFilter.endTime) {
        filters.push({
          key: "createdTime",
          operation: "<=",
          value: statFilter.endTime,
        });
      }
      if (statFilter.onlyMine == true) {
        filters.push(mineFilter);
      }
      return filters;
    } else {
      return null;
    }
  }

  private async getLastTime(
    repo: Repository<any>,
    tableName: string,
    whereC: string,
    timeCol: string
  ) {
    console.log("getLastTime", whereC);
    const resp = await repo
      .createQueryBuilder(tableName)
      .select(`"${timeCol}"`)
      .where(whereC)
      .orderBy(`"${timeCol}"`, "DESC")
      .limit(1)
      .getRawOne();

    console.log("Resp", resp);
    if (resp) {
      return resp[timeCol];
    }
    return 0;
  }

  private async genAggregateTypeOrmQuery(
    repo: Repository<any>,
    tableName: string,
    groupBy: string[],
    aggregates: AggrEntry[],
    filterAnd: FilterEntry[],
    sort: SortEntry,
    abilityCondition: string,
    lastTimeForWhere: any,
    timeCol: string
  ) {
    const query = new QueryDto();
    query.filterAnd = filterAnd;
    query.sort = sort;

    const whereC = this.helperService.generateWhereSQL(
      query,
      this.helperService.parseMongoQueryToSQLWithTable(
        tableName,
        abilityCondition
      )
    );
    let queryBuild = repo.createQueryBuilder(tableName).where(whereC);

    if (aggregates) {
      const selectQuery = aggregates
        .map((a) => `${a.operation}("${tableName}"."${a.key}")`)
        .join(",");
      queryBuild = queryBuild.select(selectQuery);
    }

    if (sort) {
      queryBuild = queryBuild.orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order
      );
    }

    if (groupBy) {
      const groupQuery = groupBy
        .map((gb) => `"${tableName}"."${gb}"`)
        .join(",");
      queryBuild = queryBuild.addSelect(groupQuery);
      queryBuild = queryBuild.groupBy(groupQuery);
    }
    let d = await queryBuild.getRawMany();

    let t = 0;
    if (timeCol) {
      if (lastTimeForWhere[whereC]) {
        console.log("Last time hit from the cache");
        t = lastTimeForWhere[whereC];
      } else {
        t = await this.getLastTime(repo, tableName, whereC, timeCol);
        lastTimeForWhere[whereC] = t;
      }
    }
    for (const row of d) {
      for (const k in row) {
        if (row[k] === null) {
          row[k] = 0;
        }
      }
    }
    return {
      data: d,
      last: t,
    };
  }

  private async getAllAuthProgramme(stat, abilityCondition, lastTimeForWhere) {
    const filtAuth = this.getFilterAndByStatFilter(stat.statFilter, {
      value: ProgrammeStage.AUTHORISED,
      key: "currentStage",
      operation: "=",
    });
    return await this.genAggregateTypeOrmQuery(
      this.programmeRepo,
      "programme",
      null,
      [
        new AggrEntry("programmeId", "COUNT"),
        new AggrEntry("creditEst", "SUM"),
      ],
      filtAuth,
      null,
      abilityCondition,
      lastTimeForWhere,
      "createdTime"
    );
  }

  async getAggregateQuery(
    abilityCondition: string,
    query: StatList,
    companyId: any
  ): Promise<DataCountResponseDto> {
    let results = {};
    let lastTimeForWhere = {};

    let authProgrammesStats = undefined;
    for (const stat of query.stats) {
      switch (stat.type) {
        case StatType.AGG_PROGRAMME_BY_STATUS:
        case StatType.AGG_PROGRAMME_BY_SECTOR:
          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeRepo,
            "programme",
            stat.type === StatType.AGG_PROGRAMME_BY_STATUS
              ? ["currentStage"]
              : ["sector"],
            [
              new AggrEntry("programmeId", "COUNT"),
              new AggrEntry("creditEst", "SUM"),
              new AggrEntry("creditIssued", "SUM"),
              new AggrEntry("creditRetired", "SUM"),
              new AggrEntry("creditTransferred", "SUM"),
            ],
            this.getFilterAndByStatFilter(stat.statFilter, {
              value: companyId,
              key: "companyId",
              operation: "ANY",
            }),
            null,
            abilityCondition,
            lastTimeForWhere,
            "createdTime"
          );
          break;
        case StatType.MY_CREDIT:
          const comp = await this.companyRepo.findOne({
            where: {
              companyId: companyId,
            },
          });
          results[stat.type] = {
            data: {
              primary: comp ? comp.creditBalance : 0,
              secondary: comp ? comp.secondaryAccountBalance : 0,
            },
          };
          break;
        case StatType.PENDING_TRANSFER_INIT:
        case StatType.PENDING_TRANSFER_RECV:
          if (stat.statFilter) {
            stat.statFilter.onlyMine = true;
          } else {
            stat.statFilter = { onlyMine: true };
          }
          const filt = this.getFilterAndByStatFilter(stat.statFilter, {
            value: companyId,
            key:
              stat.type === StatType.PENDING_TRANSFER_INIT
                ? "initiatorCompanyId"
                : "toCompanyId",
            operation: "=",
          });
          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeTransferRepo,
            "transfer",
            null,
            [new AggrEntry("requestId", "COUNT")],
            filt,
            null,
            abilityCondition,
            lastTimeForWhere,
            "txTime"
          );
          break;
        case StatType.CERTIFIED_BY_ME:
          if (stat.statFilter) {
            stat.statFilter.onlyMine = true;
          } else {
            stat.statFilter = { onlyMine: true };
          }
          if (!authProgrammesStats) {
            authProgrammesStats = await this.getAllAuthProgramme(
              stat,
              abilityCondition,
              lastTimeForWhere
            );
          }
          const filtC = this.getFilterAndByStatFilter(stat.statFilter, {
            value: companyId,
            key: "certifierId",
            operation: "ANY",
          });
          const cert = await this.genAggregateTypeOrmQuery(
            this.programmeRepo,
            "programme",
            null,
            [
              new AggrEntry("programmeId", "COUNT"),
              new AggrEntry("creditEst", "SUM"),
            ],
            filtC,
            null,
            abilityCondition,
            lastTimeForWhere,
            undefined
          );
          results[stat.type] = {
            last: authProgrammesStats.last,
            data: {
              certifiedSum: Number(cert.data[0]["sum"]),
              certifiedCount: Number(cert.data[0]["count"]),
              uncertifiedCount:
                Number(authProgrammesStats.data[0]["count"]) -
                Number(cert.data[0]["count"]),
              uncertifiedSum:
                Number(authProgrammesStats.data[0]["sum"]) -
                Number(cert.data[0]["sum"]),
            },
          };
          break;
        case StatType.ALL_AUTH_PROGRAMMES:
          if (!authProgrammesStats) {
            authProgrammesStats = await this.getAllAuthProgramme(
              stat,
              abilityCondition,
              lastTimeForWhere
            );
          }
          results[stat.type] = authProgrammesStats;
          break;
        case StatType.CERTIFIED_PROGRAMMES:
        case StatType.REVOKED_PROGRAMMES:
          if (!authProgrammesStats) {
            authProgrammesStats = await this.getAllAuthProgramme(
              stat,
              abilityCondition,
              lastTimeForWhere
            );
          }
          let filters = this.getFilterAndByStatFilter(stat.statFilter, {
            value: companyId,
            key: "companyId",
            operation: "ANY",
          });
          if (!filters) {
            filters = [];
          }
          filters.push({
            key: `cardinality(${
              stat.type === StatType.CERTIFIED_PROGRAMMES
                ? ["certifierId"]
                : ["revokedCertifierId"]
            })`,
            operation: ">",
            value: "0",
          });
          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeRepo,
            "programme",
            null,
            [
              new AggrEntry("programmeId", "COUNT"),
              new AggrEntry("creditEst", "SUM"),
              new AggrEntry("creditIssued", "SUM"),
              new AggrEntry("creditRetired", "SUM"),
              new AggrEntry("creditTransferred", "SUM"),
            ],
            filters,
            null,
            abilityCondition,
            lastTimeForWhere,
            "createdTime"
          );
          break;
      }
    }
    return new DataCountResponseDto(results);
  }
}
