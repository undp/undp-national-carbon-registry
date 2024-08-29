import { Injectable } from "@nestjs/common";
import e from "express";
import { QueryDto } from "../dto/query.dto";
import { StatList } from "../dto/stat.list.dto";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { Stat } from "../dto/stat.dto";
import { chartStatsRequestDto } from "../dto/chartStats.request.dto";
import { ConfigService } from "@nestjs/config";
import { I18nService } from "nestjs-i18n";
import { programmeStatusRequestDto } from "../dto/programmeStatus.request.dto";
import { Integer } from "ion-js/dist/commonjs/es6/dom";

@Injectable()
export class HelperService {
  constructor(
    private configService: ConfigService,
    private i18n: I18nService
  ) {}

  public isBase64(text: string): boolean {
    return Buffer.from(text, 'base64').toString('base64') === text
  }

  public enumToString(enumObj, value) {
    const keys = Object.keys(enumObj);
    for (const key of keys) {
      if (enumObj[key] === value) {
        return key;
      }
    }
    return null; // Or throw an error if the value is not found
  }

  public generateRandomNumber(length = 6) {
    var text = "";
    var possible = "123456789";
    for (var i = 0; i < length; i++) {
      var sup = Math.floor(Math.random() * possible.length);
      text += i > 0 && sup == i ? "0" : possible.charAt(sup);
    }
    return Number(text);
  }

  public halfUpToPrecision(value:number,precision:number=2){
    if(precision>0)
    {
      return parseFloat((value*(10**precision)).toFixed(0))/(10**precision)
    }
    else if(precision==0){
      return parseFloat(value.toFixed(0))
    }
    return value
  }
  
  private prepareValue(value: any, table?: string, toLower?: boolean) {
    if (value instanceof Array) {
      return "(" + value.map((e) => `'${e}'`).join(",") + ")";
    } else if (this.isQueryDto(value)) {
      return this.generateWhereSQL(value, undefined, table);
    } else if (typeof value === "string") {
      if (value === "NULL") {
        return value;
      }
      if (toLower != true) {
        return "'" + value + "'";
      } else {
        return "LOWER('" + value + "')";
      }
    }
    return value;
  }

  private prepareKey(col: string, table?: string) {
    let key;
    if (col.includes("->>")) {
      const parts = col.split("->>");
      key = `"${parts[0]}"->>'${parts[1]}'`;
    } else {
      key = `"${col}"`;
    }
    return `${table ? table + "." : ""}${key}`;
  }

  private isLower(key: string) {
    if (
      [
        "email",
        "name",
        "companyName",
        "taxId",
        "country",
        "title",
        "externalId",
        "serialNo",
        "programmeTitle",
        "programmeName",
        "id"
      ].includes(key)
    )
      return true;
  }

  public generateSortCol(col: string) {
    if (col.includes("->>")) {
      const parts = col.split("->>");
      return `"${parts[0]}"->>'${parts[1]}'`;
    } else if (col.includes("[")) {
      const parts = col.split("[");
      return `"${parts[0]}"[${parts[1]}`;
    } else {
      return `"${col}"`;
    }
  }

  public generateRandomPassword() {
    var pass = "";
    var str =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz0123456789@$";

    for (let i = 1; i <= 8; i++) {
      var char = Math.floor(Math.random() * str.length + 1);

      pass += str.charAt(char);
    }

    return pass;
  }

  public formatReqMessagesString(langTag: string, vargs: any[]) {
    const str: any = this.i18n.t(langTag);
    const parts: any = str.split("{}");
    let insertAt = 1;
    for (const arg of vargs) {
      parts.splice(insertAt, 0, arg);
      insertAt += 2;
    }
    return parts.join("");
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

  private isQueryDto(obj) {
    if (
      obj &&
      typeof obj === "object" &&
      (obj["filterAnd"] || obj["filterOr"])
    ) {
      return true;
    }
    return false;
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
      sql = `${
        table ? table + "." : ""
      }"${col}" is not null and "${col}" != '{}'`;
    } else if (data?.type === "CREDIT_UNCERTIFIED") {
      col = "certifierId";
      sql = `${table ? table + "." : ""}"${col}" is null`;
    } else if (data?.type === "CREDIT_REVOKED") {
      col = "certifierId";
      sql = `${table ? table + "." : ""}"${col}" = '{}'`;
    } else if (data?.type === "CREDIT_STATS_FROZEN") {
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
        sql = `${table ? table + "." : ""}"${colFilter}" > ${this.prepareValue(
          data?.startTime
        )} and ${table ? table + "." : ""}"${colFilter}" < ${this.prepareValue(
          data?.endTime
        )}`;
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

    return sql;
  }

  public generateWhereSQL(query: QueryDto, extraSQL: string, table?: string, ignoreCol?: string[]) {
    let sql = "";
    if (query.filterAnd) {
      if (ignoreCol) {
        query.filterAnd = query.filterAnd.filter(e=> (ignoreCol.indexOf(e.key) >= 0))
      }
      sql += query.filterAnd
        .map((e) => {
          if (this.isQueryDto(e.value)) {
            return `(${this.prepareValue(e.value, table)})`;
          } else if (e.operation === "ANY") {
            return `${this.prepareValue(
              e.value,
              table
            )} = ANY(${this.prepareKey(e.key, table)})`;
          } else if (e.keyOperation) {
            return `${e.keyOperation}(${this.prepareKey(e.key, table)}) ${
              e.operation
            } ${this.prepareValue(e.value, table, true)}`;
          } else if (this.isLower(e.key) && typeof e.value === "string") {
            return `LOWER(${this.prepareKey(e.key, table)}) ${
              e.operation
            } ${this.prepareValue(e.value, table, true)}`;
          } else {
            return `${this.prepareKey(e.key, table)} ${
              e.operation
            } ${this.prepareValue(e.value, table)}`;
          }
        })
        .join(" and ");
    }
    if (query.filterOr) {
      if (ignoreCol) {
        query.filterOr = query.filterOr.filter(e=> (ignoreCol.indexOf(e.key) >= 0))
      }
      const orSQl = query.filterOr
        .map((e) => {
          if (this.isQueryDto(e.value)) {
            return `(${this.prepareValue(e.value, table)})`;
          } else if (e.operation === "ANY") {
            return `${this.prepareValue(
              e.value,
              table
            )} = ANY(${this.prepareKey(e.key, table)})`;
          } else if (e.keyOperation) {
            return `${e.keyOperation}(${this.prepareKey(e.key, table)}) ${
              e.operation
            } ${this.prepareValue(e.value, table, true)}`;
          } else if (this.isLower(e.key) && typeof e.value === "string") {
            return `LOWER(${this.prepareKey(e.key, table)}) ${
              e.operation
            } ${this.prepareValue(e.value, table, true)}`;
          } else {
            return `${this.prepareKey(e.key, table)} ${
              e.operation
            } ${this.prepareValue(e.value, table)}`;
          }
        })
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

  
  public getEmailTemplateMessage(template: string, data, isSubject: boolean) :string{
    if (template == undefined) {
        return template;
    }
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            var find = `{{${key}}}`;
            var re = new RegExp(find, 'g');
            template = template.replace(re, data[key]);
        }
    }

    if(isSubject) 
      return `${this.configService.get("email.getemailprefix")} Carbon Registry: ${template}`;
    else 
      return template;
}

public formatTimestamp(timestamp: any) {
  if (timestamp) {
    const parsedTimestamp = Number(timestamp);

    if (!isNaN(parsedTimestamp)) {
      const date = new Date(parsedTimestamp);

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }
  
}

  // public async uploadCompanyLogoS3(companyId: number, companyLogo: string) {
  // var AWS = require("aws-sdk");
  // const s3 = new AWS.S3();
  // const imgBuffer = Buffer.from(companyLogo, "base64");
  // var uploadParams = {
  //   Bucket: this.configService.get<string>("s3CommonBucket.name"),
  //   Key: "",
  //   Body: imgBuffer,
  //   ContentEncoding: "base64",
  //   ContentType: "image/png",
  // };

  // uploadParams.Key = `profile_images/${companyId}_${new Date().getTime()}.png`;

  // return await s3
  //   .upload(uploadParams, function (err, data) {
  //     if (err) {
  //       return {
  //         status: false,
  //         statusText: err,
  //       };
  //     }
  //     if (data) {
  //       return {
  //         status: true,
  //         statusText: data.Location,
  //       };
  //     }
  //   })
  //   .promise();
  // }
}
