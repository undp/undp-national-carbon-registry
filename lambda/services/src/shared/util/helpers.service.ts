import { Injectable } from "@nestjs/common";
import e from "express";
import { QueryDto } from "../dto/query.dto";

@Injectable()
export class HelperService {

    private prepareValue(value: any) {
        console.log(value.constructor)
        if (value instanceof Array) {
            return '(' + value.map((e) => `'${e}'`).join(',') + ')'
        } else if (typeof value === 'string') {
            return "'" + value + "'"
        }
        return value;
    }
    public generateWhereSQL(query: QueryDto, extraSQL: string, table?: string) {
        let sql = '';
        if (query.filterAnd) {
            sql += query.filterAnd.map((e) => `${table ? table + '.' : ''}"${e.key}" ${e.operation} ${this.prepareValue(e.value)}`).join(' and ')
        }
        if (query.filterOr) {
            const orSQl = query.filterOr.map((e) => `${table ? table + '.' : ''}"${e.key}" ${e.operation} ${typeof e.value === 'string' ? "'" + e.value + "'" : e.value}`).join(' or ')
            if (sql != '') {
                sql = `(${sql}) and (${orSQl})`
            } else {
                sql = orSQl
            }
        }

        if (sql != '') {
            if (extraSQL) {
                sql = `(${sql}) and (${extraSQL})`
            }
        } else if (extraSQL) {
            sql = extraSQL;
        }
        console.log(sql)

        return sql;
    }

    public parseMongoQueryToSQL(mongoQuery, isNot = false, key = undefined) {
        return this.parseMongoQueryToSQLWithTable(undefined, mongoQuery, isNot, key)
    }

    public parseMongoQueryToSQLWithTable(table, mongoQuery, isNot = false, key = undefined) {
        let final = undefined;
        for (let operator in mongoQuery) {
          if (operator.startsWith("$")) {
            if (operator == "$and" || operator == "$or") {
              const val = mongoQuery[operator].map(st => this.parseMongoQueryToSQLWithTable(table, st)).join(` ${operator.replace("$", '')} `)
              final = final == undefined ? val : `${final} and ${val}`
            } else if (operator == "$not") {
              return this.parseMongoQueryToSQLWithTable(table, mongoQuery["$not"], !isNot)
            } else if (operator == "$eq") {
              const value = (typeof mongoQuery["$eq"] === "number") ? String(mongoQuery["$eq"]) : `'${mongoQuery["$eq"]}'`
              return `${table ? table + '.' : ''}"${key}" ${isNot ? "!=" : "="} ${value}`
            } else if (operator == "$ne") {
              const value = (typeof mongoQuery["$ne"] === "number") ? String(mongoQuery["$ne"]) : `'${mongoQuery["$ne"]}'`
              return `${table ? table + '.' : ''}"${key}" ${isNot ? "=" : "!="} ${value}`
            }
          } else {
            return this.parseMongoQueryToSQLWithTable(table, mongoQuery[operator], isNot, operator)
          }
        }
        return final;
      }
}