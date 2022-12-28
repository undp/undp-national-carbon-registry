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
}