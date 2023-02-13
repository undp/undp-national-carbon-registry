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
import { Stat } from "../shared/dto/stat.dto";
import {
  SectorGroupedByTimedata,
  SectorGroupedByTimedataThere,
} from "../shared/dto/sector.timeGrouped.result";
import { Sector } from "../shared/enum/sector.enum";
import {
  StatusGroupedByTimedata,
  StatusGroupedByTimedataThere,
} from "../shared/dto/programmeStatus.timeGrouped.result";

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
    mineFilter: FilterEntry,
    timeField: string
  ) {
    const filters: FilterEntry[] = [];
    if (statFilter) {
      if (statFilter.startTime) {
        filters.push({
          key: timeField,
          operation: ">=",
          value: statFilter.startTime,
        });
      }
      if (statFilter.endTime) {
        filters.push({
          key: timeField,
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

  private firstLower(lower) {
    return (lower && lower[0].toLowerCase() + lower.slice(1)) || lower;
  }

  private async getTimeGroupedDataStatusConverted(data) {
    const passedResult = data;
    let result: StatusGroupedByTimedata = {
      awaitingAuthorization: [],
      authorised: [],
      rejected: [],
      authorisedCredits: [],
      issuedCredits: [],
      transferredCredits: [],
      retiredCredits: [],
    };
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
    timeLabel?.map((timeLabelItem) => {
      const arrResultForTimeGroup = groupedDatasObject[timeLabelItem];
      let authorisedCreditsSum = 0;
      let issuedCreditsSum = 0;
      let transferredCreditsSum = 0;
      let retiredCreditsSum = 0;
      let resultThere: StatusGroupedByTimedataThere = {
        awaitingAuthorization: false,
        authorised: false,
        rejected: false,
      };
      const statusArray = Object.values(ProgrammeStage);
      arrResultForTimeGroup?.map((timeGroupItem) => {
        console.log("status array ----- > ", statusArray);
        authorisedCreditsSum =
          authorisedCreditsSum +
          (parseFloat(timeGroupItem?.totalestcredit) -
            parseFloat(timeGroupItem?.totalissuedcredit));
        issuedCreditsSum =
          issuedCreditsSum + parseFloat(timeGroupItem?.totalbalancecredit);
        transferredCreditsSum =
          transferredCreditsSum + parseFloat(timeGroupItem?.totaltxcredit);
        retiredCreditsSum =
          retiredCreditsSum + parseFloat(timeGroupItem?.totalretiredcredit);
        statusArray?.map((status) => {
          if (timeGroupItem?.currentStage === status) {
            resultThere[this.firstLower(timeGroupItem?.currentStage)] = true;
            result[this.firstLower(timeGroupItem?.currentStage)]?.push(
              parseInt(timeGroupItem?.count)
            );
          }
        });
      });
      statusArray?.map((status) => {
        if (resultThere[this.firstLower(status)] === false) {
          result[this.firstLower(status)]?.push(0);
        }
      });
      result["authorisedCredits"]?.push(authorisedCreditsSum);
      result["issuedCredits"]?.push(issuedCreditsSum);
      result["transferredCredits"]?.push(transferredCreditsSum);
      result["retiredCredits"]?.push(retiredCreditsSum);
    });

    const resultS = {
      timeLabel,
      ...result,
    };
    return resultS;
  }

  private async getTimeGroupedDataSectorConverted(data) {
    const passedResult = data;
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

    let result: SectorGroupedByTimedata = {
      energy: [],
      health: [],
      education: [],
      transport: [],
      manufacturing: [],
      hospitality: [],
      forestry: [],
      agriculture: [],
      other: [],
    };
    const timeLabel = Object.getOwnPropertyNames(groupedDatasObject);
    for (let timeIndex = 0; timeIndex < timeLabel.length; timeIndex++) {
      const arrResultForTimeGroup = groupedDatasObject[timeLabel[timeIndex]];
      const sectorsArray = Object.values(Sector);
      let resultThere: SectorGroupedByTimedataThere = {
        energy: false,
        health: false,
        education: false,
        transport: false,
        manufacturing: false,
        hospitality: false,
        forestry: false,
        agriculture: false,
        other: false,
      };
      for (
        let arrResultForTimeGroupIndex = 0;
        arrResultForTimeGroupIndex < arrResultForTimeGroup.length;
        arrResultForTimeGroupIndex++
      ) {
        sectorsArray?.map((sector) => {
          if (
            arrResultForTimeGroup[arrResultForTimeGroupIndex]?.sector === sector
          ) {
            resultThere[
              arrResultForTimeGroup[
                arrResultForTimeGroupIndex
              ]?.sector?.toLowerCase()
            ] = true;
            result[
              arrResultForTimeGroup[
                arrResultForTimeGroupIndex
              ]?.sector?.toLowerCase()
            ]?.push(
              parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
            );
          }
        });
      }
      sectorsArray?.map((sector) => {
        if (resultThere[sector?.toLocaleLowerCase()] === false) {
          result[sector?.toLocaleLowerCase()]?.push(0);
        }
      });
    }

    console.table(groupedDataFiltered);
    console.log(groupedDatasObject);

    const resultS = {
      timeLabel,
      ...result,
    };

    return resultS;
  }

  private async calculateTotalCountOfTransferLocations(data) {
    let count = 0;
    if (data?.length > 0) {
      data?.map((item) => {
        count = count + parseInt(item?.count);
      });
    } else {
      count = 0;
    }
    return count;
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
    statCache: any,
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

    const key = grpByAll ? grpByAll : "" + " " + whereC + " from " + tableName;
    if (statCache[key]) {
      return statCache[key];
    }
    let d = await queryBuild.getRawMany();
    let dTimeGrouped;

    let t = 0;
    if (timeCol) {
      const cacheKey = whereC + " from " + tableName;
      if (lastTimeForWhere[cacheKey]) {
        console.log("Last time hit from the cache");
        t = lastTimeForWhere[cacheKey];
      } else {
        t = await this.getLastTime(repo, tableName, whereC, timeCol);
        lastTimeForWhere[cacheKey] = t;
      }
    }
    for (const row of d) {
      for (const k in row) {
        if (row[k] === null) {
          row[k] = 0;
        }
      }
    }
    if (timeGroupingCol && timeGroupingAccuracy && groupBy) {
      console.log("coming into this condition ---- groupBy[0]", groupBy[0]);
      if (groupBy[0] === "currentStage") {
        dTimeGrouped = await this.getTimeGroupedDataStatusConverted(d);
      } else if (groupBy[0] === "sector") {
        dTimeGrouped = await this.getTimeGroupedDataSectorConverted(d);
      }
    } else if (timeGroupingCol && timeGroupingAccuracy) {
      console.log("coming into this condition ---- !groupBy[0]");
      dTimeGrouped = d;
    }
    statCache[key] = {
      data: timeGroupingCol && timeGroupingAccuracy ? dTimeGrouped : d,
      last: t,
    };

    return statCache[key];
  }

  private async getAllAuthProgramme(
    stat,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    timeGroup: boolean,
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
        : undefined,
      "createdTime"
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
      timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      "createdTime",
      timeGroup ? "createdAt" : undefined,
      timeGroup ? "day" : undefined
    );
  }

  private async getCertifiedByMePrgrammes(
    statFilter,
    companyId,
    certifyField,
    abilityCondition,
    lastTimeForWhere,
    statCache
  ) {
    const filtC = this.getFilterAndByStatFilter(
      statFilter,
      {
        value: companyId,
        key: certifyField,
        operation: "ANY",
      },
      "createdTime"
    );
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
      statCache,
      "createdTime"
    );
  }

  private async getCertifiedProgrammes(
    statFilter,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId,
    cardinalityFilters: FilterEntry[],
    frzAgg,
    companyField: string,
    timeGroup?: boolean
  ) {
    let filters = this.getFilterAndByStatFilter(
      statFilter,
      {
        value: companyId,
        key: companyField,
        operation: "ANY",
      },
      "createdTime"
    );
    if (!filters) {
      filters = [];
    }
    for (const fl of cardinalityFilters) {
      filters.push({
        key: fl.key,
        operation: fl.operation,
        value: fl.value,
        keyOperation: "cardinality",
      });
    }

    filters.push({
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
        new AggrEntry("creditEst", "SUM", "totalEstCredit"),
        new AggrEntry("creditIssued", "SUM", "totalIssuedCredit"),
        new AggrEntry("creditRetired", "SUM", "totalRetiredCredit"),
        new AggrEntry("creditTransferred", "SUM", "totalTxCredit"),
        frzAgg,
      ],
      filters,
      null,
      timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      "createdTime",
      timeGroup ? "createdAt" : undefined,
      timeGroup ? "day" : undefined
    );
  }

  async calcStat(
    stat: Stat,
    results,
    frzAgg,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId
  ) {
    const key = stat.key ? stat.key : stat.type;
    switch (stat.type) {
      case StatType.AGG_PROGRAMME_BY_STATUS:
      case StatType.AGG_PROGRAMME_BY_SECTOR:
      case StatType.MY_AGG_PROGRAMME_BY_STATUS:
      case StatType.MY_AGG_PROGRAMME_BY_SECTOR:
        results[key] = await this.generateProgrammeAggregates(
          stat,
          frzAgg,
          abilityCondition,
          lastTimeForWhere,
          statCache,
          companyId
        );
        break;

      case StatType.MY_CREDIT:
        results[key] = await this.getCompanyCredits(companyId);
        break;
      case StatType.PENDING_TRANSFER_INIT:
      case StatType.PENDING_TRANSFER_RECV:
        results[key] = await this.getPendingTxStats(
          stat,
          companyId,
          abilityCondition,
          lastTimeForWhere,
          statCache
        );
        break;
      case StatType.CERTIFIED_BY_ME:
      case StatType.REVOKED_BY_ME:
        stat.statFilter
          ? (stat.statFilter.onlyMine = true)
          : (stat.statFilter = { onlyMine: true });
        results[key] = await this.getCertifiedByMePrgrammes(
          stat.statFilter,
          companyId,
          stat.type === StatType.CERTIFIED_BY_ME
            ? "certifierId"
            : "revokedCertifierId",
          abilityCondition,
          lastTimeForWhere,
          statCache
        );
        break;
      case StatType.CERTIFIED_REVOKED_BY_ME:
      case StatType.UNCERTIFIED_BY_ME:
        if (stat.statFilter) {
          stat.statFilter.onlyMine = true;
        } else {
          stat.statFilter = { onlyMine: true };
        }
        results[key] = await this.getCertifiedStatData(
          results,
          stat,
          abilityCondition,
          lastTimeForWhere,
          statCache,
          companyId,
          StatType.UNCERTIFIED_BY_ME === stat.type
        );
        break;
      case StatType.ALL_AUTH_PROGRAMMES:
        results[key] = await this.getAllAuthProgramme(
          stat,
          abilityCondition,
          lastTimeForWhere,
          statCache,
          stat.statFilter.timeGroup
        );
        break;
      // case StatType.CERTIFIED_PROGRAMMES:
      // case StatType.REVOKED_PROGRAMMES:
      //   if (!results[stat.type]) {
      //     results[stat.type] = await this.getCertifiedProgrammes(
      //       stat.statFilter,
      //       abilityCondition,
      //       lastTimeForWhere,
      //       statCache,
      //       companyId,
      //       stat.type === StatType.CERTIFIED_PROGRAMMES
      //         ? ["certifierId"]
      //         : ["revokedCertifierId"],
      //       frzAgg
      //     );
      //   }
      //   break;
      case StatType.CERTIFIED_REVOKED_PROGRAMMES:
      case StatType.MY_CERTIFIED_REVOKED_PROGRAMMES:
        stat.type === StatType.MY_CERTIFIED_REVOKED_PROGRAMMES &&
        stat.statFilter
          ? (stat.statFilter.onlyMine = true)
          : (stat.statFilter = { onlyMine: true });
        results[key] = await this.getCertifiedRevokedAgg(
          stat,
          results,
          abilityCondition,
          lastTimeForWhere,
          statCache,
          companyId,
          frzAgg
        );
        break;
      case StatType.CERTIFIED_BY_ME_BY_STATE:
      case StatType.CERTIFIED_BY_ME_BY_SECTOR:
        if (stat.statFilter) {
          stat.statFilter.onlyMine = true;
        } else {
          stat.statFilter = { onlyMine: true };
        }
        let filtCState = this.getFilterAndByStatFilter(
          stat.statFilter,
          {
            value: companyId,
            key: "certifierId",
            operation: "ANY",
          },
          "createdTime"
        );

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
          statCache,
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

        let filtCom = this.getFilterAndByStatFilter(
          stat.statFilter,
          {
            value: companyId,
            key: "fromCompanyId",
            operation: "=",
          },
          "txTime"
        );
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
            key: "certifier->>certifierId",
            operation: "ANY",
          });
        results[stat.type] = await this.genAggregateTypeOrmQuery(
          this.programmeTransferRepo,
          "transfer",
          [`toCompanyMeta->>country`],
          [new AggrEntry("requestId", "COUNT", "count")],
          filtCom,
          null,
          null,
          abilityCondition,
          lastTimeForWhere,
          statCache,
          "txTime"
        );
        break;
    }
    return results;
  }

  async getCertifiedRevokedAgg(
    stat: Stat,
    results,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId,
    frzAgg
  ): Promise<any> {
    const revoked = await this.getCertifiedProgrammes(
      stat.statFilter,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      companyId,
      [{ key: "certifierId", operation: "=", value: 0 }],
      frzAgg,
      "revokedCertifierId",
      stat.statFilter?.timeGroup ? true : false
    );

    const allAuth = await this.getAllAuthProgramme(
      stat,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      stat.statFilter?.timeGroup ? true : false
    );

    const certified = await this.getCertifiedProgrammes(
      stat.statFilter,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      companyId,
      [{ key: "certifierId", operation: ">", value: 0 }],
      frzAgg,
      "certifierId",
      stat.statFilter?.timeGroup ? true : false
    );

    // if (!results[StatType.ALL_AUTH_PROGRAMMES]?.data?.length) {
    //   results[StatType.ALL_AUTH_PROGRAMMES]?.data.push({
    //     count: "0",
    //     sum: 0,
    //     time_group: 0,
    //   });
    // }
    // if (!results[StatType.REVOKED_PROGRAMMES]?.data?.length) {
    //   results[StatType.REVOKED_PROGRAMMES]?.data.push({
    //     count: "0",
    //     totalestcredit: 0,
    //     totalissuedcredit: 0,
    //     totalretiredcredit: 0,
    //     totaltxcredit: 0,
    //     totalfreezecredit: 0,
    //     time_group: 0,
    //   });
    // }
    // if (!results[StatType.CERTIFIED_PROGRAMMES]?.data?.length) {
    //   results[StatType.CERTIFIED_PROGRAMMES]?.data.push({
    //     count: "0",
    //     totalestcredit: 0,
    //     totalissuedcredit: 0,
    //     totalretiredcredit: 0,
    //     totaltxcredit: 0,
    //     totalfreezecredit: 0,
    //     time_group: 0,
    //   });
    // }
    return {
      last: Math.max(allAuth.last, certified.last, revoked.last),
      data: {
        certifiedSum: Number(
          certified?.data.length > 0 ? certified?.data[0]["totalestcredit"] : 0
        ),
        revokedSum: Number(
          revoked?.data.length > 0 ? revoked.data[0]["totalestcredit"] : 0
        ),
        uncertifiedSum:
          Number(allAuth?.data.length > 0 ? allAuth?.data[0]["sum"] : 0) -
          Number(
            certified?.data.length > 0
              ? certified?.data[0]["totalestcredit"]
              : 0
          ) -
          Number(
            revoked?.data.length > 0 ? revoked.data[0]["totalestcredit"] : 0
          ),
      },
    };
  }

  // async getMultipleStats(sourceStats: Stat[], newStat: Stat, results, frzAgg, abilityCondition, lastTimeForWhere, companyId, aggFunc: any) {
  //   for (const s of sourceStats) {
  //     if (!results[s.type]) {
  //       results = this.calcStat(s, results, frzAgg, abilityCondition, lastTimeForWhere, companyId);
  //     }
  //   }
  //   results[newStat.type] = aggFunc(results);
  // }

  async getAggregateQuery(
    abilityCondition: string,
    query: StatList,
    companyId: any
  ): Promise<DataCountResponseDto> {
    let results = {};
    let lastTimeForWhere = {};
    let statCache = {};

    const frzAgg = new AggrEntry("creditFrozen", "SUM", "totalFreezeCredit");
    frzAgg.outerQuery = "select sum(s) from unnest";

    for (const stat of query.stats) {
      await this.calcStat(
        stat,
        results,
        frzAgg,
        abilityCondition,
        lastTimeForWhere,
        statCache,
        companyId
      );
    }
    return new DataCountResponseDto(results);
  }

  async getCertifiedStatData(
    results,
    stat,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId,
    onlyUncertified
  ): Promise<any> {
    const allAuth = await this.getAllAuthProgramme(
      stat,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      false
    );
    const certified = await this.getCertifiedByMePrgrammes(
      stat.statFilter,
      companyId,
      "certifierId",
      abilityCondition,
      lastTimeForWhere,
      statCache
    );

    if (!onlyUncertified) {
      const revoked = await this.getCertifiedByMePrgrammes(
        stat.statFilter,
        companyId,
        "revokedCertifierId",
        abilityCondition,
        lastTimeForWhere,
        statCache
      );

      return {
        last: Math.max(revoked.last, certified.last, allAuth.last),
        data: {
          certifiedSum: Number(certified.data[0]["sum"]),
          uncertifiedSum:
            Number(allAuth.data[0]["sum"]) -
            Number(revoked.data[0]["sum"]) -
            Number(certified.data[0]["sum"]),
          certifiedCount: Number(certified.data[0]["count"]),
          revokedCount: Number(revoked.data[0]["count"]),
          uncertifiedCount:
            Number(allAuth.data[0]["count"]) -
            Number(revoked.data[0]["count"]) -
            Number(certified.data[0]["count"]),
        },
      };
    } else {
      return {
        last: Math.max(certified.last, allAuth.last),
        data: {
          uncertifiedSum:
            Number(allAuth.data[0]["sum"]) - Number(certified.data[0]["sum"]),
          uncertifiedCount:
            Number(allAuth.data[0]["count"]) -
            Number(certified.data[0]["count"]),
        },
      };
    }
  }

  async getCompanyCredits(companyId: any) {
    const comp = await this.companyRepo.findOne({
      where: {
        companyId: companyId,
      },
    });
    return {
      data: {
        primary: comp ? comp.creditBalance : 0,
        secondary: comp ? comp.secondaryAccountBalance : 0,
      },
      last: comp.creditTxTime,
    };
  }
  async getPendingTxStats(
    stat,
    companyId,
    abilityCondition,
    lastTimeForWhere,
    statCache
  ) {
    if (stat.statFilter) {
      stat.statFilter.onlyMine = false;
    } else {
      stat.statFilter = { onlyMine: false };
    }
    let filt = this.getFilterAndByStatFilter(stat.statFilter, null, "txTime");

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
    return await this.genAggregateTypeOrmQuery(
      this.programmeTransferRepo,
      "transfer",
      null,
      [new AggrEntry("requestId", "COUNT", "count")],
      filt,
      filterOr,
      null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      "txTime"
    );
  }
  async generateProgrammeAggregates(
    stat,
    frzAgg,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId
  ) {
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
    return await this.genAggregateTypeOrmQuery(
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
      this.getFilterAndByStatFilter(
        stat.statFilter,
        {
          value: companyId,
          key: "companyId",
          operation: "ANY",
        },
        "createdTime"
      ),
      null,
      stat.statFilter?.timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      "createdTime",
      stat.statFilter?.timeGroup ? "createdAt" : undefined,
      stat.statFilter?.timeGroup ? "day" : undefined
    );
  }
}
