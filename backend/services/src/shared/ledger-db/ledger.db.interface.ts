import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dom } from "ion-js";

export class ArrayIn {
    constructor(public key: string, public value: any) {
    }
}

export class ArrayLike {
    constructor(public key: string, public value: any) {
    }

    public toString = () : string => {
        return `${this.value}`;
    }
}

@Injectable()
export abstract class LedgerDBInterface {

    public tableName: string;
    public overallTableName: string;
    public companyTableName: string;
    public ledgerName: string;

    abstract createTable(tableName?: string): Promise<void>;

    abstract createIndex(indexCol: string, tableName?: string): Promise<void>;

    abstract insertRecord(document: Record<string, any>, tableName?: string): Promise<void>;
    
    abstract fetchRecords(where: Record<string, any>): Promise<dom.Value[]>;

    abstract fetchHistory(where: Record<string, any>): Promise<dom.Value[]>;
    
    abstract updateRecords(update: Record<string, any>,  where: Record<string, any>): Promise<dom.Value[]>;

    abstract getAndUpdateTx<TM>(getQueries: Record<string, Record<string, any>>, processGetFn: (results: Record<string, dom.Value[]>) => [Record<string, any>, Record<string, any>, Record<string, any>]): Promise<Record<string, dom.Value[]>>;

}
