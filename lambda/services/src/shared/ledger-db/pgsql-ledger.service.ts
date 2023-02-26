import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dom } from "ion-js";
import { ArrayIn, ArrayLike, LedgerDBInterface } from './ledger.db.interface';
import { Pool } from "pg";
// import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Programme } from '../entities/programme.entity';

// @Entity()
class MetaEntity {
    // @PrimaryGeneratedColumn()
    version: number;

    // @CreateDateColumn()
    txTime: Date;    
}

// @Entity()
export class PgProgrammeEventEntity {
    // @Column({
    //     type: "jsonb",
    //     array: false,
    //   })
    data: Programme;

    // @Column({
    //     type: "jsonb",
    //     array: false,
    //   })
    meta: MetaEntity;

    // @PrimaryGeneratedColumn()
    hash: number;
}

@Injectable()
export class PgSqlLedgerService implements LedgerDBInterface {

    public tableName: string;
    public overallTableName: string;
    public companyTableName: string;
    public ledgerName: string;
    private dbCon: Pool;

    constructor(private readonly logger: Logger, private readonly configService: ConfigService) {
        this.ledgerName = configService.get<string>('ledger.name');
        this.tableName = configService.get<string>('ledger.table');
        this.overallTableName = configService.get<string>('ledger.overallTable');
        this.companyTableName = configService.get<string>('ledger.companyTable');
        logger.log("PgSQL Ledger init ", this.ledgerName);
    }
    getAndUpdateTx<TM>(getQueries: Record<string, Record<string, any>>, processGetFn: (results: Record<string, dom.Value[]>) => [Record<string, any>, Record<string, any>, Record<string, any>]): Promise<Record<string, dom.Value[]>> {
        throw new Error('Method not implemented.');
    }

    // TODO: Handler session expire
    private async execute<TM>(sql, ...parameters: any[]): Promise<any> {
        this.logger.debug(`Statement: ${sql}, parameter: ${JSON.stringify(parameters)}`);

        let dbConfig = this.configService.get<any>('database');
        dbConfig['database'] = dbConfig['database'] + 'Events';
        this.dbCon = new Pool()
        const resp = await this.dbCon.query(
            sql,
            ...parameters
        );
        this.logger.debug('Response', JSON.stringify(resp));
        this.dbCon.close();
        return resp;
    }

    public async createTable(tableName?: string): Promise<void> {
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName ? tableName : this.tableName}
        (
            data jsonb NOT NULL,
            meta jsonb NOT NULL,
            hash integer NOT NULL DEFAULT nextval('${tableName ? tableName : this.tableName}_hash_seq'::regclass),
            PRIMARY KEY (hash)
        )`
        await (await this.execute(sql));
    }

    public async createIndex(indexCol: string, tableName?: string): Promise<void> {
        return null;
        // await (await this.execute(`create index on ${tableName ? tableName : this.tableName} (${indexCol})`));
    }

    public async insertRecord(document: Record<string, any>, tableName?: string): Promise<void> {
        await (await this.execute(`INSERT INTO ${tableName ? tableName : this.tableName} ?`, document));
    }

    public async fetchRecords(where: Record<string, any>): Promise<dom.Value[]> {
        const whereClause = Object.keys(where).map(k => (`${k} = ?`)).join(' and ');
        return (await this.execute(`SELECT * FROM ${this.tableName} WHERE ${whereClause}`, ...Object.values(where)))?.getResultList();
    }

    public async fetchHistory(where: Record<string, any>): Promise<dom.Value[]> {
        const whereClause = Object.keys(where).map(k => (`h.data.${k} = ?`)).join(' and ');
        const x = (await this.execute(`SELECT * FROM history(${this.tableName}) as h WHERE ${whereClause}`, ...Object.values(where)))?.getResultList();
        console.log('Results', x);
        return x;
    }

    public async updateRecords(update: Record<string, any>, where: Record<string, any>): Promise<dom.Value[]> {
        const whereClause = Object.keys(where).map(k => (`${k} = ?`)).join(' and ');
        const updateClause = Object.keys(update).map(k => (`${k} = ?`)).join(',');
        return (await this.execute(`UPDATE ${this.tableName} SET ${updateClause} WHERE ${whereClause}`, ...Object.values(update), ...Object.values(where)))?.getResultList();
    };

    private getValuesList(filterObj: any): any {
        const list = [];
        for (const k in filterObj) {
            const v = filterObj[k];
            if (v instanceof ArrayIn) {
                list.push(v.value);
            } else if (v instanceof ArrayLike) {
                list.push(v.value);
            } else {
                list.push(v);
            }
        }
        return list;
    }

    // public async getAndUpdateTx<TM>(getQueries: Record<string, Record<string, any>>, processGetFn: (results: Record<string, dom.Value[]>) => [Record<string, any>, Record<string, any>, Record<string, any>]): Promise<Record<string, dom.Value[]>> {
    //     this.logger.debug(``);
    //     this.driver = new QldbDriver(this.ledgerName);
    //     const resp = await this.driver.executeLambda(async (txn: TransactionExecutor) => {
    //         const getResults = {};
    //         for (const t in getQueries) {
    //             if (getQueries.hasOwnProperty(t)) {
    //                 const wc = Object.keys(getQueries[t]).map(k => {
    //                     if (getQueries[t][k] instanceof Array) {
    //                         return (`${k} in ?`);
    //                     } else if (getQueries[t][k] instanceof ArrayIn) {
    //                         return (`? IN "${getQueries[t][k].key}"`);
    //                     } else if (getQueries[t][k] instanceof ArrayLike) {
    //                         return (`${k} LIKE ?`);
    //                     }
    //                     return (`${k} = ?`);
    //                 }).join(' and ');
    //                 const r = (await this.execute(`SELECT * FROM ${t} WHERE ${wc}`, ...this.getValuesList(getQueries[t])))?.getResultList();
    //                 getResults[t] = r;
    //             }
    //         }
    //         const [update, updateWhere, insert] = processGetFn(getResults);
    //         const updateResults = {};
    //         for (const qk in update) {
    //             const tableName = qk.split('#')[0];
    //             if (update.hasOwnProperty(qk) && updateWhere.hasOwnProperty(qk)) {
    //                 const whereClause = Object.keys(updateWhere[qk]).map(k => (`${k} = ?`)).join(' and ');
    //                 const updateClause = Object.keys(update[qk]).map(k => (`${k} = ?`)).join(',');
    //                 updateResults[qk] = (await this.execute(`UPDATE ${tableName} SET ${updateClause} WHERE ${whereClause}`, ...Object.values(update[qk]), ...Object.values(updateWhere[qk])))?.getResultList();
    //             }
    //         }

    //         this.logger.verbose(`Insert queries`, JSON.stringify(insert));
    //         for (const qk in insert) {
    //             const tableName = qk.split('#')[0];
    //             if (insert.hasOwnProperty(qk)) {
    //                 updateResults[qk] = (await this.execute(`INSERT INTO ${tableName ? tableName : this.tableName} ?`, insert[qk]))?.getResultList();
    //             }
    //         }

    //         return updateResults;
    //     });
    //     this.logger.debug('Response', JSON.stringify(resp));
    //     this.driver.close();
    //     return resp;
    // }

}
