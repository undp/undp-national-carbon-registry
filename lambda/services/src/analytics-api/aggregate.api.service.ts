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
      if (statFilter.onlyMine == true && mineFilter) {
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

  private async getTimeGroupedDataStatusConverted(data) {
    const passedResult = data;
    const awaitingAuthorizationsCounts = [];
    const rejectedCounts = [];
    const authorisedCounts = [];
    const authorisedCredits = [];
    const issuedCredits = [];
    const transferredCredits = [];
    const retiredCredits = [];
    const groupedDataFiltered = passedResult?.filter(
      (item) => String(item.time_group) !== "0"
    );
    const groupedDatasObject = groupedDataFiltered.reduce((acc, curr) => {
      const time_group = curr.time_group;
      if (!acc[time_group]) {
        acc[time_group] = [];
      }
      acc[time_group].push(curr);
      return acc;
    }, {});
    const timeLabel = Object.getOwnPropertyNames(groupedDatasObject);
    for (let timeIndex = 0; timeIndex < timeLabel.length; timeIndex++) {
      const arrResultForTimeGroup = groupedDatasObject[timeLabel[timeIndex]];
      let isAwaitingAuthorisationThere = false;
      let isRejectedThere = false;
      let isAuthorisedThere = false;
      let authorisedCreditsSum = 0;
      let issuedCreditsSum = 0;
      let transferredCreditsSum = 0;
      let retiredCreditsSum = 0;
      for (
        let arrResultForTimeGroupIndex = 0;
        arrResultForTimeGroupIndex < arrResultForTimeGroup.length;
        arrResultForTimeGroupIndex++
      ) {
        authorisedCreditsSum =
          authorisedCreditsSum +
          (parseFloat(
            arrResultForTimeGroup[arrResultForTimeGroupIndex]?.totalestcredit
          ) -
            parseFloat(
              arrResultForTimeGroup[arrResultForTimeGroupIndex]
                ?.totalissuedcredit
            ));
        issuedCreditsSum =
          issuedCreditsSum +
          parseFloat(
            arrResultForTimeGroup[arrResultForTimeGroupIndex]
              ?.totalbalancecredit
          );
        transferredCreditsSum =
          transferredCreditsSum +
          parseFloat(
            arrResultForTimeGroup[arrResultForTimeGroupIndex]?.totaltxcredit
          );
        retiredCreditsSum =
          retiredCreditsSum +
          parseFloat(
            arrResultForTimeGroup[arrResultForTimeGroupIndex]
              ?.totalretiredcredit
          );
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.currentStage ===
          "AwaitingAuthorization"
        ) {
          isAwaitingAuthorisationThere = true;
          awaitingAuthorizationsCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.currentStage ===
          "Rejected"
        ) {
          isRejectedThere = true;
          rejectedCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.currentStage ===
          "Authorised"
        ) {
          isAuthorisedThere = true;
          authorisedCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
      }
      authorisedCredits.push(authorisedCreditsSum);
      issuedCredits.push(issuedCreditsSum);
      transferredCredits.push(transferredCreditsSum);
      retiredCredits.push(retiredCreditsSum);
      if (isAwaitingAuthorisationThere === false) {
        awaitingAuthorizationsCounts.push(0);
      }
      if (isRejectedThere === false) {
        rejectedCounts.push(0);
      }
      if (isAuthorisedThere === false) {
        authorisedCounts.push(0);
      }
    }
    console.table(groupedDataFiltered);
    console.log(timeLabel);
    console.log(groupedDatasObject);
    console.log({
      timeLabel,
      awaitingAuthorizationsCounts,
      rejectedCounts,
      authorisedCounts,
    });
    const result = {
      timeLabel,
      awaitingAuthorizationsCounts,
      rejectedCounts,
      authorisedCounts,
      authorisedCredits,
      issuedCredits,
      transferredCredits,
      retiredCredits,
    };
    return result;
  }

  private async getTimeGroupedDataSectorConverted(data) {
    const passedResult = data;
    const energyCounts = [];
    const healthCounts = [];
    const educationCounts = [];
    const transportCounts = [];
    const manufacturingCounts = [];
    const hospitalityCounts = [];
    const forestryCounts = [];
    const wasteCounts = [];
    const agricultureCounts = [];
    const otherCounts = [];
    const groupedDataFiltered = passedResult?.filter(
      (item) => String(item.time_group) !== "0"
    );
    const groupedDatasObject = groupedDataFiltered.reduce((acc, curr) => {
      const time_group = curr.time_group;
      if (!acc[time_group]) {
        acc[time_group] = [];
      }
      acc[time_group].push(curr);
      return acc;
    }, {});

    const timeLabel = Object.getOwnPropertyNames(groupedDatasObject);
    for (let timeIndex = 0; timeIndex < timeLabel.length; timeIndex++) {
      const arrResultForTimeGroup = groupedDatasObject[timeLabel[timeIndex]];
      let energyThere = false;
      let healthThere = false;
      let educationThere = false;
      let transportThere = false;
      let manufacturingThere = false;
      let hospitalityThere = false;
      let forestryThere = false;
      let wasteThere = false;
      let agricultureThere = false;
      let otherThere = false;
      for (
        let arrResultForTimeGroupIndex = 0;
        arrResultForTimeGroupIndex < arrResultForTimeGroup.length;
        arrResultForTimeGroupIndex++
      ) {
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector === "Energy"
        ) {
          energyThere = true;
          energyCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector === "Health"
        ) {
          healthThere = true;
          healthCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector ===
          "Education"
        ) {
          educationThere = true;
          educationCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector ===
          "Transport"
        ) {
          transportThere = true;
          transportCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector ===
          "Manufacturing"
        ) {
          manufacturingThere = true;
          manufacturingCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector ===
          "Hospitality"
        ) {
          hospitalityThere = true;
          hospitalityCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector ===
          "Forestry"
        ) {
          forestryThere = true;
          forestryCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector === "Waste"
        ) {
          wasteThere = true;
          wasteCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector ===
          "Agriculture"
        ) {
          agricultureThere = true;
          agricultureCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
        if (
          arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector === "Other"
        ) {
          otherThere = true;
          otherCounts.push(
            parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
          );
        }
      }
      if (energyThere === false) {
        energyCounts.push(0);
      }
      if (healthThere === false) {
        healthCounts.push(0);
      }
      if (educationThere === false) {
        educationCounts.push(0);
      }
      if (transportThere === false) {
        transportCounts.push(0);
      }
      if (manufacturingThere === false) {
        manufacturingCounts.push(0);
      }
      if (hospitalityThere === false) {
        hospitalityCounts.push(0);
      }
      if (forestryThere === false) {
        forestryCounts.push(0);
      }
      if (wasteThere === false) {
        wasteCounts.push(0);
      }
      if (agricultureThere === false) {
        agricultureCounts.push(0);
      }
      if (otherThere === false) {
        otherCounts.push(0);
      }
    }

    console.table(groupedDataFiltered);
    console.log(groupedDatasObject);

    const result = {
      timeLabel,
      energyCounts,
      healthCounts,
      educationCounts,
      transportCounts,
      manufacturingCounts,
      hospitalityCounts,
      forestryCounts,
      wasteCounts,
      agricultureCounts,
      otherCounts,
    };

    return result;
  }

  private async genAggregateTypeOrmQuery(
    repo: Repository<any>,
    tableName: string,
    groupBy: string[],
    aggregates: AggrEntry[],
    filterAnd: FilterEntry[],
    filterOr: FilterEntry[],
    sort: SortEntry,
    abilityCondition: string,
    lastTimeForWhere: any,
    timeCol: string,
    timeGroupingCol?: string,
    timeGroupingAccuracy?: string
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
        .map(
          (a) =>
            `${a.operation}(${
              a.outerQuery ? "(" + a.outerQuery + "(" : ""
            }"${tableName}"."${a.key}"${a.outerQuery ? ")s )" : ""}) as ${
              a.fieldName
            }`
        )
        .join(",");
      queryBuild = queryBuild.select(selectQuery);
    }

    if (sort) {
      queryBuild = queryBuild.orderBy(
        sort?.key && `"${sort?.key}"`,
        sort?.order,
        "NULLS LAST"
      );
    }

    let grpByAll = undefined;
    if (groupBy) {
      const groupQuery = groupBy
        .map((gb) => {
          let val;
          if (gb.includes("->>")) {
            const parts = gb.split("->>");
            val = `"${parts[0]}"->>'${parts[1]}'`;
          } else {
            val = `"${gb}"`;
          }
          return `"${tableName}".${val}`;
        })
        .join(",");
      queryBuild = queryBuild.addSelect(groupQuery);
      grpByAll = groupQuery;
    }
    if (timeGroupingCol && timeGroupingAccuracy) {
      const groupQuery = `date_trunc('${timeGroupingAccuracy}', "${timeGroupingCol}") as time_group`;
      queryBuild = queryBuild.addSelect(groupQuery);
      if (!grpByAll) {
        grpByAll = "time_group";
      } else {
        grpByAll += ", time_group";
      }
    }
    if (grpByAll != "") {
      queryBuild = queryBuild.groupBy(grpByAll);
    }

    let d = await queryBuild.getRawMany();
    let dTimeGrouped;

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
    if (timeGroupingCol && timeGroupingAccuracy) {
      if (groupBy[0] === "currentStage") {
        dTimeGrouped = await this.getTimeGroupedDataStatusConverted(d);
      } else {
        dTimeGrouped = await this.getTimeGroupedDataSectorConverted(d);
      }
    }
    return {
      data: timeGroupingCol && timeGroupingAccuracy ? dTimeGrouped : d,
      last: t,
    };
  }

  private async getAllAuthProgramme(
    stat,
    abilityCondition,
    lastTimeForWhere,
    companyId?
  ) {
    let filtAuth = this.getFilterAndByStatFilter(
      stat.statFilter,
      companyId
        ? {
            value: companyId,
            key: "companyId",
            operation: "ANY",
          }
        : undefined
    );

    if (!filtAuth) {
      filtAuth = [];
    }
    filtAuth.push({
      value: ProgrammeStage.AUTHORISED,
      key: "currentStage",
      operation: "=",
    });

    return await this.genAggregateTypeOrmQuery(
      this.programmeRepo,
      "programme",
      null,
      [
        new AggrEntry("programmeId", "COUNT", "count"),
        new AggrEntry("creditEst", "SUM", "sum"),
      ],
      filtAuth,
      null,
      null,
      abilityCondition,
      lastTimeForWhere,
      "createdTime"
    );
  }

  private async getCertifiedByMePrgrammes(
    statFilter,
    companyId,
    certifyField,
    abilityCondition,
    lastTimeForWhere
  ) {
    const filtC = this.getFilterAndByStatFilter(statFilter, {
      value: companyId,
      key: certifyField,
      operation: "ANY",
    });
    return await this.genAggregateTypeOrmQuery(
      this.programmeRepo,
      "programme",
      null,
      [
        new AggrEntry("programmeId", "COUNT", "count"),
        new AggrEntry("creditEst", "SUM", "sum"),
      ],
      filtC,
      null,
      null,
      abilityCondition,
      lastTimeForWhere,
      "createdTime"
    );
  }

  private async getCertifiedProgrammes(
    statFilter,
    abilityCondition,
    lastTimeForWhere,
    companyId,
    cardinalityField,
    frzAgg
  ) {
    let filters = this.getFilterAndByStatFilter(statFilter, {
      value: companyId,
      key: "companyId",
      operation: "ANY",
    });
    if (!filters) {
      filters = [];
    }
    filters.push({
      key: cardinalityField,
      operation: ">",
      value: 0,
      keyOperation: "cardinality",
    });

    console.log("getCertifiedProgrammes");
    return await this.genAggregateTypeOrmQuery(
      this.programmeRepo,
      "programme",
      null,
      [
        new AggrEntry("programmeId", "COUNT", "count"),
        new AggrEntry("creditEst", "SUM", "totalEstCredit"),
        new AggrEntry("creditIssued", "SUM", "totalIssuedCredit"),
        new AggrEntry("creditRetired", "SUM", "totalRetiredCredit"),
        new AggrEntry("creditTransferred", "SUM", "totalTxCredit"),
        frzAgg,
      ],
      filters,
      null,
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

    const frzAgg = new AggrEntry("creditFrozen", "SUM", "totalFreezeCredit");
    frzAgg.outerQuery = "select sum(s) from unnest";

    for (const stat of query.stats) {
      switch (stat.type) {
        case StatType.AGG_PROGRAMME_BY_STATUS:
        case StatType.AGG_PROGRAMME_BY_SECTOR:
        case StatType.MY_AGG_PROGRAMME_BY_STATUS:
        case StatType.MY_AGG_PROGRAMME_BY_SECTOR:
          if (
            [
              StatType.MY_AGG_PROGRAMME_BY_SECTOR,
              StatType.MY_AGG_PROGRAMME_BY_STATUS,
            ].includes(stat.type)
          ) {
            stat.statFilter
              ? (stat.statFilter.onlyMine = true)
              : (stat.statFilter = { onlyMine: true });
          }
          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeRepo,
            "programme",
            [
              StatType.AGG_PROGRAMME_BY_STATUS,
              StatType.MY_AGG_PROGRAMME_BY_STATUS,
            ].includes(stat.type)
              ? ["currentStage"]
              : ["sector"],
            [
              new AggrEntry("programmeId", "COUNT", "count"),
              new AggrEntry("creditEst", "SUM", "totalEstCredit"),
              new AggrEntry("creditIssued", "SUM", "totalIssuedCredit"),
              new AggrEntry("creditBalance", "SUM", "totalBalanceCredit"),
              new AggrEntry("creditRetired", "SUM", "totalRetiredCredit"),
              new AggrEntry("creditTransferred", "SUM", "totalTxCredit"),
              frzAgg,
            ],
            this.getFilterAndByStatFilter(stat.statFilter, {
              value: companyId,
              key: "companyId",
              operation: "ANY",
            }),
            null,
            stat.statFilter?.timeGroup
              ? { key: "time_group", order: "ASC" }
              : null,
            abilityCondition,
            lastTimeForWhere,
            "createdTime",
            stat.statFilter?.timeGroup ? "createdAt" : undefined,
            stat.statFilter?.timeGroup ? "day" : undefined
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
            stat.statFilter.onlyMine = false;
          } else {
            stat.statFilter = { onlyMine: false };
          }
          let filt = this.getFilterAndByStatFilter(stat.statFilter, null);

          const filterOr = [
            {
              value: companyId,
              key:
                stat.type === StatType.PENDING_TRANSFER_INIT
                  ? "initiatorCompanyId"
                  : "toCompanyId",
              operation: "=",
            },
          ];
          if (stat.type === StatType.PENDING_TRANSFER_RECV) {
            filterOr.push({
              value: companyId,
              key: "fromCompanyId",
              operation: "=",
            });
          }
          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeTransferRepo,
            "transfer",
            null,
            [new AggrEntry("requestId", "COUNT", "count")],
            filt,
            filterOr,
            null,
            abilityCondition,
            lastTimeForWhere,
            "txTime"
          );
          break;
        case StatType.CERTIFIED_BY_ME:
        case StatType.REVOKED_BY_ME:
          if (stat.statFilter) {
            stat.statFilter.onlyMine = true;
          } else {
            stat.statFilter = { onlyMine: true };
          }
          if (!results[StatType.ALL_AUTH_PROGRAMMES]) {
            results[StatType.ALL_AUTH_PROGRAMMES] =
              await this.getAllAuthProgramme(
                stat,
                abilityCondition,
                lastTimeForWhere
              );
          }

          if (!results[stat.type]) {
            results[stat.type] = await this.getCertifiedByMePrgrammes(
              stat.statFilter,
              companyId,
              stat.type === StatType.CERTIFIED_BY_ME
                ? "certifierId"
                : "revokedCertifierId",
              abilityCondition,
              lastTimeForWhere
            );
          }

          break;
        case StatType.CERTIFIED_REVOKED_BY_ME:
          if (stat.statFilter) {
            stat.statFilter.onlyMine = true;
          } else {
            stat.statFilter = { onlyMine: true };
          }
          if (!results[StatType.ALL_AUTH_PROGRAMMES]) {
            results[StatType.ALL_AUTH_PROGRAMMES] =
              await this.getAllAuthProgramme(
                stat,
                abilityCondition,
                lastTimeForWhere
              );
          }

          if (!results[StatType.CERTIFIED_BY_ME]) {
            results[StatType.CERTIFIED_BY_ME] =
              await this.getCertifiedByMePrgrammes(
                stat.statFilter,
                companyId,
                "certifierId",
                abilityCondition,
                lastTimeForWhere
              );
          }

          if (!results[StatType.REVOKED_BY_ME]) {
            results[StatType.REVOKED_BY_ME] =
              await this.getCertifiedByMePrgrammes(
                stat.statFilter,
                companyId,
                "revokedCertifierId",
                abilityCondition,
                lastTimeForWhere
              );
          }

          results[stat.type] = {
            last: results[StatType.ALL_AUTH_PROGRAMMES].last,
            data: {
              certifiedSum: Number(
                results[StatType.CERTIFIED_BY_ME].data[0]["sum"]
              ),
              revokedSum: Number(
                results[StatType.REVOKED_BY_ME].data[0]["sum"]
              ),
              uncertifiedSum:
                Number(results[StatType.ALL_AUTH_PROGRAMMES].data[0]["sum"]) -
                Number(results[StatType.REVOKED_BY_ME].data[0]["sum"]) -
                Number(results[StatType.CERTIFIED_BY_ME].data[0]["sum"]),
              certifiedCount: Number(
                results[StatType.CERTIFIED_BY_ME].data[0]["count"]
              ),
              revokedCount: Number(
                results[StatType.REVOKED_BY_ME].data[0]["count"]
              ),
              uncertifiedCount:
                Number(results[StatType.ALL_AUTH_PROGRAMMES].data[0]["count"]) -
                Number(results[StatType.REVOKED_BY_ME].data[0]["count"]) -
                Number(results[StatType.CERTIFIED_BY_ME].data[0]["count"]),
            },
          };

          break;
        case StatType.ALL_AUTH_PROGRAMMES:
          if (!results[StatType.ALL_AUTH_PROGRAMMES]) {
            results[StatType.ALL_AUTH_PROGRAMMES] =
              await this.getAllAuthProgramme(
                stat,
                abilityCondition,
                lastTimeForWhere
              );
          }
          // results[stat.type] = results[StatType.ALL_AUTH_PROGRAMMES];
          break;
        case StatType.CERTIFIED_PROGRAMMES:
        case StatType.REVOKED_PROGRAMMES:
          if (!results[StatType.ALL_AUTH_PROGRAMMES]) {
            results[StatType.ALL_AUTH_PROGRAMMES] =
              await this.getAllAuthProgramme(
                stat,
                abilityCondition,
                lastTimeForWhere
              );
          }
          if (!results[stat.type]) {
            results[stat.type] = await this.getCertifiedProgrammes(
              stat.statFilter,
              abilityCondition,
              lastTimeForWhere,
              companyId,
              stat.type === StatType.CERTIFIED_PROGRAMMES
                ? ["certifierId"]
                : ["revokedCertifierId"],
              frzAgg
            );
          }
          break;
        case StatType.CERTIFIED_REVOKED_PROGRAMMES:
        case StatType.MY_CERTIFIED_REVOKED_PROGRAMMES:
          let allValues;
          if (stat.type === StatType.CERTIFIED_REVOKED_PROGRAMMES) {
            if (!results[StatType.ALL_AUTH_PROGRAMMES]) {
              results[StatType.ALL_AUTH_PROGRAMMES] =
                await this.getAllAuthProgramme(
                  stat,
                  abilityCondition,
                  lastTimeForWhere
                );
            }
            allValues = results[StatType.ALL_AUTH_PROGRAMMES];
            stat.statFilter
              ? (stat.statFilter.onlyMine = false)
              : (stat.statFilter = { onlyMine: false });
          }

          if (stat.type === StatType.MY_CERTIFIED_REVOKED_PROGRAMMES) {
            if (!results[StatType.ALL_AUTH_PROGRAMME_MINE]) {
              results[StatType.ALL_AUTH_PROGRAMME_MINE] =
                await this.getAllAuthProgramme(
                  stat,
                  abilityCondition,
                  lastTimeForWhere,
                  companyId
                );
            }
            allValues = results[StatType.ALL_AUTH_PROGRAMME_MINE];
            stat.statFilter
              ? (stat.statFilter.onlyMine = true)
              : (stat.statFilter = { onlyMine: true });
          }

          if (!results[StatType.REVOKED_PROGRAMMES]) {
            results[StatType.REVOKED_PROGRAMMES] =
              await this.getCertifiedProgrammes(
                stat.statFilter,
                abilityCondition,
                lastTimeForWhere,
                companyId,
                ["revokedCertifierId"],
                frzAgg
              );
          }
          if (!results[StatType.CERTIFIED_PROGRAMMES]) {
            results[StatType.CERTIFIED_PROGRAMMES] =
              await this.getCertifiedProgrammes(
                stat.statFilter,
                abilityCondition,
                lastTimeForWhere,
                companyId,
                ["certifierId"],
                frzAgg
              );
          }
          results[stat.type] = {
            last: allValues.last,
            data: {
              certifiedSum: Number(
                results[StatType.CERTIFIED_PROGRAMMES].data[0]["totalestcredit"]
              ),
              revokedSum: Number(
                results[StatType.REVOKED_PROGRAMMES].data[0]["totalestcredit"]
              ),
              uncertifiedSum:
                Number(allValues.data[0]["sum"]) -
                Number(
                  results[StatType.REVOKED_PROGRAMMES].data[0]["totalestcredit"]
                ) -
                Number(
                  results[StatType.CERTIFIED_PROGRAMMES].data[0][
                    "totalestcredit"
                  ]
                ),
            },
          };
          break;
        case StatType.CERTIFIED_BY_ME_BY_STATE:
        case StatType.CERTIFIED_BY_ME_BY_SECTOR:
          if (stat.statFilter) {
            stat.statFilter.onlyMine = true;
          } else {
            stat.statFilter = { onlyMine: true };
          }
          let filtCState = this.getFilterAndByStatFilter(stat.statFilter, {
            value: companyId,
            key: "certifierId",
            operation: "ANY",
          });

          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeRepo,
            "programme",
            stat.type === StatType.CERTIFIED_BY_ME_BY_STATE
              ? ["currentStage"]
              : ["sector"],
            [
              new AggrEntry("programmeId", "COUNT", "count"),
              new AggrEntry("creditEst", "SUM", "totalEstCredit"),
              new AggrEntry("creditIssued", "SUM", "totalIssuedCredit"),
              new AggrEntry("creditRetired", "SUM", "totalRetiredCredit"),
              new AggrEntry("creditTransferred", "SUM", "totalTxCredit"),
              frzAgg,
            ],
            filtCState,
            null,
            null,
            abilityCondition,
            lastTimeForWhere,
            undefined
          );
          break;
        case StatType.ALL_PROGRAMME_LOCATION:
        case StatType.MY_PROGRAMME_LOCATION:
        case StatType.MY_CERTIFIED_PROGRAMME_LOCATION:
          results[stat.type] = await this.programmeRepo.manager
            .query(`SELECT p."programmeId" as loc, count(*) AS count
            FROM   programme b, jsonb_array_elements(b."geographicalLocationCordintes") p("programmeId")
            ${
              stat.type === StatType.MY_PROGRAMME_LOCATION
                ? `where ${companyId} = ANY(b."companyId")`
                : ""
            }
            ${
              stat.type === StatType.MY_CERTIFIED_PROGRAMME_LOCATION
                ? `where ${companyId} = ANY(b."certifierId")`
                : ""
            }
            GROUP  BY p."programmeId"`);
          break;
        case StatType.ALL_TRANSFER_LOCATION:
        case StatType.MY_TRANSFER_LOCATION:
        case StatType.MY_CERTIFIED_TRANSFER_LOCATION:
          if (stat.type === StatType.MY_TRANSFER_LOCATION) {
            stat.statFilter
              ? (stat.statFilter.onlyMine = true)
              : (stat.statFilter = { onlyMine: true });
          }

          let filtCom = this.getFilterAndByStatFilter(stat.statFilter, {
            value: companyId,
            key: "fromCompanyId",
            operation: "=",
          });
          if (!filtCom) {
            filtCom = [];
          }
          filtCom.push({
            value: "0",
            key: "retirementType",
            operation: "=",
          });
          if (stat.type === StatType.MY_CERTIFIED_TRANSFER_LOCATION)
            filtCom.push({
              value: companyId,
              key: 'certifier"->>"certifierId',
              operation: "ANY",
            });
          results[stat.type] = await this.genAggregateTypeOrmQuery(
            this.programmeTransferRepo,
            "transfer",
            ['toCompanyMeta"->>country'],
            [new AggrEntry("requestId", "COUNT", "count")],
            filtCom,
            null,
            null,
            abilityCondition,
            lastTimeForWhere,
            "txTime"
          );
          break;
      }
    }
    return new DataCountResponseDto(results);
  }
}
