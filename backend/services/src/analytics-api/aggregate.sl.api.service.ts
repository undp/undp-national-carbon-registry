import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StatList } from "../dto/stat.list.dto";
import { StatType } from "../enum/stat.type.enum";
import { ProgrammeTransferViewEntityQuery } from "../entities/programmeTransfer.view.entity";
import { QueryDto } from "../dto/query.dto";
import { FilterEntry } from "../dto/filter.entry";
import { SortEntry } from "../dto/sort.entry";
import { AggrEntry } from "../dto/aggr.entry";
import { Company } from "../entities/company.entity";
import { StatFilter } from "../dto/stat.filter";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { Stat } from "../dto/stat.dto";
import { Sector } from "../enum/sector.enum";
import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";
import { HelperService } from "../util/helpers.service";
import { Programme } from "../entities/programme.entity";
import {
  StatusGroupedByTimedata,
  StatusGroupedByTimedataThere,
} from "../dto/programmeStatus.timeGrouped.result";
import { CompanyRole } from "../enum/company.role.enum";
import { TransferStatus } from "../enum/transform.status.enum";
import { DataCountResponseDto } from "../dto/data.count.response";
import { InvestmentView } from "../entities/investment.view.entity";
import { NDCActionViewEntity } from "../entities/ndc.view.entity";
import { InvestmentStatus } from "../enum/investment.status";
import { SYSTEM_TYPE } from "../enum/system.names.enum";
import { Emission } from "src/entities/emission.entity";
import { Projection } from "src/entities/projection.entity";
import { EventLog } from "src/entities/event.log.entity";
import {
  EmissionSubSectorsPathMap,
  EmissionSubSectorsToSectoralScopeMap,
} from "src/enum/sectoral.scope.enum";
import { ProjectProposalStage } from "src/enum/projectProposalStage.enum";
import { ProgrammeSl } from "src/entities/programmeSl.entity";
import { ProjectCategory } from "src/enum/projectCategory.enum";
import { VerificationRequestEntity } from "../entities/verification.request.entity";
import { User } from "../entities/user.entity";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { SLDashboardProjectStage } from "../enum/slDashboardProjectStage.enum";
import { DataResponseDto } from "src/dto/data.response.dto";
import { CreditRetirementSlView } from "src/entities/creditRetirementSl.view.entity";
import { ProgrammeAuditLogSl } from "src/entities/programmeAuditLogSl.entity";

@Injectable()
export class AggregateSlAPIService {
  private timeDropFields = [
    "certifierId",
    "companyId",
    "revokedCertifierId",
    "toCompanyId",
    "fromCompanyId",
    "programmeCertifierId",
    "initiatorCompanyId",
    "isRetirement",
    "createdTime",
    "status",
  ];

  constructor(
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(InvestmentView) private investmentRepo: Repository<InvestmentView>,
    @InjectRepository(NDCActionViewEntity) private ndcRepo: Repository<NDCActionViewEntity>,
    @InjectRepository(ProgrammeTransferViewEntityQuery)
    private programmeTransferRepo: Repository<ProgrammeTransferViewEntityQuery>,
    @InjectRepository(Emission) private emissionRepo: Repository<Emission>,
    @InjectRepository(Projection) private projectionRepo: Repository<Projection>,
    @InjectRepository(EventLog) private eventLogRepo: Repository<EventLog>,
    @InjectRepository(ProgrammeSl) private programmeSlRepo: Repository<ProgrammeSl>,
    @InjectRepository(VerificationRequestEntity)
    private verificationRequestRepo: Repository<VerificationRequestEntity>,
    @InjectRepository(CreditRetirementSl)
    private creditRetirementSlRequestRepo: Repository<CreditRetirementSl>,
    @InjectRepository(CreditRetirementSlView)
    private creditRetirementSlViewRepo: Repository<CreditRetirementSlView>,
    @InjectRepository(ProgrammeAuditLogSl)
    private programmeSlAuditLogRepo: Repository<ProgrammeAuditLogSl>
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
      .orderBy(`"${timeCol}"`, "DESC", "NULLS LAST")
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
      frozenCredits: [],
    };
    const groupedDataFiltered = passedResult?.filter((item) => String(item.time_group) !== "0");
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

      result["awaitingAuthorization"]?.push(0);
      result["authorised"]?.push(0);
      result["rejected"]?.push(0);
      let authorisedCreditsSum = 0;
      let issuedCreditsSum = 0;
      let transferredCreditsSum = 0;
      let retiredCreditsSum = 0;
      let frozenCreditsSum = 0;
      let resultThere: StatusGroupedByTimedataThere = {
        awaitingAuthorization: false,
        authorised: false,
        rejected: false,
      };
      const statusArray = Object.values(ProjectProposalStage);
      arrResultForTimeGroup?.map((timeGroupItem) => {
        console.log("status array ----- > ", statusArray);
        if (timeGroupItem?.projectProposalStage === ProjectProposalStage.AUTHORISED) {
          authorisedCreditsSum =
            authorisedCreditsSum +
            (parseFloat(timeGroupItem?.totalestcredit) -
              (parseFloat(timeGroupItem?.totalissuedcredit) +
                parseFloat(timeGroupItem?.totalretiredcredit) +
                parseFloat(timeGroupItem?.totaltxcredit)));
        } else {
          authorisedCreditsSum = authorisedCreditsSum + 0;
        }
        issuedCreditsSum = issuedCreditsSum + parseFloat(timeGroupItem?.totalissuedcredit);
        // -
        // parseFloat(timeGroupItem?.totalretiredcredit) -
        // parseFloat(timeGroupItem?.totaltxcredit) -
        // parseFloat(timeGroupItem?.totalfreezecredit);
        transferredCreditsSum = transferredCreditsSum + parseFloat(timeGroupItem?.totaltxcredit);
        retiredCreditsSum = retiredCreditsSum + parseFloat(timeGroupItem?.totalretiredcredit);
        frozenCreditsSum = frozenCreditsSum + parseFloat(timeGroupItem?.totalfreezecredit);
        // statusArray?.map((status) => {
        let count = 0;
        switch (timeGroupItem.projectProposalStage) {
          case "SUBMITTED_INF":
          case "APPROVED_INF":
          case "SUBMITTED_COST_QUOTATION":
          case "SUBMITTED_PROPOSAL":
          case "SUBMITTED_VALIDATION_AGREEMENT":
          case "ACCEPTED_PROPOSAL":
          case "SUBMITTED_CMA":
          case "REJECTED_CMA":
          case "APPROVED_CMA":
          case "VALIDATION_PENDING":
          case "REJECTED_VALIDATION":
            resultThere["awaitingAuthorization"] = true;
            if (result["awaitingAuthorization"].length > 0) {
              count = result["awaitingAuthorization"].pop();
            }

            result["awaitingAuthorization"].push(count + parseInt(timeGroupItem?.count));
            break;
          case "REJECTED_INF":
          case "REJECTED_PROPOSAL":
            resultThere["rejected"] = true;

            if (result["rejected"].length > 0) {
              count = result["rejected"].pop();
            }

            result["rejected"].push(count + parseInt(timeGroupItem?.count));
            break;
          case "AUTHORISED":
            resultThere["authorised"] = true;

            if (result["authorised"].length > 0) {
              count = result["authorised"].pop();
            }

            result["authorised"].push(count + parseInt(timeGroupItem?.count));
            break;
        }
        // if (timeGroupItem?.projectProposalStage === status) {
        //   resultThere[this.firstLower(timeGroupItem?.projectProposalStage)] = true;

        //   result[this.firstLower(timeGroupItem?.projectProposalStage)]?.push(
        //     parseInt(timeGroupItem?.count)
        //   );
        // }
        // });
      });
      // statusArray?.map((status) => {
      //   if (resultThere[this.firstLower(status)] === false) {
      //     result[this.firstLower(status)]?.push(0);
      //   }
      // });
      result["authorisedCredits"]?.push(authorisedCreditsSum);
      result["issuedCredits"]?.push(issuedCreditsSum);
      result["transferredCredits"]?.push(transferredCreditsSum);
      result["retiredCredits"]?.push(retiredCreditsSum);
      result["frozenCredits"]?.push(frozenCreditsSum);
    });

    const resultS = {
      timeLabel,
      ...result,
    };
    return resultS;
  }

  private async getTimeGroupedDataSectorConverted(data) {
    const passedResult = data;
    const groupedDataFiltered = passedResult?.filter((item) => String(item.time_group) !== "0");
    const groupedDatasObject = groupedDataFiltered.reduce((acc, curr) => {
      const time_group = curr.time_group;
      if (!acc[time_group]) {
        acc[time_group] = [];
      }
      acc[time_group].push(curr);
      return acc;
    }, {});
    let result: any = {};
    const sectorsArray = Object.values(ProjectCategory);
    sectorsArray?.map((sector) => {
      result[sector] = [];
    });
    const timeLabel = Object.getOwnPropertyNames(groupedDatasObject);

    for (let timeIndex = 0; timeIndex < timeLabel.length; timeIndex++) {
      const arrResultForTimeGroup = groupedDatasObject[timeLabel[timeIndex]];

      let resultThere: any = {};
      const sectorsArray = Object.values(ProjectCategory);
      sectorsArray?.map((sector) => {
        resultThere[sector] = false;
      });
      for (
        let arrResultForTimeGroupIndex = 0;
        arrResultForTimeGroupIndex < arrResultForTimeGroup.length;
        arrResultForTimeGroupIndex++
      ) {
        sectorsArray?.map((sector) => {
          if (arrResultForTimeGroup[arrResultForTimeGroupIndex]?.projectCategory === sector) {
            resultThere[arrResultForTimeGroup[arrResultForTimeGroupIndex]?.projectCategory] = true;
            result[arrResultForTimeGroup[arrResultForTimeGroupIndex]?.projectCategory]?.push(
              parseInt(arrResultForTimeGroup[arrResultForTimeGroupIndex]?.count)
            );
          }
        });
      }
      sectorsArray?.map((sector) => {
        if (resultThere[sector] === false) {
          result[sector].push(0);
        }
      });
    }

    const resultS = {
      timeLabel,
      ...result,
    };

    return resultS;
  }

  private async programmeLocationDataFormatter(data, groupField?) {
    const locationData = [...data];
    let locationsGeoData: any = {};
    let features: any[] = [];
    locationsGeoData.type = "FeatureCollection";
    locationData?.map((locationDataItem, index) => {
      if (locationDataItem?.loc && locationDataItem !== null) {
        let programmeGeoData: any = {};
        let location: any = locationDataItem?.loc;
        programmeGeoData.type = "Feature";
        let properties: any = {};
        let geometry: any = {};
        properties.id = String(index);
        properties.count = locationDataItem?.count;
        if (groupField !== undefined) {
          if (locationDataItem[groupField] == null) {
            properties[groupField] = "Unknown";
          } else {
            properties[groupField] = locationDataItem[groupField];
          }
        } else {
          properties.stage = locationDataItem?.stage;
        }
        geometry.type = "Point";
        geometry.coordinates = location;
        programmeGeoData.properties = properties;
        programmeGeoData.geometry = geometry;
        features.push(programmeGeoData);
      }
    });

    locationsGeoData.features = [...features];
    return locationsGeoData;
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
    timeCol: string[],
    timeGroupingCol?: string,
    timeGroupingAccuracy?: string,
    keepTimeFields?: string[]
  ) {
    const query = new QueryDto();
    query.filterAnd = filterAnd;
    query.filterOr = filterOr;
    query.sort = sort;

    const timeFields = [...timeCol];

    for (const t of this.timeDropFields) {
      if (keepTimeFields && keepTimeFields.indexOf(t) >= 0) {
        continue;
      }
      timeFields.push(t);
    }

    const whereC = this.helperService.generateWhereSQL(
      query,
      this.helperService.parseMongoQueryToSQLWithTable(tableName, abilityCondition)
    );

    const timeWhere = this.helperService.generateWhereSQL(
      query,
      this.helperService.parseMongoQueryToSQLWithTable(tableName, abilityCondition),
      undefined,
      timeFields
    );

    let queryBuild = repo.createQueryBuilder(tableName).where(whereC);

    if (aggregates) {
      const selectQuery = aggregates
        .map((a) => {
          const fieldCol = `${a.outerQuery ? "(" + a.outerQuery + "(" : ""}"${tableName}"."${
            a.key
          }"${a.outerQuery ? ")s )" : ""}`;

          let mineCompField = fieldCol;
          if (a.mineCompanyId) {
            queryBuild.andWhere(`${tableName}."companyId" = :mineCompanyId`, {
              mineCompanyId: a.mineCompanyId,
            });
            // mineCompField = ["creditTransferred", "creditRetired", "creditFrozen"].includes(a.key)
            //   ? `"${tableName}"."${a.key}"[array_position("${tableName}"."companyId", ${a.mineCompanyId})]`
            //   : `"${tableName}"."${
            //       a.key === "creditBalance" ? "creditOwnerPercentage" : "proponentPercentage"
            //     }"[array_position("${tableName}"."companyId", ${a.mineCompanyId})]*${fieldCol}/100`;
          }
          return `${a.operation}(${mineCompField}) as ${a.fieldName}`;
        })
        .join(",");
      queryBuild = queryBuild.select(selectQuery);
    }

    if (sort) {
      queryBuild = queryBuild.orderBy(sort?.key && `"${sort?.key}"`, sort?.order, "NULLS LAST");
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
      const groupSelectQuery = groupBy
        .map((gb) => {
          let val;
          if (gb.includes("->>")) {
            const parts = gb.split("->>");
            val = `"${parts[0]}"->>'${parts[1]}' as ${parts[1]}`;
          } else {
            val = `"${gb}"`;
          }
          return `"${tableName}".${val}`;
        })
        .join(",");
      queryBuild = queryBuild.addSelect(groupSelectQuery);
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

    const key = (grpByAll ? grpByAll : "") + " " + whereC + " from " + tableName + " " + timeWhere;
    console.log("Stat cache key", key);
    if (statCache[key]) {
      return statCache[key];
    }
    let d = await queryBuild.getRawMany();
    let dTimeGrouped;

    let lastTime: any;
    if (timeCol) {
      const allTimes = {};
      let maxTime = 0;
      let colTime;
      for (const tc of timeCol) {
        const cacheKey = timeWhere + " " + tc + " from " + tableName;
        console.log("Cache key", cacheKey);
        if (lastTimeForWhere[cacheKey]) {
          console.log("Last time hit from the cache");
          colTime = lastTimeForWhere[cacheKey];
        } else {
          colTime = await this.getLastTime(repo, tableName, timeWhere, tc);
          lastTimeForWhere[cacheKey] = colTime;
        }
        allTimes[tc] = colTime;
        if (colTime > maxTime) {
          maxTime = colTime;
        }
        lastTime = {
          max: maxTime,
          all: allTimes,
        };
      }
    }
    for (const row of d) {
      for (const k in row) {
        if (row[k] === null) {
          row[k] = 0;
        } else if (row[k] !== undefined && !isNaN(row[k]) && row[k] % 1 !== 0) {
          row[k] = parseFloat(Number(row[k]).toFixed(PRECISION));
        }
      }
    }
    if (timeGroupingCol && timeGroupingAccuracy && groupBy) {
      console.log("coming into this condition ---- groupBy[0]", groupBy[0]);
      if (groupBy[0] === "projectProposalStage") {
        dTimeGrouped = await this.getTimeGroupedDataStatusConverted(d);
      } else if (groupBy[0] === "projectCategory") {
        dTimeGrouped = await this.getTimeGroupedDataSectorConverted(d);
      }
    } else if (timeGroupingCol && timeGroupingAccuracy) {
      console.log("coming into this condition ---- !groupBy[0]");
      const map = {};
      for (const en of d) {
        if (!map[en.time_group]) {
          map[en.time_group] = [];
        }
        map[en.time_group].push(en);
      }
      dTimeGrouped = map;
    }
    statCache[key] = {
      data: timeGroupingCol && timeGroupingAccuracy ? dTimeGrouped : d,
      last: lastTime.max,
    };

    if (lastTime.all && Object.keys(lastTime.all).length > 0) {
      statCache[key]["all"] = lastTime.all;
    }

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
        {
          key: "creditEst",
          operation: "SUM",
          fieldName: "sum",
          mineCompanyId: stat?.statFilter?.onlyMine && companyId ? companyId : undefined,
        },
      ],
      filtAuth,
      null,
      timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["statusUpdateTime", "authTime"],
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
    statCache,
    companyRole,
    timeGroup?: boolean
  ) {
    let filtC = this.getFilterAndByStatFilter(
      statFilter,
      {
        value: companyId,
        key: certifyField,
        operation: "ANY",
      },
      "createdTime"
    );

    if (!filtC) {
      filtC = [];
    }
    filtC.push({
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
        {
          key: "creditEst",
          operation: "SUM",
          fieldName: "sum",
          mineCompanyId:
            statFilter?.onlyMine && companyId && companyRole === CompanyRole.PROGRAMME_DEVELOPER
              ? companyId
              : undefined,
        },
      ],
      filtC,
      null,
      null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["certifiedTime"],
      timeGroup ? "createdAt" : undefined,
      timeGroup ? "day" : undefined
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
    companyRole: CompanyRole,
    timeGroup?: boolean
  ) {
    let filters = this.getFilterAndByStatFilter(statFilter, null, "createdTime");
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

    let filterOr = undefined;
    if (statFilter && statFilter.onlyMine) {
      filterOr = [
        {
          value: companyId,
          key: companyField,
          operation: "ANY",
        },
        {
          value: companyId,
          key: "companyId",
          operation: "ANY",
        },
      ];
    }

    frzAgg.mineCompanyId =
      statFilter?.onlyMine && companyRole === CompanyRole.PROGRAMME_DEVELOPER
        ? companyId
        : undefined;
    return await this.genAggregateTypeOrmQuery(
      this.programmeRepo,
      "programme",
      null,
      [
        new AggrEntry("programmeId", "COUNT", "count"),
        {
          key: "creditEst",
          operation: "SUM",
          fieldName: "totalEstCredit",
          mineCompanyId: frzAgg.mineCompanyId,
        },
        {
          key: "creditIssued",
          operation: "SUM",
          fieldName: "totalIssuedCredit",
          mineCompanyId: frzAgg.mineCompanyId,
        },
        {
          key: "creditBalance",
          operation: "SUM",
          fieldName: "totalBalanceCredit",
          mineCompanyId: frzAgg.mineCompanyId,
        },
        {
          key: "creditRetired",
          operation: "SUM",
          fieldName: "totalRetiredCredit",
          mineCompanyId: frzAgg.mineCompanyId,
          outerQuery: "select sum(s) from unnest",
        },
        {
          key: "creditTransferred",
          operation: "SUM",
          fieldName: "totalTxCredit",
          mineCompanyId: frzAgg.mineCompanyId,
          outerQuery: "select sum(s) from unnest",
        },
        frzAgg,
      ],
      filters,
      filterOr,
      timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["certifiedTime"],
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
    companyId,
    companyRole,
    system: SYSTEM_TYPE
  ) {
    const key = stat.key ? stat.key : stat.type;
    console.log(stat.type);
    switch (system) {
      // case SYSTEM_TYPE.CARBON_TRANSPARENCY:
      //   switch (stat.type) {
      //     case StatType.MY_AGG_PROGRAMME_BY_SECTOR:
      //     case StatType.AGG_PROGRAMME_BY_SECTOR:
      //       results[key] = await this.generateProgrammeAggregates(
      //         stat,
      //         frzAgg,
      //         abilityCondition,
      //         lastTimeForWhere,
      //         statCache,
      //         companyId
      //       );
      //       break;
      //     case StatType.MY_AGG_INVESTMENT_BY_TYPE:
      //     case StatType.AGG_INVESTMENT_BY_TYPE:
      //       results[key] = await this.generateInvestmentAggregates(
      //         stat,
      //         abilityCondition,
      //         lastTimeForWhere,
      //         statCache,
      //         companyId
      //       );
      //       break;
      //     case StatType.MY_AGG_NDC_ACTION_BY_SECTOR:
      //     case StatType.AGG_NDC_ACTION_BY_SECTOR:
      //     case StatType.MY_AGG_NDC_ACTION_BY_TYPE:
      //     case StatType.AGG_NDC_ACTION_BY_TYPE:
      //       results[key] = await this.generateNDCAggregates(
      //         stat,
      //         abilityCondition,
      //         lastTimeForWhere,
      //         statCache,
      //         companyId
      //       );
      //       break;
      //     case StatType.MY_TOTAL_EMISSIONS:
      //     case StatType.TOTAL_EMISSIONS:
      //       results[key] = await this.getEmissions(
      //         stat,
      //         companyId,
      //         abilityCondition,
      //         lastTimeForWhere,
      //         statCache
      //       );
      //       break;
      //     case StatType.PROGRAMME_LOCATION:
      //     case StatType.MY_PROGRAMME_LOCATION: //conflict with existing
      //       if (stat.type === StatType.MY_PROGRAMME_LOCATION) {
      //         stat.statFilter
      //           ? (stat.statFilter.onlyMine = true)
      //           : (stat.statFilter = { onlyMine: true });
      //       }
      //       const whereC = [];
      //       whereC.push(`p."programmeId" != 'null'`);
      //       if (stat.statFilter && stat.statFilter.onlyMine) {
      //         whereC.push(
      //           `(${companyId} = ANY(b."companyId") or ${companyId} = ANY(b."certifierId"))`
      //         );
      //       }
      //       if (stat.statFilter && stat.statFilter.startTime) {
      //         whereC.push(`"createdTime" >= ${stat.statFilter.startTime}`);
      //       }
      //       if (stat.statFilter && stat.statFilter.endTime) {
      //         whereC.push(`"createdTime" <= ${stat.statFilter.endTime}`);
      //       }

      //       console.log(
      //         "Query",
      //         `SELECT p."programmeId" as loc, b."currentStage" as stage, count(*) AS count
      //       FROM   programme b, jsonb_array_elements(b."geographicalLocationCordintes") p("programmeId")
      //       ${whereC.length > 0 ? " where " : " "}
      //       ${whereC.join(" and ")}
      //       GROUP  BY p."programmeId", b."currentStage"`
      //       );

      //       const resultsProgrammeLocations = await this.programmeRepo.manager
      //         .query(`SELECT p."programmeId" as loc, b."currentStage" as stage, count(*) AS count
      //         FROM   programme b, jsonb_array_elements(b."geographicalLocationCordintes") p("programmeId")
      //         ${whereC.length > 0 ? " where " : " "}
      //         ${whereC.join(" and ")}
      //         GROUP  BY p."programmeId", b."currentStage"`);
      //       results[key] = await this.programmeLocationDataFormatter(
      //         resultsProgrammeLocations,
      //         "stage"
      //       );
      //       results[key]["last"] = await this.getProgrammeLocationTime(
      //         whereC.slice(1),
      //         lastTimeForWhere
      //       );
      //       break;
      //     case StatType.INVESTMENT_LOCATION:
      //     case StatType.MY_INVESTMENT_LOCATION:
      //       if (stat.type === StatType.MY_INVESTMENT_LOCATION) {
      //         stat.statFilter
      //           ? (stat.statFilter.onlyMine = true)
      //           : (stat.statFilter = { onlyMine: true });
      //       }
      //       const whereCW = [];
      //       whereCW.push(`p."requestId" != 'null'`);
      //       if (stat.statFilter && stat.statFilter.onlyMine) {
      //         whereCW.push(`${companyId} = b."fromCompanyId"`);
      //       }
      //       if (stat.statFilter && stat.statFilter.startTime) {
      //         whereCW.push(`"createdTime" >= ${stat.statFilter.startTime}`);
      //       }
      //       if (stat.statFilter && stat.statFilter.endTime) {
      //         whereCW.push(`"createdTime" <= ${stat.statFilter.endTime}`);
      //       }

      //       whereCW.push(`status = '${InvestmentStatus.APPROVED}'`);

      //       const query = `SELECT p."requestId" as loc, b."type" as type, count(*) AS count
      //       FROM  investment_view b, jsonb_array_elements(b."toGeo") p("requestId")
      //       ${whereCW.length > 0 ? " where " : " "}
      //       ${whereCW.join(" and ")}
      //       GROUP  BY p."requestId", b."type"`;

      //       console.log("INVESTMENT_LOCATION query", query);
      //       const resultsProgrammeLocationsI = await this.investmentRepo.manager.query(query);

      //       console.log("INVESTMENT_LOCATION resp", resultsProgrammeLocationsI);
      //       results[key] = await this.programmeLocationDataFormatter(
      //         resultsProgrammeLocationsI,
      //         "type"
      //       );
      //       results[key]["last"] = await this.getInvestmentLocationTime(
      //         whereCW.slice(1),
      //         lastTimeForWhere
      //       );
      //       break;
      //   }
      //   break;
      case SYSTEM_TYPE.CARBON_REGISTRY:
        switch (stat.type) {
          case StatType.AGG_PROGRAMME_BY_STATUS:
          case StatType.AGG_PROGRAMME_BY_SECTOR:
          case StatType.MY_AGG_PROGRAMME_BY_STATUS:
          case StatType.MY_AGG_PROGRAMME_BY_SECTOR:
          case StatType.AGG_AUTH_PROGRAMME_BY_STATUS:
          case StatType.MY_AGG_AUTH_PROGRAMME_BY_STATUS:
            results[key] = await this.generateProgrammeAggregates(
              stat,
              frzAgg,
              abilityCondition,
              lastTimeForWhere,
              statCache,
              companyId
            );
            break;
          // case StatType.MY_CREDIT:
          //   results[key] = await this.getCompanyCredits(companyId);
          //   break;
          // case StatType.PENDING_TRANSFER_INIT:
          // case StatType.PENDING_TRANSFER_RECV:
          //   results[key] = await this.getPendingTxStats(
          //     stat,
          //     companyId,
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache
          //   );
          //   break;
          // case StatType.CERTIFIED_BY_ME:
          // case StatType.REVOKED_BY_ME:
          //   stat.statFilter
          //     ? (stat.statFilter.onlyMine = true)
          //     : (stat.statFilter = { onlyMine: true });
          //   const d1 = await this.getCertifiedByMePrgrammes(
          //     stat.statFilter,
          //     companyId,
          //     stat.type === StatType.CERTIFIED_BY_ME ? "certifierId" : "revokedCertifierId",
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     undefined
          //   );
          //   const d2 = await this.getCertifiedByMePrgrammes(
          //     stat.statFilter,
          //     companyId,
          //     stat.type === StatType.CERTIFIED_BY_ME ? "revokedCertifierId" : "certifierId",
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     undefined
          //   );
          //   d1.last = Math.max(d1.last, d2.last);
          //   results[key] = d1;
          //   break;
          // case StatType.CERTIFIED_REVOKED_BY_ME:
          // case StatType.UNCERTIFIED_BY_ME:
          //   if (stat.statFilter) {
          //     stat.statFilter.onlyMine = true;
          //   } else {
          //     stat.statFilter = { onlyMine: true };
          //   }
          //   results[key] = await this.getCertifiedStatData(
          //     results,
          //     stat,
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     companyId,
          //     StatType.UNCERTIFIED_BY_ME === stat.type,
          //     companyRole
          //   );
          //   break;
          // case StatType.ALL_AUTH_PROGRAMMES:
          //   results[key] = await this.getAllAuthProgramme(
          //     stat,
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     stat.statFilter.timeGroup
          //   );
          //   break;
          // case StatType.CERTIFIED_REVOKED_PROGRAMMES:
          // case StatType.MY_CERTIFIED_REVOKED_PROGRAMMES:
          //   if (stat.type === StatType.MY_CERTIFIED_REVOKED_PROGRAMMES) {
          //     stat.statFilter
          //       ? (stat.statFilter.onlyMine = true)
          //       : (stat.statFilter = { onlyMine: true });
          //   }
          //   results[key] = await this.getCertifiedRevokedAgg(
          //     stat,
          //     results,
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     companyId,
          //     frzAgg,
          //     companyRole
          //   );
          //   break;
          // case StatType.CERTIFIED_BY_ME_BY_STATE:
          // case StatType.CERTIFIED_BY_ME_BY_SECTOR:
          // case StatType.AUTH_CERTIFIED_BY_ME_BY_STATE:
          //   if (stat.statFilter) {
          //     stat.statFilter.onlyMine = true;
          //   } else {
          //     stat.statFilter = { onlyMine: true };
          //   }
          //   let filtCState = this.getFilterAndByStatFilter(
          //     stat.statFilter,
          //     {
          //       value: companyId,
          //       key: "certifierId",
          //       operation: "ANY",
          //     },
          //     "createdTime"
          //   );

          //   if (stat.type === StatType.AUTH_CERTIFIED_BY_ME_BY_STATE) {
          //     if (!filtCState) {
          //       filtCState = [];
          //     }
          //     filtCState.push({
          //       value: ProgrammeStage.AUTHORISED,
          //       key: "currentStage",
          //       operation: "=",
          //     });
          //   }

          //   results[key] = await this.genAggregateTypeOrmQuery(
          //     this.programmeRepo,
          //     "programme",
          //     [StatType.AUTH_CERTIFIED_BY_ME_BY_STATE, StatType.CERTIFIED_BY_ME_BY_STATE].includes(
          //       stat.type
          //     )
          //       ? ["currentStage"]
          //       : ["sector"],
          //     [
          //       new AggrEntry("programmeId", "COUNT", "count"),
          //       new AggrEntry("creditEst", "SUM", "totalEstCredit"),
          //       new AggrEntry("creditIssued", "SUM", "totalIssuedCredit"),
          //       new AggrEntry("creditBalance", "SUM", "totalBalanceCredit"),
          //       {
          //         key: "creditRetired",
          //         operation: "SUM",
          //         fieldName: "totalRetiredCredit",
          //         outerQuery: "select sum(s) from unnest",
          //       },
          //       {
          //         key: "creditTransferred",
          //         operation: "SUM",
          //         fieldName: "totalTxCredit",
          //         outerQuery: "select sum(s) from unnest",
          //       },
          //       frzAgg,
          //     ],
          //     filtCState,
          //     null,
          //     null,
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     ["certifiedTime", "creditUpdateTime"],
          //     stat.statFilter?.timeGroup ? "createdAt" : undefined,
          //     stat.statFilter?.timeGroup ? "day" : undefined
          //   );
          //   break;
          case StatType.ALL_PROGRAMME_LOCATION:
          case StatType.MY_PROGRAMME_LOCATION:
            if (stat.type === StatType.MY_PROGRAMME_LOCATION) {
              stat.statFilter
                ? (stat.statFilter.onlyMine = true)
                : (stat.statFilter = { onlyMine: true });
            }
            const whereC = [];
            whereC.push(`d."geoCoordinates" != 'null'`);
            if (stat.statFilter && stat.statFilter.onlyMine) {
              whereC.push(`(${companyId} = b."companyId")`);
            }
            if (stat.statFilter && stat.statFilter.startTime) {
              whereC.push(`"createdTime" >= ${stat.statFilter.startTime}`);
            }
            if (stat.statFilter && stat.statFilter.endTime) {
              whereC.push(`"createdTime" <= ${stat.statFilter.endTime}`);
            }
            // const resultsProgrammeLocations = await this.programmeRepo.manager
            //   .query(`SELECT p."programmeId" as loc, b."projectProposalStage" as stage, count(*) AS count
            //     FROM   programme_sl b, jsonb_array_elements(b."geographicalLocationCordintes") p("programmeId")
            //     ${whereC.length > 0 ? " where " : " "}
            //     ${whereC.join(" and ")}
            //     GROUP  BY p."programmeId", b."projectProposalStage"`);
            const resultsProgrammeLocations = await this.programmeRepo.manager
              .query(`SELECT d."geoCoordinates" as loc, b."projectProposalStage" as stage, count(*) AS count
                  FROM programme_sl b
                  JOIN district d ON b."district" = d."districtName"
                  ${whereC.length > 0 ? " where " : " "}
                  ${whereC.join(" and ")}
                  GROUP BY d."geoCoordinates", b."projectProposalStage"`);

            const stageMapping = {
              SUBMITTED_INF: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              APPROVED_INF: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              SUBMITTED_COST_QUOTATION: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              SUBMITTED_PROPOSAL: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              SUBMITTED_VALIDATION_AGREEMENT: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              ACCEPTED_PROPOSAL: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              SUBMITTED_CMA: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              REJECTED_CMA: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              APPROVED_CMA: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              VALIDATION_PENDING: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              REJECTED_VALIDATION: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
              REJECTED_INF: SLDashboardProjectStage.REJECTED,
              REJECTED_PROPOSAL: SLDashboardProjectStage.REJECTED,
              AUTHORISED: SLDashboardProjectStage.AUTHORISED,
            };

            const aggregatedData = resultsProgrammeLocations.reduce(
              (acc, { loc, stage, count }) => {
                const mappedStage = stageMapping[stage]; // Map stage
                const locationKey = JSON.stringify(loc); // Use location as a unique key

                if (!acc[locationKey]) {
                  acc[locationKey] = { loc, awaitingAuthorization: 0, rejected: 0, authorised: 0 };
                }

                acc[locationKey][mappedStage] += parseInt(count, 10);

                return acc;
              },
              {}
            );

            // Convert aggregated data into the resultsProgrammeLocations array format
            const result = Object.values(aggregatedData).flatMap(
              ({ loc, awaitingAuthorization, rejected, authorised }) => {
                const output = [];
                if (awaitingAuthorization > 0) {
                  output.push({
                    loc,
                    stage: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
                    count: awaitingAuthorization,
                  });
                }
                if (rejected > 0) {
                  output.push({ loc, stage: SLDashboardProjectStage.REJECTED, count: rejected });
                }
                if (authorised > 0) {
                  output.push({
                    loc,
                    stage: SLDashboardProjectStage.AUTHORISED,
                    count: authorised,
                  });
                }
                return output;
              }
            );

            results[key] = await this.programmeLocationDataFormatter(result);
            break;
          // case StatType.ALL_TRANSFER_LOCATION:
          // case StatType.MY_TRANSFER_LOCATION:
          //   if (stat.type === StatType.MY_TRANSFER_LOCATION) {
          //     stat.statFilter
          //       ? (stat.statFilter.onlyMine = true)
          //       : (stat.statFilter = { onlyMine: true });
          //   }

          //   let filtCom = this.getFilterAndByStatFilter(stat.statFilter, null, "txTime");
          //   if (!filtCom) {
          //     filtCom = [];
          //   }
          //   filtCom.push({
          //     value: "0",
          //     key: "retirementType",
          //     operation: "=",
          //   });
          //   filtCom.push({
          //     value: TransferStatus.RECOGNISED,
          //     key: "status",
          //     operation: "=",
          //   });

          //   let filterOr = undefined;
          //   if (stat.statFilter && stat.statFilter.onlyMine) {
          //     filterOr = [];
          //     filterOr.push({
          //       value: companyId,
          //       key: "fromCompanyId",
          //       operation: "=",
          //     });
          //     filterOr.push({
          //       value: companyId,
          //       key: "programmeCertifierId",
          //       operation: "ANY",
          //     });
          //   }
          //   results[key] = await this.genAggregateTypeOrmQuery(
          //     this.programmeTransferRepo,
          //     "transfer",
          //     [`toCompanyMeta->>country`],
          //     [new AggrEntry("requestId", "COUNT", "count")],
          //     filtCom,
          //     filterOr,
          //     null,
          //     abilityCondition,
          //     lastTimeForWhere,
          //     statCache,
          //     ["authTime"]
          //   );
          //   break;
        }
        break;
    }
    console.log("Calc stat done", stat.type);
    return results;
  }

  async getProgrammeLocationTime(whereC: string[], lastTimeForWhere: any) {
    const tc = "createdTime";
    const tableName = "programme";
    const timeWhere = whereC.join(" and ").replace(/b./g, "programme.");
    const cacheKey = timeWhere + " " + tc + " from " + tableName;
    let colTime;
    console.log("Cache key", cacheKey);
    if (lastTimeForWhere[cacheKey]) {
      console.log("Last time hit from the cache");
      colTime = lastTimeForWhere[cacheKey];
    } else {
      colTime = await this.getLastTime(this.programmeRepo, tableName, timeWhere, tc);
      lastTimeForWhere[cacheKey] = colTime;
    }
    return colTime;
  }

  async getInvestmentLocationTime(whereC: string[], lastTimeForWhere: any) {
    const tc = "createdTime";
    const tableName = "investment";
    const timeWhere = whereC.join(" and ").replace(/b./g, "investment.");
    const cacheKey = timeWhere + " " + tc + " from " + tableName;
    let colTime;
    console.log("Cache key", cacheKey);
    if (lastTimeForWhere[cacheKey]) {
      console.log("Last time hit from the cache");
      colTime = lastTimeForWhere[cacheKey];
    } else {
      colTime = await this.getLastTime(this.investmentRepo, tableName, timeWhere, tc);
      lastTimeForWhere[cacheKey] = colTime;
    }
    return colTime;
  }

  async getCertifiedRevokedAgg(
    stat: Stat,
    results,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId,
    frzAgg,
    companyRole
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
      companyRole,
      stat.statFilter?.timeGroup ? true : false
    );

    const allAuth = await this.getAllAuthProgramme(
      stat,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      stat.statFilter?.timeGroup ? true : false,
      companyId
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
      companyRole,
      stat.statFilter?.timeGroup ? true : false
    );

    if (!stat.statFilter || stat.statFilter.timeGroup != true) {
      return {
        last: Math.max(allAuth.all["authTime"], certified.last, revoked.last),
        data: {
          certifiedSum: Number(
            certified && certified.data.length > 0 && certified?.data[0]
              ? certified?.data[0]["totalestcredit"]
              : 0
          ),
          revokedSum: Number(
            revoked && revoked.data.length > 0 && revoked?.data[0]
              ? revoked.data[0]["totalestcredit"]
              : 0
          ),
          uncertifiedSum:
            Number(
              allAuth && allAuth.data.length > 0 && allAuth?.data[0] ? allAuth?.data[0]["sum"] : 0
            ) -
            Number(
              certified && certified?.data.length > 0 && certified?.data[0]
                ? certified?.data[0]["totalestcredit"]
                : 0
            ) -
            Number(
              revoked && revoked?.data.length > 0 && revoked?.data[0]
                ? revoked.data[0]["totalestcredit"]
                : 0
            ),
        },
      };
    } else {
      const groupedData = {};
      for (const d in certified.data) {
        groupedData[d] = {
          certifiedSum: Number(
            certified && certified.data[d] && certified.data[d].length > 0
              ? certified.data[d][0]["totalestcredit"]
              : 0
          ),
          revokedSum: 0,
        };
      }
      for (const d in revoked.data) {
        if (!groupedData[d]) {
          groupedData[d] = {
            revokedSum: Number(
              revoked && revoked.data[d] && revoked.data[d].length > 0
                ? revoked.data[d][0]["totalestcredit"]
                : 0
            ),
            certifiedSum: 0,
          };
        } else {
          groupedData[d]["revokedSum"] = Number(
            revoked && revoked.data[d] && revoked.data[d].length > 0
              ? revoked.data[d][0]["totalestcredit"]
              : 0
          );
        }
      }
      for (const d in allAuth.data) {
        if (!groupedData[d]) {
          groupedData[d] = {
            revokedSum: 0,
            certifiedSum: 0,
            uncertifiedSum: Number(
              allAuth && allAuth.data[d] && allAuth.data[d].length > 0
                ? allAuth.data[d][0]["sum"]
                : 0
            ),
          };
        } else {
          groupedData[d]["uncertifiedSum"] =
            Number(
              allAuth && allAuth.data[d] && allAuth.data[d].length > 0
                ? allAuth.data[d][0]["sum"]
                : 0
            ) -
            groupedData[d]["certifiedSum"] -
            groupedData[d]["revokedSum"];
        }
      }

      const timeLabel = Object.getOwnPropertyNames(groupedData);
      timeLabel.sort((a: any, b: any) => {
        let dateA: any = new Date(a);
        let dateB: any = new Date(b);
        return dateA - dateB;
      });

      const sortedGroupedData = {};
      timeLabel?.map((time) => {
        if (!sortedGroupedData[time]) {
          sortedGroupedData[time] = {
            certifiedSum: groupedData[time]["certifiedSum"],
            uncertifiedSum: groupedData[time]["uncertifiedSum"],
            revokedSum: groupedData[time]["revokedSum"],
          };
        } else {
          sortedGroupedData[time]["certifiedSum"] = groupedData[time]["certifiedSum"];
          sortedGroupedData[time]["uncertifiedSum"] = groupedData[time]["uncertifiedSum"];
          sortedGroupedData[time]["revokedSum"] = groupedData[time]["revokedSum"];
        }
      });

      const chartData = {
        timeLabel: [],
        certifiedSum: [],
        uncertifiedSum: [],
        revokedSum: [],
      };
      for (const tg in sortedGroupedData) {
        chartData.timeLabel.push(tg);
        chartData.certifiedSum.push(parseFloat(sortedGroupedData[tg]["certifiedSum"]));
        chartData.uncertifiedSum.push(parseFloat(sortedGroupedData[tg]["uncertifiedSum"]));
        chartData.revokedSum.push(parseFloat(sortedGroupedData[tg]["revokedSum"]));
      }

      return {
        last: Math.max(allAuth.all["authTime"], certified.last, revoked.last),
        data: chartData,
      };
    }
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
    companyId: any,
    companyRole: CompanyRole,
    system: SYSTEM_TYPE
  ): Promise<DataCountResponseDto> {
    let results = {};
    let lastTimeForWhere = {};
    let statCache = {};

    // const frzAgg = new AggrEntry("creditFrozen", "SUM", "totalFreezeCredit");
    // frzAgg.outerQuery = "select sum(s) from unnest";

    for (const stat of query.stats) {
      await this.calcStat(
        stat,
        results,
        null,
        abilityCondition,
        lastTimeForWhere,
        statCache,
        companyId,
        companyRole,
        system
      );
    }
    return new DataCountResponseDto(results);
  }

  async getTotalSLProjects(user: User) {
    const query = this.programmeSlRepo
      .createQueryBuilder("pr")
      .select("COUNT(*)", "count") // Select count
      .addSelect("MAX(pr.createdTime)", "latestUpdatedTime"); // Select latest updated time

    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      query.where("pr.companyId = :companyId", { companyId: user.companyId });
    }
    const result = await query.getRawOne();
    return new DataResponseDto(HttpStatus.OK, result);
  }

  async getTotalIssuedCredits(user: User) {
    const query = this.programmeSlRepo
      .createQueryBuilder("pr")
      .select("COALESCE(CAST(SUM(pr.creditIssued) AS INTEGER),0)", "totalCreditIssued") // Select count
      .addSelect("MAX(pr.issuedCreditUpdatedTime)", "latestUpdatedTime"); // Select latest updated time

    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      query.andWhere("pr.companyId = :companyId", { companyId: user.companyId });
    }
    const result = await query.getRawOne();

    return new DataResponseDto(HttpStatus.OK, result);
  }

  async getTotalRetiredCredits(user: User) {
    const query = this.programmeSlRepo
      .createQueryBuilder("pr")
      .select("COALESCE(CAST(SUM(pr.creditRetired) AS INTEGER),0)", "totalCreditRetired")
      .addSelect("COALESCE(CAST(SUM(pr.creditTransferred) AS INTEGER),0)", "totalCreditTransferred")
      .addSelect("MAX(pr.creditUpdatedTime)", "latestUpdatedTime");

    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      query.andWhere("pr.companyId = :companyId", { companyId: user.companyId });
    }
    const result = await query.getRawOne();

    return new DataResponseDto(HttpStatus.OK, result);
  }

  async queryProgrammesByStatus(query: QueryDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const filterAnd = {
        key: "companyId",
        operation: "=",
        value: user.companyId,
      };
      query.filterAnd.push(filterAnd);
    }
    let resp = await this.programmeSlRepo
      .createQueryBuilder("pr")
      .select("pr.projectProposalStage", "projectProposalStage")
      .addSelect("COUNT(*)", "count")
      .addSelect("MAX(pr.proposalStageUpdatedTime)", "latestProposalStageUpdatedTime")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("pr.projectProposalStage")
      .getRawMany();

    let latestUpdatedTime = 0;
    resp.forEach((row) => {
      let latestProposalStageUpdatedTime = parseInt(row.latestProposalStageUpdatedTime);
      if (latestProposalStageUpdatedTime > latestUpdatedTime) {
        latestUpdatedTime = latestProposalStageUpdatedTime;
      }
    });

    let result = {};

    result["proposalStageData"] = resp;

    result["latestUpdatedTime"] = latestUpdatedTime;

    return new DataResponseDto(HttpStatus.OK, result);
  }

  async queryProgrammesByCategory(query: QueryDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const filterAnd = {
        key: "companyId",
        operation: "=",
        value: user.companyId,
      };
      query.filterAnd.push(filterAnd);
    }
    let resp = await this.programmeSlRepo
      .createQueryBuilder("pr")
      .select("pr.projectCategory", "projectCategory")
      .addSelect("COUNT(*)", "count")
      .addSelect("MAX(pr.createdTime)", "latestCreatedTime")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("pr.projectCategory")
      .getRawMany();

    let latestUpdatedTime = 0;
    resp.forEach((row) => {
      let latestCreatedTime = parseInt(row.latestCreatedTime);
      if (latestCreatedTime > latestUpdatedTime) {
        latestUpdatedTime = latestCreatedTime;
      }
    });

    let result = {};

    result["projectCategoryData"] = resp;

    result["latestUpdatedTime"] = latestUpdatedTime;

    return new DataResponseDto(HttpStatus.OK, result);
  }

  async queryRetirementsByDate(query: QueryDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const filterOr = [];
      const fromCompanyId = {
        key: 'cr"."fromCompanyId',
        operation: "=",
        value: user.companyId,
      };
      const toCompanyId = {
        key: 'cr"."toCompanyId',
        operation: "=",
        value: user.companyId,
      };
      filterOr.push(fromCompanyId);
      filterOr.push(toCompanyId);

      query.filterOr = filterOr
    }

     const filterAnd = query.filterAnd.map((filter) => {
      let newKey = filter.key;
  
      // Remap keys
      if (newKey === "createdTime") {
        newKey = "approvedTime";
      } else if (newKey === "purposeOfCreditDevelopment") {
        newKey = "creditType";
      } else if (newKey === "projectCategory") {
        newKey = "programmeCategory"
      }
  
      return {
        ...filter,
        key: `cr\".\"${newKey}`,
      };
    });
    query.filterAnd = filterAnd;
    const creditRetirementStatus = {
      key: 'cr"."status',
      operation: "=",
      value: "Approved",
    };

    query.filterAnd.push(creditRetirementStatus);

    const result = await this.creditRetirementSlViewRepo
      .createQueryBuilder("cr")
      .select(
        "TO_CHAR(TO_TIMESTAMP(CAST(cr.approvedTime AS BIGINT)/1000), 'YYYY-MM-DD')",
        "approvedDate"
      )
      .addSelect("cr.creditType", "creditType")
      .addSelect("SUM(cr.creditAmount)", "totalCreditAmount")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("TO_CHAR(TO_TIMESTAMP(CAST(cr.approvedTime AS BIGINT)/1000), 'YYYY-MM-DD')")
      .addGroupBy("cr.creditType")
      .orderBy("TO_CHAR(TO_TIMESTAMP(CAST(cr.approvedTime AS BIGINT)/1000), 'YYYY-MM-DD')", "ASC")
      .getRawMany();

    return new DataResponseDto(HttpStatus.OK, result);
  }

  async queryCreditsByStatus(query: QueryDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const filterAnd = {
        key: "companyId",
        operation: "=",
        value: user.companyId,
      };
      query.filterAnd.push(filterAnd);
    }

    const projectAuthorisedStage = {
      key: 'pr"."projectProposalStage',
      operation: "=",
      value: ProjectProposalStage.AUTHORISED,
    };

    query.filterAnd.push(projectAuthorisedStage);

    let resp = await this.programmeSlRepo
      .createQueryBuilder("pr")
      .select("pr.projectProposalStage", "projectProposalStage")
      .addSelect("SUM(pr.creditEst)", "totalCreditAuthorised")
      .addSelect("SUM(pr.creditIssued)", "totalCreditIssued")
      .addSelect("SUM(pr.creditRetired)", "totalCreditRetired")
      .addSelect("SUM(pr.creditTransferred)", "totalCreditTransferred")
      .addSelect("MAX(pr.authorisedCreditUpdatedTime)", "latestAuthorisedCreditUpdatedTime")
      .addSelect("MAX(pr.issuedCreditUpdatedTime)", "latestIssuedCreditUpdatedTime")
      .addSelect("MAX(pr.transferredCreditUpdatedTime)", "latestTransferredCreditUpdatedTime")
      .addSelect("MAX(pr.retiredCreditUpdatedTime)", "latestRetiredCreditUpdatedTime")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("pr.projectProposalStage")
      .getRawOne();

    return new DataResponseDto(HttpStatus.OK, resp);
  }

  async queryCreditsByDate(query: QueryDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const filterAnd = {
        key: 'programme"."companyId',
        operation: "=",
        value: user.companyId,
      };
      query.filterAnd.push(filterAnd);
    }

    if (query.filterAnd && query.filterAnd.length > 0) {
      query.filterAnd.map((filter) => {
        if (filter.key === "createdTime") {
          filter.key = 'audit_log"."createdTime';
        } else if (filter.key === "projectCategory") {
          filter.key = 'programme"."projectCategory';
        } else if (filter.key === "purposeOfCreditDevelopment") {
          filter.key = 'programme"."purposeOfCreditDevelopment';
        }
        return filter;
      });
    }

    const authorisedLogType = {
      key: 'audit_log"."logType',
      operation: "=",
      value: "AUTHORISED",
    };

    query.filterAnd.push(authorisedLogType);

    const authorisedCreditsByDate = await this.programmeSlAuditLogRepo
      .createQueryBuilder("audit_log")
      .leftJoin("programme_sl", "programme", "programme.programmeId = audit_log.programmeId")
      .select("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')", "log_date")
      .addSelect("SUM(programme.creditEst)", "total_credit_authorised")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')")
      .orderBy("log_date", "ASC")
      .getRawMany();

    const issuedLogType = {
      key: 'audit_log"."logType',
      operation: "=",
      value: "CREDIT_ISSUED",
    };

    query.filterAnd.pop();
    query.filterAnd.push(issuedLogType);

    const issuedCreditsByDate = await this.programmeSlAuditLogRepo
      .createQueryBuilder("audit_log")
      .leftJoin("programme_sl", "programme", "programme.programmeId = audit_log.programmeId")
      .select("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')", "log_date")
      .addSelect("SUM((audit_log.data->>'creditIssued')::numeric)", "total_credit_issued")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')")
      .orderBy("log_date", "ASC")
      .getRawMany();

    const transferredLogType = {
      key: 'audit_log"."logType',
      operation: "=",
      value: "TRANSFER_APPROVED",
    };

    query.filterAnd.pop();
    query.filterAnd.push(transferredLogType);

    const transferredCreditsByDate = await this.programmeSlAuditLogRepo
      .createQueryBuilder("audit_log")
      .leftJoin("programme_sl", "programme", "programme.programmeId = audit_log.programmeId")
      .select("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')", "log_date")
      .addSelect("SUM((audit_log.data->>'creditAmount')::numeric)", "total_credit_transferred")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')")
      .orderBy("log_date", "ASC")
      .getRawMany();

    const retiredLogType = {
      key: 'audit_log"."logType',
      operation: "=",
      value: "RETIRE_APPROVED",
    };
    query.filterAnd.pop();
    query.filterAnd.push(retiredLogType);

    const retiredCreditsByDate = await this.programmeSlAuditLogRepo
      .createQueryBuilder("audit_log")
      .leftJoin("programme_sl", "programme", "programme.programmeId = audit_log.programmeId")
      .select("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')", "log_date")
      .addSelect("SUM((audit_log.data->>'creditAmount')::numeric)", "total_credit_retired")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')")
      .orderBy("log_date", "ASC")
      .getRawMany();

    const data = {
      authorised: authorisedCreditsByDate,
      issued: issuedCreditsByDate,
      transferred: transferredCreditsByDate,
      retired: retiredCreditsByDate,
    };

    const groupedData = {};

    ["authorised", "issued", "transferred", "retired"].forEach((key) => {
      data[key].forEach((entry) => {
        const { log_date, ...values } = entry;
        if (!groupedData[log_date]) {
          groupedData[log_date] = { log_date };
        }
        Object.assign(groupedData[log_date], values);
      });
    });

    const result = Object.values(groupedData).sort((a: any, b: any) => {
      const dateA = new Date(a.log_date);
      const dateB = new Date(b.log_date);
      return dateA.getTime() - dateB.getTime();
    });
    return new DataResponseDto(HttpStatus.OK, result);
  }

  async queryCreditsByPurpose(query: QueryDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const filterAnd = {
        key: 'programme"."companyId',
        operation: "=",
        value: user.companyId,
      };
      query.filterAnd.push(filterAnd);
    }

    if (query.filterAnd && query.filterAnd.length > 0) {
      query.filterAnd.map((filter) => {
        if (filter.key === "createdTime") {
          filter.key = 'audit_log"."createdTime';
        } else if (filter.key === "projectCategory") {
          filter.key = 'programme"."projectCategory';
        } else if (filter.key === "purposeOfCreditDevelopment") {
          filter.key = 'programme"."purposeOfCreditDevelopment';
        }
        return filter;
      });
    }

    const issuedLogType = {
      key: 'audit_log"."logType',
      operation: "=",
      value: "CREDIT_ISSUED",
    };

    query.filterAnd.push(issuedLogType);

    const issuedCreditsByDate = await this.programmeSlAuditLogRepo
      .createQueryBuilder("audit_log")
      .leftJoin("programme_sl", "programme", "programme.programmeId = audit_log.programmeId")
      .select("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')", "logDate")
      .addSelect("SUM((audit_log.data->>'creditIssued')::numeric)", "totalCreditIssued")
      .addSelect("programme.purposeOfCreditDevelopment", "creditType")
      .where(this.helperService.generateWhereSQL(query, null))
      .groupBy("TO_CHAR(TO_TIMESTAMP(audit_log.createdTime / 1000), 'YYYY-MM-DD')")
      .addGroupBy("programme.purposeOfCreditDevelopment")
      .orderBy("logDate", "ASC")
      .getRawMany();

    return new DataResponseDto(HttpStatus.OK, issuedCreditsByDate);
  }

  async getEmissions(stat, companyId, abilityCondition, lastTimeForWhere, statCache) {
    if ([StatType.MY_TOTAL_EMISSIONS].includes(stat.type)) {
      stat.statFilter ? (stat.statFilter.onlyMine = true) : (stat.statFilter = { onlyMine: true });
    }

    let filterAnd = this.getFilterAndByStatFilter(
      stat.statFilter,
      {
        value: companyId,
        key: "companyId",
        operation: "ANY",
      },
      "createdTime"
    );

    return await this.genAggregateTypeOrmQuery(
      this.programmeRepo,
      "programme",
      null,
      [
        {
          key: "emissionReductionExpected",
          operation: "SUM",
          fieldName: "totEmissionReductionExpected",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
        },
        {
          key: "emissionReductionAchieved",
          operation: "SUM",
          fieldName: "totEmissionReductionAchieved",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
        },
      ],
      filterAnd,
      null,
      stat.statFilter?.timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["creditUpdateTime"],
      stat.statFilter?.timeGroup ? "createdAt" : undefined,
      stat.statFilter?.timeGroup ? "day" : undefined
    );
  }

  async generateNDCAggregates(stat, abilityCondition, lastTimeForWhere, statCache, companyId) {
    if (
      [StatType.MY_AGG_NDC_ACTION_BY_SECTOR, StatType.MY_AGG_NDC_ACTION_BY_TYPE].includes(stat.type)
    ) {
      stat.statFilter ? (stat.statFilter.onlyMine = true) : (stat.statFilter = { onlyMine: true });
    }

    let filterAnd = this.getFilterAndByStatFilter(
      stat.statFilter,
      {
        value: companyId,
        key: "companyId",
        operation: "ANY",
      },
      "createdTime"
    );

    return await this.genAggregateTypeOrmQuery(
      this.ndcRepo,
      "ndcaction",
      [StatType.AGG_NDC_ACTION_BY_TYPE, StatType.MY_AGG_NDC_ACTION_BY_TYPE].includes(stat.type)
        ? ["action"]
        : ["sector"],
      [new AggrEntry("id", "COUNT", "count")],
      filterAnd,
      null,
      stat.statFilter?.timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["createdTime", "createdTime"],
      stat.statFilter?.timeGroup ? "createdAt" : undefined,
      stat.statFilter?.timeGroup ? "day" : undefined
    );
  }

  async generateInvestmentAggregates(
    stat,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId
  ) {
    if ([StatType.MY_AGG_INVESTMENT_BY_TYPE].includes(stat.type)) {
      stat.statFilter ? (stat.statFilter.onlyMine = true) : (stat.statFilter = { onlyMine: true });
    }

    let filterAnd = this.getFilterAndByStatFilter(
      stat.statFilter,
      {
        value: companyId,
        key: "fromCompanyId",
        operation: "=",
      },
      "createdTime"
    );

    if (!filterAnd) {
      filterAnd = [];
    }
    filterAnd.push({
      value: "Approved",
      key: "status",
      operation: "=",
    });
    let filterOr = undefined;
    // if (stat.statFilter && stat.statFilter.onlyMine) {
    //   filterOr = [];
    //   filterOr.push({
    //     value: companyId,
    //     key: "fromCompanyId",
    //     operation: "=",
    //   });
    // }

    const d = await this.genAggregateTypeOrmQuery(
      this.investmentRepo,
      "investment",
      ["type"],
      [new AggrEntry("amount", "SUM", "amount")],
      filterAnd,
      null,
      stat.statFilter?.timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["createdTime"],
      stat.statFilter?.timeGroup ? "createdAt" : undefined,
      stat.statFilter?.timeGroup ? "day" : undefined
    );
    if (d && d.data) {
      for (const r of d.data) {
        if (r.type === 0 || r.type === "0") {
          r.type = "Unknown";
        }
      }
    }
    return d;
  }

  async getCertifiedStatData(
    results,
    stat,
    abilityCondition,
    lastTimeForWhere,
    statCache,
    companyId,
    onlyUncertified,
    companyRole
  ): Promise<any> {
    const allAuth = await this.getAllAuthProgramme(
      stat,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      stat.statFilter?.timeGroup ? true : false
    );

    console.log("Credit minus allAuth", allAuth);
    const certified = await this.getCertifiedByMePrgrammes(
      stat.statFilter,
      companyId,
      "certifierId",
      abilityCondition,
      lastTimeForWhere,
      statCache,
      companyRole,
      stat.statFilter?.timeGroup ? true : false
    );

    const revoked = await this.getCertifiedByMePrgrammes(
      stat.statFilter,
      companyId,
      "revokedCertifierId",
      abilityCondition,
      lastTimeForWhere,
      statCache,
      companyRole,
      stat.statFilter?.timeGroup ? true : false
    );

    console.log("Credit minus certified", certified);
    if (!onlyUncertified) {
      console.log("Credit minus revoked", revoked);
      if (!stat.statFilter || stat.statFilter.timeGroup != true) {
        return {
          last: Math.max(allAuth.all["authTime"], certified.last, revoked.last),
          countLast: Math.max(allAuth.all["statusUpdateTime"], certified.last, revoked.last),
          data: {
            certifiedCount: Number(
              certified && certified.data.length > 0 ? certified.data[0]["count"] : 0
            ),
            revokedCount: Number(revoked && revoked.data.length > 0 ? revoked.data[0]["count"] : 0),
            uncertifiedCount:
              Number(allAuth && allAuth.data.length > 0 ? allAuth.data[0]["count"] : 0) -
              Number(revoked && revoked.data.length > 0 ? revoked.data[0]["count"] : 0) -
              Number(certified && certified.data.length > 0 ? certified.data[0]["count"] : 0),
            revokedSum: Number(revoked && revoked.data.length > 0 ? revoked.data[0]["sum"] : 0),
            certifiedSum: Number(
              certified && certified.data.length > 0 ? certified.data[0]["sum"] : 0
            ),
            uncertifiedSum:
              Number(allAuth && allAuth.data.length > 0 ? allAuth.data[0]["sum"] : 0) -
              Number(revoked && revoked.data.length > 0 ? revoked.data[0]["sum"] : 0) -
              Number(certified && certified.data.length > 0 ? certified.data[0]["sum"] : 0),
          },
        };
      } else {
        const groupedData = {};
        for (const d in certified.data) {
          groupedData[d] = {
            certifiedSum: Number(
              certified && certified.data[d] && certified.data[d].length > 0
                ? certified.data[d][0]["sum"]
                : 0
            ),
            revokedSum: 0,
          };
        }
        for (const d in revoked.data) {
          if (!groupedData[d]) {
            groupedData[d] = {
              revokedSum: Number(
                revoked && revoked.data[d] && revoked.data[d].length > 0
                  ? revoked.data[d][0]["sum"]
                  : 0
              ),
              certifiedSum: 0,
            };
          } else {
            groupedData[d]["revokedSum"] = Number(
              revoked && revoked.data[d] && revoked.data[d].length > 0
                ? revoked.data[d][0]["sum"]
                : 0
            );
          }
        }
        for (const d in allAuth.data) {
          if (!groupedData[d]) {
            groupedData[d] = {
              revokedSum: 0,
              certifiedSum: 0,
              uncertifiedSum: Number(
                allAuth && allAuth.data[d] && allAuth.data[d].length > 0
                  ? allAuth.data[d][0]["sum"]
                  : 0
              ),
            };
          } else {
            groupedData[d]["uncertifiedSum"] =
              Number(
                allAuth && allAuth.data[d] && allAuth.data[d].length > 0
                  ? allAuth.data[d][0]["sum"]
                  : 0
              ) -
              groupedData[d]["certifiedSum"] -
              groupedData[d]["revokedSum"];
          }
        }

        const timeLabel = Object.getOwnPropertyNames(groupedData);
        timeLabel.sort((a: any, b: any) => {
          let dateA: any = new Date(a);
          let dateB: any = new Date(b);
          return dateA - dateB;
        });

        const sortedGroupedData = {};
        timeLabel?.map((time) => {
          if (!sortedGroupedData[time]) {
            sortedGroupedData[time] = {
              certifiedSum: groupedData[time]["certifiedSum"],
              uncertifiedSum: groupedData[time]["uncertifiedSum"],
              revokedSum: groupedData[time]["revokedSum"],
            };
          } else {
            sortedGroupedData[time]["certifiedSum"] = groupedData[time]["certifiedSum"];
            sortedGroupedData[time]["uncertifiedSum"] = groupedData[time]["uncertifiedSum"];
            sortedGroupedData[time]["revokedSum"] = groupedData[time]["revokedSum"];
          }
        });

        const chartData = {
          timeLabel: [],
          certifiedSum: [],
          uncertifiedSum: [],
          revokedSum: [],
        };
        for (const tg in sortedGroupedData) {
          chartData.timeLabel.push(tg);
          chartData.certifiedSum.push(parseFloat(sortedGroupedData[tg]["certifiedSum"]));
          chartData.uncertifiedSum.push(parseFloat(sortedGroupedData[tg]["uncertifiedSum"]));
          chartData.revokedSum.push(parseFloat(sortedGroupedData[tg]["revokedSum"]));
        }

        return {
          last: Math.max(allAuth.all["authTime"], certified.last, revoked.last),
          countLast: Math.max(allAuth.all["statusUpdateTime"], certified.last, revoked.last),
          data: chartData,
        };
      }
    } else {
      return {
        last: Math.max(allAuth.all["authTime"], certified.last, revoked.last),
        countLast: Math.max(certified.last, allAuth.all["statusUpdateTime"], revoked.last),
        data: {
          uncertifiedSum:
            Number(allAuth && allAuth.data.length > 0 ? allAuth.data[0]["sum"] : 0) -
            Number(certified && certified.data.length > 0 ? certified.data[0]["sum"] : 0),
          uncertifiedCount:
            Number(allAuth && allAuth.data.length > 0 ? allAuth.data[0]["count"] : 0) -
            Number(certified && certified.data.length > 0 ? certified.data[0]["count"] : 0),
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
  async getPendingTxStats(stat, companyId, abilityCondition, lastTimeForWhere, statCache) {
    if (stat.statFilter) {
      stat.statFilter.onlyMine = false;
    } else {
      stat.statFilter = { onlyMine: false };
    }
    let filt = this.getFilterAndByStatFilter(stat.statFilter, null, "txTime");

    if (filt == null) {
      filt = [];
    }
    filt.push({
      key: "status",
      operation: "=",
      value: TransferStatus.PENDING,
    });
    filt.push({
      key: "isRetirement",
      operation: "!=",
      value: true,
    });

    filt.push({
      value: companyId,
      key: stat.type === StatType.PENDING_TRANSFER_INIT ? "initiatorCompanyId" : "fromCompanyId",
      operation: "=",
    });

    return await this.genAggregateTypeOrmQuery(
      this.programmeTransferRepo,
      "transfer",
      null,
      [new AggrEntry("requestId", "COUNT", "count")],
      filt,
      null,
      null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      ["txTime"]
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
        StatType.MY_AGG_AUTH_PROGRAMME_BY_STATUS,
      ].includes(stat.type)
    ) {
      stat.statFilter ? (stat.statFilter.onlyMine = true) : (stat.statFilter = { onlyMine: true });
    }

    let filterAnd = this.getFilterAndByStatFilter(
      stat.statFilter,
      {
        value: companyId,
        key: "companyId",
        operation: "=",
      },
      "createdTime"
    );

    if (
      [StatType.AGG_AUTH_PROGRAMME_BY_STATUS, StatType.MY_AGG_AUTH_PROGRAMME_BY_STATUS].includes(
        stat.type
      )
    ) {
      if (!filterAnd) {
        filterAnd = [];
      }
      filterAnd.push({
        value: ProjectProposalStage.AUTHORISED,
        key: "projectProposalStage",
        operation: "=",
      });
    }

    // frzAgg.mineCompanyId = stat?.statFilter?.onlyMine ? companyId : undefined;

    const results = await this.genAggregateTypeOrmQuery(
      this.programmeSlRepo,
      "programme_sl",
      [
        StatType.AGG_PROGRAMME_BY_STATUS,
        StatType.MY_AGG_PROGRAMME_BY_STATUS,
        StatType.MY_AGG_AUTH_PROGRAMME_BY_STATUS,
        StatType.AGG_AUTH_PROGRAMME_BY_STATUS,
      ].includes(stat.type)
        ? ["projectProposalStage"]
        : ["projectCategory"],
      [
        new AggrEntry("programmeId", "COUNT", "count"),
        {
          key: "creditEst",
          operation: "SUM",
          fieldName: "totalEstCredit",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
        },
        {
          key: "creditBalance",
          operation: "SUM",
          fieldName: "totalIssuedCredit",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
        },
        {
          key: "creditBalance",
          operation: "SUM",
          fieldName: "totalBalanceCredit",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
        },
        {
          key: "creditRetired",
          operation: "SUM",
          fieldName: "totalRetiredCredit",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
          // outerQuery: "select sum(s) from unnest",
        },
        {
          key: "creditTransferred",
          operation: "SUM",
          fieldName: "totalTxCredit",
          mineCompanyId: stat?.statFilter?.onlyMine ? companyId : undefined,
          // outerQuery: "select sum(s) from unnest",
        },
      ],
      filterAnd,
      null,
      stat.statFilter?.timeGroup ? { key: "time_group", order: "ASC" } : null,
      abilityCondition,
      lastTimeForWhere,
      statCache,
      [
        [
          StatType.AGG_PROGRAMME_BY_STATUS,
          StatType.MY_AGG_PROGRAMME_BY_STATUS,
          StatType.MY_AGG_AUTH_PROGRAMME_BY_STATUS,
          StatType.AGG_AUTH_PROGRAMME_BY_STATUS,
        ].includes(stat.type)
          ? "createdTime" //TODO: Integrate statusUpdateTime into programmeSl entity
          : "createdTime",
        "createdTime", //TODO: Integrate creditUpdateTime into programmeSl entity
      ],
      stat.statFilter?.timeGroup ? "createdAt" : undefined,
      stat.statFilter?.timeGroup ? "day" : undefined
    );

    if (
      [StatType.AGG_PROGRAMME_BY_STATUS, StatType.MY_AGG_PROGRAMME_BY_STATUS].includes(stat.type) &&
      !stat?.statFilter?.timeGroup
    ) {
      const updatedResult = [
        {
          count: 0,
          totalestcredit: 0,
          totalissuedcredit: 0,
          totalbalancecredit: 0,
          totalretiredcredit: 0,
          totaltxcredit: 0,
          currentStage: SLDashboardProjectStage.AWAITING_AUTHORIZATION,
        },
        {
          count: 0,
          totalestcredit: 0,
          totalissuedcredit: 0,
          totalbalancecredit: 0,
          totalretiredcredit: 0,
          totaltxcredit: 0,
          currentStage: SLDashboardProjectStage.REJECTED,
        },
        {
          count: 0,
          totalestcredit: 0,
          totalissuedcredit: 0,
          totalbalancecredit: 0,
          totalretiredcredit: 0,
          totaltxcredit: 0,
          currentStage: SLDashboardProjectStage.AUTHORISED,
        },
      ];

      results.data.map((result) => {
        switch (result.projectProposalStage) {
          case "SUBMITTED_INF":
          case "APPROVED_INF":
          case "SUBMITTED_COST_QUOTATION":
          case "SUBMITTED_PROPOSAL":
          case "SUBMITTED_VALIDATION_AGREEMENT":
          case "ACCEPTED_PROPOSAL":
          case "SUBMITTED_CMA":
          case "REJECTED_CMA":
          case "APPROVED_CMA":
          case "VALIDATION_PENDING":
          case "REJECTED_VALIDATION":
            updatedResult[0].count = updatedResult[0].count + parseInt(result?.count);
            updatedResult[0].totalestcredit =
              updatedResult[0].totalestcredit + parseInt(result?.totalestcredit);
            updatedResult[0].totalissuedcredit =
              updatedResult[0].totalissuedcredit + parseInt(result?.totalissuedcredit);
            updatedResult[0].totalbalancecredit =
              updatedResult[0].totalbalancecredit + parseInt(result?.totalbalancecredit);
            updatedResult[0].totalretiredcredit =
              updatedResult[0].totalretiredcredit + parseInt(result?.totalretiredcredit);
            updatedResult[0].totaltxcredit =
              updatedResult[0].totaltxcredit + parseInt(result?.totaltxcredit);

            break;
          case "REJECTED_INF":
          case "REJECTED_PROPOSAL":
            updatedResult[1].count = updatedResult[1].count + parseInt(result?.count);
            updatedResult[1].totalestcredit =
              updatedResult[1].totalestcredit + parseInt(result?.totalestcredit);
            updatedResult[1].totalissuedcredit =
              updatedResult[1].totalissuedcredit + parseInt(result?.totalissuedcredit);
            updatedResult[1].totalbalancecredit =
              updatedResult[1].totalbalancecredit + parseInt(result?.totalbalancecredit);
            updatedResult[1].totalretiredcredit =
              updatedResult[1].totalretiredcredit + parseInt(result?.totalretiredcredit);
            updatedResult[1].totaltxcredit =
              updatedResult[1].totaltxcredit + parseInt(result?.totaltxcredit);
            break;
          case "AUTHORISED":
            updatedResult[2].count = updatedResult[2].count + parseInt(result?.count);
            updatedResult[2].totalestcredit =
              updatedResult[2].totalestcredit + parseInt(result?.totalestcredit);
            updatedResult[2].totalissuedcredit =
              updatedResult[2].totalissuedcredit + parseInt(result?.totalissuedcredit);
            updatedResult[2].totalbalancecredit =
              updatedResult[2].totalbalancecredit + parseInt(result?.totalbalancecredit);
            updatedResult[2].totalretiredcredit =
              updatedResult[2].totalretiredcredit + parseInt(result?.totalretiredcredit);
            updatedResult[2].totaltxcredit =
              updatedResult[2].totaltxcredit + parseInt(result?.totaltxcredit);
            break;
        }
      });
      return updatedResult;
    } else if (
      [StatType.MY_AGG_AUTH_PROGRAMME_BY_STATUS, StatType.AGG_AUTH_PROGRAMME_BY_STATUS].includes(
        stat.type
      ) &&
      !stat?.statFilter?.timeGroup
    ) {
      const updatedResult = [
        {
          count: 0,
          totalestcredit: 0,
          totalissuedcredit: 0,
          totalbalancecredit: 0,
          totalretiredcredit: 0,
          totaltxcredit: 0,
          currentStage: SLDashboardProjectStage.AUTHORISED,
        },
      ];

      results.data.map((result) => {
        switch (result.projectProposalStage) {
          case "AUTHORISED":
            updatedResult[0].count = updatedResult[0].count + parseInt(result?.count);
            updatedResult[0].totalestcredit =
              updatedResult[0].totalestcredit + parseInt(result?.totalestcredit);
            updatedResult[0].totalissuedcredit =
              updatedResult[0].totalissuedcredit + parseInt(result?.totalissuedcredit);
            updatedResult[0].totalbalancecredit =
              updatedResult[0].totalbalancecredit + parseInt(result?.totalbalancecredit);
            updatedResult[0].totalretiredcredit =
              updatedResult[0].totalretiredcredit + parseInt(result?.totalretiredcredit);
            updatedResult[0].totaltxcredit =
              updatedResult[0].totaltxcredit + parseInt(result?.totaltxcredit);
            break;
        }
      });
      return updatedResult;
    }

    return results;
  }

  calculateSumEmissions(obj: any, gasType: string) {
    let sum = 0;
    for (const key in obj) {
      if (key === gasType) {
        sum += obj[key];
      } else if (
        typeof obj[key] === "object" &&
        key !== "totalCo2WithLand" &&
        key !== "totalCo2WithoutLand"
      ) {
        sum += this.calculateSumEmissions(obj[key], gasType);
      }
    }
    return sum;
  }

  calculateSumEmissionsBySector(obj) {
    let sum = 0;
    for (const key in obj) {
      if (
        typeof obj[key] === "object" &&
        key !== "totalCo2WithLand" &&
        key !== "totalCo2WithoutLand"
      ) {
        sum += this.calculateSumEmissionsBySector(obj[key]);
      } else if (
        ["ch4", "co2", "n2o", "co2eq", "bau", "conditionalNdc", "unconditionalNdc"].includes(key)
      ) {
        sum += obj[key];
      }
    }
    return sum;
  }

  async getDataBySector(dataResult) {
    const xLabels: string[] = [];
    const agricultureForestryOtherLandUse: number[] = [];
    const energyEmissions: number[] = [];
    const industrialProcessesProductUse: number[] = [];
    const other: number[] = [];
    const waste: number[] = [];

    dataResult.forEach((item) => {
      xLabels.push(item.year);
      energyEmissions.push(this.calculateSumEmissionsBySector(item.energyEmissions));
      agricultureForestryOtherLandUse.push(
        this.calculateSumEmissionsBySector(item.agricultureForestryOtherLandUse)
      );
      industrialProcessesProductUse.push(
        this.calculateSumEmissionsBySector(item.industrialProcessesProductUse)
      );
      other.push(this.calculateSumEmissionsBySector(item.other));
      waste.push(this.calculateSumEmissionsBySector(item.waste));
    });

    const latestDate = this.getLatestUpdateTime(dataResult);

    return {
      data: {
        xLabels,
        agricultureForestryOtherLandUse,
        energyEmissions,
        industrialProcessesProductUse,
        other,
        waste,
      },
      last: latestDate,
    };
  }

  async getEmissionByGas(emissionResult) {
    const xLabels: string[] = [];
    const co2: number[] = [];
    const ch4: number[] = [];
    const n2o: number[] = [];
    const co2eq: number[] = [];

    emissionResult.forEach((emission) => {
      xLabels.push(emission.year);
      co2.push(this.calculateSumEmissions(emission, "co2"));
      ch4.push(this.calculateSumEmissions(emission, "ch4"));
      n2o.push(this.calculateSumEmissions(emission, "n2o"));
      co2eq.push(this.calculateSumEmissions(emission, "co2eq"));
    });

    const latestDate = this.getLatestUpdateTime(emissionResult);

    return {
      data: { xLabels, co2, ch4, n2o, co2eq },
      last: latestDate,
    };
  }

  async calculateEstimatedCreditsBySubSector(startYear, endYear) {
    const startTime = this.getFirstDayOfYear(startYear).getTime();
    const endTime = this.getLastDayOfYear(endYear).getTime();
    const estimatedCreditResult = await this.eventLogRepo
      .createQueryBuilder("event_log")
      .where("event_log.createdTime BETWEEN :startTime AND :endTime", { startTime, endTime })
      .andWhere("event_log.type = :type", { type: "ESTIMATED_CREDIT_ISSUE" })
      .orderBy("event_log.createdTime", "ASC")
      .getMany();

    let lastUpdate;

    // Grouping EventLog items by sectoralScope
    const groupedBySectoralScope = estimatedCreditResult.reduce((acc, log) => {
      const sectoralScope = log.eventData.sectoralScope;
      lastUpdate = log.createdTime;
      if (!acc[sectoralScope]) {
        acc[sectoralScope] = [];
      }
      acc[sectoralScope].push(log);
      return acc;
    }, {});

    const creditTotals = {};

    for (const key in EmissionSubSectorsToSectoralScopeMap) {
      const sectoralScope = EmissionSubSectorsToSectoralScopeMap[key];
      if (groupedBySectoralScope[sectoralScope]) {
        const logs = groupedBySectoralScope[sectoralScope];
        const totalCredits = logs.reduce((sum, log) => sum + log.eventData.estimatedCredits, 0);
        creditTotals[key] = totalCredits;
      } else {
        creditTotals[key] = 0; // Set to 0 if no matching data found
      }
    }

    return { creditTotals, lastUpdate };
  }

  async calculateIssuedCreditsBySubSector(startYear, endYear) {
    const startTime = this.getFirstDayOfYear(startYear).getTime();
    const endTime = this.getLastDayOfYear(endYear).getTime();
    const issuedCreditResult = await this.eventLogRepo
      .createQueryBuilder("event_log")
      .where("event_log.createdTime BETWEEN :startTime AND :endTime", { startTime, endTime })
      .andWhere("event_log.type = :type", { type: "ACTUAL_CREDIT_ISSUE" })
      .orderBy("event_log.createdTime", "ASC")
      .getMany();

    let lastUpdate;

    // Grouping EventLog items by sectoralScope
    const groupedBySectoralScope = issuedCreditResult.reduce((acc, log) => {
      const sectoralScope = log.eventData.sectoralScope;
      lastUpdate = log.createdTime;
      if (!acc[sectoralScope]) {
        acc[sectoralScope] = [];
      }
      acc[sectoralScope].push(log);
      return acc;
    }, {});

    const creditTotals = {};

    for (const key in EmissionSubSectorsToSectoralScopeMap) {
      const sectoralScope = EmissionSubSectorsToSectoralScopeMap[key];
      if (groupedBySectoralScope[sectoralScope]) {
        const logs = groupedBySectoralScope[sectoralScope];
        const totalCredits = logs.reduce((sum, log) => sum + log.eventData.issuedCredits, 0);
        creditTotals[key] = totalCredits;
      } else {
        creditTotals[key] = 0; // Set to 0 if no matching data found
      }
    }

    return { creditTotals, lastUpdate };
  }

  async calculateProjectionBauBySubSector(projections) {
    let totalBau = {};
    projections.forEach((projection) => {
      for (const key in EmissionSubSectorsPathMap) {
        const path = EmissionSubSectorsPathMap[key];
        let matchingValue;

        if (path.includes(".")) {
          // Handle paths with nested properties
          const pathSegments = path.split(".");
          matchingValue = pathSegments.reduce((obj, prop) => obj[prop], projection);
        } else {
          // Handle direct property access
          matchingValue = projection[path];
        }

        const calculatedBau = this.calculateSumEmissions(matchingValue, "bau");
        if (totalBau[key]) {
          totalBau[key] = totalBau[key] + calculatedBau;
        } else {
          totalBau[key] = calculatedBau;
        }
      }
    });
    const latestDate = this.getLatestUpdateTime(projections);
    return { totalBau, latestDate };
  }

  async getPendingVerifications(user: User) {
    const query = this.verificationRequestRepo
      .createQueryBuilder("ve")
      .innerJoin("programme_sl", "psl", "ve.programmeId = psl.programmeId")
      .select("COUNT(*)", "count") // Select count
      .addSelect("MAX(ve.updatedTime)", "latestUpdatedTime") // Select latest updated time
      .where("ve.status != :status", { status: "VERIFICATION_REPORT_VERIFIED" });

    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      query.andWhere("psl.companyId = :companyId", { companyId: user.companyId });
    }

    const result = await query.getRawOne();
    return {
      count: parseInt(result.count, 10),
      latestUpdatedTime: result.latestUpdatedTime,
    };
  }

  async getPendingRetirements(user: User) {
    const query = this.creditRetirementSlRequestRepo
      .createQueryBuilder("cr")
      .select("COUNT(*)", "count") // Select count
      .addSelect("MAX(cr.createdTime)", "latestUpdatedTime") // Select latest updated time
      .where("cr.status = :status", { status: "Pending" });

    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      query.andWhere("(cr.fromCompanyId = :companyId OR cr.toCompanyId = :companyId)", {
        companyId: user.companyId,
      });
    }
    const result = await query.getRawOne();

    return {
      count: parseInt(result.count, 10),
      latestUpdatedTime: result.latestUpdatedTime,
    };
  }

  async getCreditTypeSummary(statFilter: StatFilter, user: User) {
    let query = this.programmeSlRepo
      .createQueryBuilder("programme")
      .select("programme.purposeOfCreditDevelopment", "purposeOfCreditDevelopment")
      .addSelect("SUM(programme.creditEst)", "totalCreditEst")
      .where("programme.projectProposalStage = :stage", { stage: "AUTHORISED" });

    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      query.andWhere("programme.companyId = :companyId", { companyId: user.companyId });
    }
    if (statFilter.startTime && statFilter.endTime) {
      query.andWhere("programme.createdTime BETWEEN :startTime AND :endTime", {
        startTime: statFilter.startTime,
        endTime: statFilter.endTime,
      });
      // query
      //   .andWhere("programme.createdTime >= :startTime", { startTime: statFilter.startTime })
      //   .andWhere("programme.createdTime <= :endTime", { endTime: statFilter.endTime });
    }
    const result = await query.groupBy("programme.purposeOfCreditDevelopment").getRawMany();

    const formattedResult = result.reduce((acc, item) => {
      acc[item.purposeOfCreditDevelopment] = item.totalCreditEst;
      return acc;
    }, {});

    return formattedResult;
  }

  async getEstimatedSubSectorData(projectionResult, startYear, endYear) {
    const totalEstimatedCreditsPerSubSector = await this.calculateEstimatedCreditsBySubSector(
      startYear,
      endYear
    );
    const totalIssuedCreditsPerSubSector = await this.calculateIssuedCreditsBySubSector(
      startYear,
      endYear
    );
    const totalProjectedBauPerSubSector = await this.calculateProjectionBauBySubSector(
      projectionResult
    );

    const estimatePercentage = {};
    const issuePercentage = {};

    for (const key in EmissionSubSectorsToSectoralScopeMap) {
      estimatePercentage[key] =
        totalEstimatedCreditsPerSubSector?.creditTotals[key] /
        totalProjectedBauPerSubSector?.totalBau[key];
      issuePercentage[key] =
        totalIssuedCreditsPerSubSector?.creditTotals[key] /
        totalProjectedBauPerSubSector?.totalBau[key];
    }

    // Get keys of the original object
    const estimatedKeys = Object.keys(estimatePercentage);
    const issuedKeys = Object.keys(issuePercentage);

    // Create an object to hold arrays for each key
    const estimatedResultObject = {};
    const issuedResultObject = {};

    const xLabels: any[] = [
      ["Fuel", "Combustion", "Activities"],
      ["Fugitive", "emissions", " from", "fuels"],
      ["Carbon", "dioxide", "Transport", "and", "Storage"],
      ["Mineral", "Industry"],
      ["Chemical", "Industry"],
      ["Metal", "Industry"],
      ["Non-Energy", "Products", "from", "Fuels", "and", "Solvent", "Use"],
      ["Electronics", "Industry"],
      ["Product", "Uses as", "Substitutes", "for", "Ozone", "Depleting", "Substances"],
      ["Other", "Product", "Manufacture", "and", "Use"],
      ["Other", "(Industrial", "Processes", "&", "Product", "Use)"],
      "Livestock",
      "Land",
      ["Aggregate", "sources", "and", "non-CO2", "emissions", "sources", "on land"],
      ["Other", "(Agriculture,", "Forestry,", "and", "Other", "Land", "Use)"],
      ["Solid", "Waste", "Disposal"],
      ["Biological", "Treatment", "of", "Solid", "Waste"],
      ["Incineration", "and", "Open", "Burning", "of", "Waste"],
      ["Wastewater", "Treatment", "and", "Discharge"],
      ["Other", "(Waste)"],
      [
        "Indirect",
        "N2O",
        "emissions",
        "from",
        "the",
        "atmospheric",
        "deposition",
        "of nitrogen",
        "in NOx",
        "and NH3",
      ],
      "Other",
    ];

    estimatedResultObject["xLabels"] = xLabels;
    issuedResultObject["xLabels"] = xLabels;

    // Loop through the keys and assign values at corresponding index in arrays
    estimatedKeys.forEach((key, index) => {
      estimatedResultObject[key] = Array(estimatedKeys.length).fill(0);
      estimatedResultObject[key][index] = estimatePercentage[key];
    });

    issuedKeys.forEach((key, index) => {
      issuedResultObject[key] = Array(issuedKeys.length).fill(0);
      issuedResultObject[key][index] = issuePercentage[key];
    });

    return {
      data: {
        estimate: {
          data: estimatedResultObject,
          last: totalProjectedBauPerSubSector?.latestDate,
        },
        actual: {
          data: issuedResultObject,
          last: totalProjectedBauPerSubSector?.latestDate,
        },
      },
    };
  }

  async getComparisonChartData(emissionResult, projectionResult) {
    const xLabels: string[] = [];
    const bau: number[] = [];
    const conditionalNdc: number[] = [];
    const unconditionalNdc: number[] = [];
    const actual: number[] = [];
    let last = 0;

    projectionResult.forEach((projection) => {
      xLabels.push(projection.year);
      bau.push(this.calculateSumEmissions(projection, "bau"));
      conditionalNdc.push(this.calculateSumEmissions(projection, "conditionalNdc"));
      unconditionalNdc.push(this.calculateSumEmissions(projection, "unconditionalNdc"));
      last = projection.updatedAt;

      const emissionDataForYear = emissionResult.find(
        (emission) => emission.year === projection.year
      );
      if (emissionDataForYear) {
        actual.push(this.calculateSumEmissionsBySector(emissionDataForYear));
        last = emissionDataForYear.updatedAt;
      } else {
        actual.push(0);
      }
    });

    const latestEmissionDate = this.getLatestUpdateTime(emissionResult);
    const latestProjectionDate = this.getLatestUpdateTime(projectionResult);

    return {
      data: { xLabels, bau, conditionalNdc, unconditionalNdc, actual },
      last: latestEmissionDate > latestProjectionDate ? latestEmissionDate : latestProjectionDate,
    };
  }

  async calculateGhgStat(stat: Stat, results, system: SYSTEM_TYPE) {
    const key = stat.key ? stat.key : stat.type;

    const startYear =
      stat?.statFilter.startTime && stat?.statFilter.startTime !== 0
        ? stat?.statFilter.startTime
        : new Date().getFullYear() - 10;
    const endYear =
      stat?.statFilter.endTime && stat?.statFilter.endTime !== 0
        ? stat?.statFilter.endTime
        : new Date().getFullYear();
    const emissionResult = await this.emissionRepo
      .createQueryBuilder("emission")
      .where("emission.year BETWEEN :startYear AND :endYear", { startYear, endYear })
      .andWhere("emission.state = :status", { status: "FINALIZED" })
      .orderBy("emission.year", "ASC")
      .getMany();

    const projectionResult = await this.projectionRepo
      .createQueryBuilder("projection")
      .where("projection.year BETWEEN :startYear AND :endYear", { startYear, endYear })
      .andWhere("projection.state = :status", { status: "FINALIZED" })
      .orderBy("projection.year", "ASC")
      .getMany();

    switch (system) {
      case SYSTEM_TYPE.CARBON_TRANSPARENCY:
        switch (stat.type) {
          case StatType.AGG_EMISSIONS_BY_SECTOR:
            results[key] = await this.getDataBySector(emissionResult);
            break;
          case StatType.AGG_EMISSIONS_BY_GAS:
            results[key] = await this.getEmissionByGas(emissionResult);
            break;
          case StatType.AGG_EMISSIONS_MITIGATION_POTENTIAL_BY_SECTOR:
            results[key] = await this.getDataBySector(projectionResult);
            break;
          case StatType.AGG_REDUCTION_PERCENT_BAU_BY_SECTOR:
            results[key] = await this.getEstimatedSubSectorData(
              projectionResult,
              startYear,
              endYear
            );
            break;
          case StatType.AGG_EMISSIONS_COMPARISON:
            results[key] = await this.getComparisonChartData(emissionResult, projectionResult);
            break;
        }
    }
  }

  async getGhgEmissionStats(query: StatList, system: SYSTEM_TYPE): Promise<DataCountResponseDto> {
    let results = {};

    for (const stat of query.stats) {
      await this.calculateGhgStat(stat, results, system);
    }
    return new DataCountResponseDto(results);
  }

  private groupByStatus(key: string, data: any) {
    const mapping = {};
    for (const d of data) {
      if (!mapping[d[key]]) {
        mapping[d[key]] = [];
      }
      mapping[d[key]].push(d);
    }

    return data;
  }

  private getLastDayOfYear(yearString) {
    // Convert the year string to a number
    const year = Number(yearString);

    // Create a Date object for the next year and set its day to 0 (last day of the current year)
    const lastDayOfYear = new Date(year + 1, 0, 0);

    // Set the time to the last minute of the day
    lastDayOfYear.setHours(23, 59, 59, 999);

    return lastDayOfYear;
  }

  private getFirstDayOfYear(yearString) {
    // Convert the year string to a number
    const year = Number(yearString);

    // Create a Date object for the given year and set the month and day to January 1st
    const firstDayOfYear = new Date(year, 0, 1);

    // Set the time to the first minute of the day
    firstDayOfYear.setHours(0, 0, 0, 0);

    return firstDayOfYear;
  }

  private getLatestUpdateTime(emissionDataArray) {
    const updateTimeObjects = emissionDataArray.map((item) => new Date(item.updatedAt));

    updateTimeObjects.sort((a, b) => b - a);

    return new Date(updateTimeObjects[0]).getTime(); // Return the latest timestamp
  }
}
