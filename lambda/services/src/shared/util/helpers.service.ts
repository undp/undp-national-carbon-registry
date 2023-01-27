import { Injectable } from "@nestjs/common";
import e from "express";
import { QueryDto } from "../dto/query.dto";
import { StatList } from "../dto/stat.list.dto";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { Stat } from "../dto/stat.dto";
import { programmeStatusRequestDto } from "../dto/programmeStatus.request.dto";
import { chartStatsRequestDto } from "../dto/chartStats.request.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class HelperService {
  constructor(private configService: ConfigService) {}

  private prepareValue(value: any) {
    console.log(value.constructor);
    if (value instanceof Array) {
      return "(" + value.map((e) => `'${e}'`).join(",") + ")";
    } else if (typeof value === "string") {
      return "'" + value + "'";
    }
    return value;
  }

  public generateWhereSQLChartStastics(
    data: chartStatsRequestDto,
    extraSQL: string,
    table?: string
  ) {
    let sql = "";
    let col = "";
    let colFilter = "createdTime";

    if (data?.type === "TOTAL_PROGRAMS") {
      col = "currentStage";
      sql = `${table ? table + "." : ""}"${colFilter}" > ${this.prepareValue(
        data?.startDate
      )} and ${table ? table + "." : ""}"${colFilter}" < ${this.prepareValue(
        data?.endDate
      )}`;
    } else if (data?.type === "TOTAL_CREDITS_CERTIFIED") {
      col = "certifierId";
      sql = `${table ? table + "." : ""}"${colFilter}" > ${this.prepareValue(
        data?.startDate
      )} and ${table ? table + "." : ""}"${colFilter}" < ${this.prepareValue(
        data?.endDate
      )}`;
    }

    if (sql != "") {
      if (data?.companyId !== "") {
        let colCheck = "companyId";
        let companyId = data?.companyId;
        sql = `(${sql}) and ${
          table ? table + "." : ""
        }"${colCheck}" @> '{${companyId}}'`;
      }
    } else {
      if (data?.companyId !== "") {
        let colCheck = "companyId";
        let companyId = data?.companyId;
        sql = `${table ? table + "." : ""}"${colCheck}" @> '{${companyId}}'`;
      }
    }

    if (sql != "") {
      if (extraSQL) {
        sql = `(${sql}) and (${extraSQL})`;
      }
    } else if (extraSQL) {
      sql = extraSQL;
    }
    return sql;
  }

  public generateWhereSQLChartStasticsWithoutTimeRange(
    data: programmeStatusRequestDto,
    extraSQL: string,
    table?: string
  ) {
    let sql = "";
    let col = "";

    if (data?.type === "TRANSFER_REQUEST_SENT") {
      col = "fromCompanyId";
      sql = `${table ? table + "." : ""}"${col}" is not null`;
    } else if (data?.type === "TRANSFER_REQUEST_RECEIVED") {
      col = "toCompanyId";
      sql = `${table ? table + "." : ""}"${col}" is not null`;
    } else if (data?.type === "PROGRAMS_CERTIFIED") {
      col = "certifierId";
      sql = `${table ? table + "." : ""}"${col}" is not null`;
    } else if (data?.type === "PROGRAMS_UNCERTIFIED") {
      col = "certifierId";
      sql = `${table ? table + "." : ""}"${col}" is null`;
    }

    if (sql != "") {
      if (extraSQL) {
        sql = `(${sql}) and (${extraSQL})`;
      }
    } else if (extraSQL) {
      sql = extraSQL;
    }
    return sql;
  }

  public generateWhereSQLStastics(
    data: programmeStatusRequestDto,
    extraSQL: string,
    table?: string
  ) {
    let sql = "";
    let col = "";
    let colFilter = "createdTime";

    if (data?.type === "PROGRAMS_BY_STATUS") {
      col = "currentStage";
      sql = `${table ? table + "." : ""}"${col}" = ${this.prepareValue(
        ProgrammeStage[data?.value]
      )}`;
    } else if (data?.type.includes("CREDIT_CERTIFIED")) {
      col = "certifierId";
      sql = `${table ? table + "." : ""}"${col}" is not null`;
    }

    if (
      data?.startTime &&
      data?.endTime &&
      data?.type.includes("CREDIT_STATS")
    ) {
      sql = `${table ? table + "." : ""}"${colFilter}" > ${this.prepareValue(
        data?.startTime
      )} and ${table ? table + "." : ""}"${colFilter}" < ${this.prepareValue(
        data?.endTime
      )}`;
    } else if (data?.startTime && data?.endTime) {
      if (sql != "") {
        sql = `(${sql}) and ${
          table ? table + "." : ""
        }"${colFilter}" > ${this.prepareValue(data?.startTime)} and ${
          table ? table + "." : ""
        }"${colFilter}" < ${this.prepareValue(data?.endTime)}`;
      } else {
        sql = sql = `${
          table ? table + "." : ""
        }"${colFilter}" > ${this.prepareValue(data?.startTime)} and ${
          table ? table + "." : ""
        }"${colFilter}" < ${this.prepareValue(data?.endTime)}`;
      }
    }

    if (sql != "") {
      if (data?.companyId !== "") {
        let colCheck = "companyId";
        let companyId = data?.companyId;
        sql = `(${sql}) and ${
          table ? table + "." : ""
        }"${colCheck}" @> '{${companyId}}'`;
      }
    } else {
      if (data?.companyId !== "") {
        let colCheck = "companyId";
        let companyId = data?.companyId;
        sql = `${table ? table + "." : ""}"${colCheck}" @> '{${companyId}}'`;
      }
    }

    if (sql != "") {
      if (extraSQL) {
        sql = `(${sql}) and (${extraSQL})`;
      }
    } else if (extraSQL) {
      sql = extraSQL;
    }
    console.log(sql);

    return sql;
  }

  public generateWhereSQL(query: QueryDto, extraSQL: string, table?: string) {
    let sql = "";
    if (query.filterAnd) {
      sql += query.filterAnd
        .map(
          (e) =>
            `${table ? table + "." : ""}"${e.key}" ${
              e.operation
            } ${this.prepareValue(e.value)}`
        )
        .join(" and ");
    }
    if (query.filterOr) {
      const orSQl = query.filterOr
        .map(
          (e) =>
            `${table ? table + "." : ""}"${e.key}" ${e.operation} ${
              typeof e.value === "string" ? "'" + e.value + "'" : e.value
            }`
        )
        .join(" or ");
      if (sql != "") {
        sql = `(${sql}) and (${orSQl})`;
      } else {
        sql = orSQl;
      }
    }

    if (sql != "") {
      if (extraSQL) {
        sql = `(${sql}) and (${extraSQL})`;
      }
    } else if (extraSQL) {
      sql = extraSQL;
    }
    console.log(sql);

    return sql;
  }

  public parseMongoQueryToSQL(mongoQuery, isNot = false, key = undefined) {
    return this.parseMongoQueryToSQLWithTable(
      undefined,
      mongoQuery,
      isNot,
      key
    );
  }

  public parseMongoQueryToSQLWithTable(
    table,
    mongoQuery,
    isNot = false,
    key = undefined
  ) {
    let final = undefined;
    for (let operator in mongoQuery) {
      if (operator.startsWith("$")) {
        if (operator == "$and" || operator == "$or") {
          const val = mongoQuery[operator]
            .map((st) => this.parseMongoQueryToSQLWithTable(table, st))
            .join(` ${operator.replace("$", "")} `);
          final = final == undefined ? val : `${final} and ${val}`;
        } else if (operator == "$not") {
          return this.parseMongoQueryToSQLWithTable(
            table,
            mongoQuery["$not"],
            !isNot
          );
        } else if (operator == "$eq") {
          const value =
            typeof mongoQuery["$eq"] === "number"
              ? String(mongoQuery["$eq"])
              : `'${mongoQuery["$eq"]}'`;
          return `${table ? table + "." : ""}"${key}" ${
            isNot ? "!=" : "="
          } ${value}`;
        } else if (operator == "$ne") {
          const value =
            typeof mongoQuery["$ne"] === "number"
              ? String(mongoQuery["$ne"])
              : `'${mongoQuery["$ne"]}'`;
          return `${table ? table + "." : ""}"${key}" ${
            isNot ? "=" : "!="
          } ${value}`;
        } else if (operator == "$in") {
          const value = `('${mongoQuery["$in"].join("', '")}')`;
          return `${table ? table + "." : ""}"${key}" ${
            isNot ? " NOT IN " : " IN "
          } ${value}`;
        } else if (operator == "$elemMatch") {
          return `'${mongoQuery["$elemMatch"]["$eq"]}' ${
            isNot ? " <> ANY " : " =ANY "
          }(${table ? table + "." : ""}"${key}")`;
        }
      } else {
        return this.parseMongoQueryToSQLWithTable(
          table,
          mongoQuery[operator],
          isNot,
          operator
        );
      }
    }
    return final;
  }

  public async uploadCompanyLogoS3(companyId: number, companyLogo: string) {
    var AWS = require("aws-sdk");
    const s3 = new AWS.S3();

    const imgBuffer = Buffer.from(companyLogo, "base64");
    var uploadParams = {
      Bucket: this.configService.get<string>("s3CommonBucket"),
      Key: "",
      Body: imgBuffer,
      ContentEncoding: "base64",
      ContentType: "image/png",
    };
    uploadParams.Key = `ProfileImages/${companyId}.png`;

    return await s3
      .upload(uploadParams, function (err, data) {
        if (err) {
          return {
            status: false,
            statusText: err,
          };
        }
        if (data) {
          return {
            status: true,
            statusText: data.Location,
          };
        }
      })
      .promise();
  }
}
