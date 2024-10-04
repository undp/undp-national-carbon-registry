import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataListResponseDto } from "src/dto/data.list.response";
import { QueryDto } from "src/dto/query.dto";
import { CreditAuditLog } from "src/entities/credit.audit.log.entity";
import { CreditAuditLogViewEntity } from "src/entities/creditAuditLog.view.entity";
import { CountryService } from "src/util/country.service";
import { HelperService } from "src/util/helpers.service";
import { Repository } from "typeorm";

@Injectable()
export class NationalAccountingService {
  constructor(
    @InjectRepository(CreditAuditLog) private creditAuditLogRepo: Repository<CreditAuditLog>,
    @InjectRepository(CreditAuditLogViewEntity)
    private creditAuditLogViewRepo: Repository<CreditAuditLogViewEntity>,
    private helperService: HelperService,
    private readonly countryService: CountryService
  ) {}

  async getTotalStats() {
    const result = await this.creditAuditLogRepo
      .createQueryBuilder("log")
      .select("log.type", "type")
      .addSelect("SUM(log.credits)", "sumCredits")
      .addSelect("MAX(log.createdTime)", "latestTime")
      .groupBy("log.type")
      .getRawMany();

    const formattedResult = result.reduce((acc, item) => {
      acc[item.type] = {
        credits: item.sumCredits,
        lastUpdated: item.latestTime ? Math.floor(item.latestTime.getTime()) : 0,
      };
      return acc;
    }, {});

    return formattedResult;
  }

  async getTransactionRecords(query: QueryDto, abilityCondition: string) {
    // Query for data
    let dataQueryBuilder = this.creditAuditLogViewRepo
      .createQueryBuilder("log")
      .select("log.id", "id")
      .addSelect("log.type", "type")
      .addSelect("log.credits", "credits")
      .addSelect("log.country", "country")
      .addSelect("log.createdTime", "createdTime")
      .addSelect("log.programmeId", "programmeId")
      .addSelect("log.programmeTitle", "programmeTitle")
      .addSelect("log.programmeSector", "programmeSector")
      .addSelect("log.company", "company")
      .addSelect("log.programmeCompanyId", "programmeCompanyId")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable("log", abilityCondition)
        )
      )
      .orderBy(
        query?.sort?.key ? `"log"."${query?.sort?.key}"` : `"log"."id"`,
        query?.sort?.order ? query?.sort?.order : "DESC"
      );

    if (query.size && query.page) {
      dataQueryBuilder.offset(query.size * query.page - query.size).limit(query.size);
    }

    const data = await dataQueryBuilder.getRawMany();

    if (data && data.length > 0) {
      for (const e of data) {
        if (e.country) {
          e.countryName = await this.countryService.getCountryName(e.country);
        }
      }
    }

    // Query for count
    let countQueryBuilder = this.creditAuditLogViewRepo
      .createQueryBuilder("log")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable("log", abilityCondition)
        )
      );

    const total = await countQueryBuilder.getCount();

    // return resp;
    return new DataListResponseDto(data, total);
  }

  async getRetiresByCountry(query: QueryDto, abilityCondition: string) {
    let dataQueryBuilder = this.creditAuditLogViewRepo
      .createQueryBuilder("log")
      .select("log.country", "country")
      .addSelect("SUM(log.credits)", "totalCredits")
      .addSelect("COUNT(log.credits)", "transactionCount")
      .addSelect("MAX(log.createdTime)", "latestTime")
      .where("log.country IS NOT NULL");

    // Dynamically adding additional conditions if any
    if (query.filterAnd) {
      dataQueryBuilder = dataQueryBuilder.andWhere(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable("log", abilityCondition)
        )
      );
    }

    // Clone the query builder for counting distinct countries
    const countQueryBuilder = dataQueryBuilder.clone();

    dataQueryBuilder = dataQueryBuilder
      .groupBy("log.country")
      .orderBy(
        query?.sort?.key
          ? query?.sort?.key === "totalCredits"
            ? `SUM(log.credits)`
            : query?.sort?.key === "latestTime"
            ? 'MAX("log"."createdTime")'
            : `"log"."${query?.sort?.key}"`
          : `SUM(log.credits)`,
        query?.sort?.order ? query?.sort?.order : "DESC"
      );

    // Apply pagination if required
    if (query.size && query.page) {
      dataQueryBuilder = dataQueryBuilder
        .offset(query.size * query.page - query.size)
        .limit(query.size);
    }

    const data = await dataQueryBuilder.getRawMany();

    // Execute the count query
    const totalCountries = await countQueryBuilder
      .select("COUNT(DISTINCT log.country)", "count")
      .getRawOne();

    const formattedResult = [];

    for (const item of data) {
      const countryName = await this.countryService.getCountryName(item.country);
      formattedResult.push({
        country: item.country,
        credits: item.totalCredits,
        countryName,
        transactionCount: item.transactionCount,
        latestTime: item.latestTime,
      });
    }

    return new DataListResponseDto(formattedResult, totalCountries?.count);
  }
}
