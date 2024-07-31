import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { dom } from "ion-js";
import { ArrayIn, ArrayLike, LedgerDBInterface } from "./ledger.db.interface";
import { Pool, QueryResult, Client } from "pg";
import { Programme } from "../entities/programme.entity";

class MetaEntity {
  version: number;
  txTime: Date;
}

export class PgProgrammeEventEntity {
  data: Programme;
  meta: MetaEntity;
  hash: number;
}

export class TxElement {
  sql: string;
  params?: any[];
}

@Injectable()
export class PgSqlLedgerService implements LedgerDBInterface {
  public tableName: string;
  public overallTableName: string;
  public companyTableName: string;
  public ledgerName: string;
  private dbCon: Pool;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService
  ) {
    this.ledgerName = configService.get<string>("ledger.name");
    this.tableName = configService.get<string>("ledger.table");
    this.overallTableName = configService.get<string>("ledger.overallTable");
    this.companyTableName = configService.get<string>("ledger.companyTable");

    let dbc = this.configService.get<any>("database");

    const config = {
      host: dbc["host"],
      port: dbc["port"],
      user: dbc["username"],
      password: dbc["password"],
      database: dbc["database"] + "Events",
    };
    this.dbCon = new Pool(config);
    logger.log("PgSQL Ledger init ", this.ledgerName);
  }

  // TODO: Handler session expire
  private async execute<TM>(queries: TxElement[]): Promise<QueryResult> {
    console.log(`Statement: ${JSON.stringify(queries)}`);
    const client = await this.dbCon.connect();
    try {
      const responses = [];
      await client.query("BEGIN");
      for (const c of queries) {
        const resp = await client.query(c.sql, c.params);
        responses.push(resp);
        console.log("Execute resp", resp);
      }
      await client.query("COMMIT");
      return responses;
    } catch (e) {
      console.log("Error", e);
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  private async executeTxn<TM>(
    client: Client,
    queries: { [key: string]: TxElement }
  ): Promise<{ [key: string]: QueryResult }> {
    console.log(`Statement: ${JSON.stringify(queries)}`);
    try {
      const responses = {};
      await client.query("BEGIN");
      for (const k in queries) {
        const c = queries[k];
        const resp = await client.query(c.sql, c.params);
        responses[k] = resp;
        console.log("Execute resp", resp);
      }
      await client.query("COMMIT");
      return responses;
    } catch (e) {
      console.log("Error", e);
      await client.query("ROLLBACK");
      throw e;
    }
  }

  public async createTable(tableName?: string): Promise<void> {
    const sql = `CREATE SEQUENCE ${
      tableName ? tableName : this.tableName
    }_hash_seq; 
        CREATE TABLE IF NOT EXISTS ${tableName ? tableName : this.tableName}
        (
            data jsonb NOT NULL,
            meta jsonb NOT NULL,
            hash integer NOT NULL DEFAULT nextval('${
              tableName ? tableName : this.tableName
            }_hash_seq'::regclass),
            PRIMARY KEY (hash)
        );`;
    await await this.execute([{ sql }]);
  }

  public async createIndex(
    indexCol: string,
    tableName?: string
  ): Promise<void> {
    return null;
    // await (await this.execute(`create index on ${tableName ? tableName : this.tableName} (${indexCol})`));
  }

  public async insertRecord(
    document: Record<string, any>,
    tableName?: string
  ): Promise<void> {
    await this.execute([
      {
        sql: `INSERT INTO "${
          tableName ? tableName : this.tableName
        }" ("data", "meta") VALUES ($1, $2)`,
        params: [
          document,
          {
            version: 0,
            txTime: new Date(),
          },
        ],
      },
    ]);
  }

  private getUniqueIndex(tableName: string) {
    if (tableName === this.tableName) {
      return "data->>'programmeId'"
    }
    else {
      return "data->>'txId'"
    }
  }

  public async fetchRecords(
    where: Record<string, any>,
    tableName?: string
  ): Promise<dom.Value[]> {
    const whereClause = Object.keys(where)
      .map((k, i) => `data->>'${k}' = $${i + 1}`)
      .join(" and ");
    // const fieldList = Object.keys(where)
    //   .map((k) => `data->>'${k}'`)
    //   .join(", ");
    const t = tableName ? tableName : this.tableName
    return (
      await this.execute([
        {
          sql: `SELECT * from (SELECT DISTINCT ON (${this.getUniqueIndex(t)}) data FROM ${
            t
          }  order by ${this.getUniqueIndex(t)}, hash desc) x where ${whereClause}`,
          params: Object.values(where),
        },
      ])
    )[0]?.rows.map((e) => e.data);
  }

  public async fetchHistory(
    where: Record<string, any>,
    tableName?: string
  ): Promise<dom.Value[]> {
    const whereClause = Object.keys(where)
      .map((k, i) => `data->>'${k}' = $${i + 1}`)
      .join(" and ");
    const x = (
      await this.execute([
        {
          sql: `SELECT * FROM ${
            tableName ? tableName : this.tableName
          } as h WHERE ${whereClause} order by hash`,
          params: Object.values(where),
        },
      ])
    )[0]?.rows;
    // console.log("Results", x);
    return x;
  }

  public async updateRecords(
    update: Record<string, any>,
    where: Record<string, any>,
    tableName?: string
  ): Promise<dom.Value[]> {
    // const whereClause = Object.keys(where)
    //   .map((k) => `${k} = ?`)
    //   .join(" and ");
    // const updateClause = Object.keys(update)
    //   .map((k) => `${k} = ?`)
    //   .join(",");
    const table = tableName ? tableName : this.tableName;
    const getQueries = {};
    getQueries[table] = where;
    const r = await this.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const resTable = results[table];
        console.log("Res table", resTable, update);
        const insertMap = {};
        for (const obj of resTable) {
          for (const k in update) {
            obj[k] = update[k];
          }
          insertMap[table] = obj;
        }
        console.log("Updating records", insertMap);
        return [{}, {}, insertMap];
      }
    );

    console.log(r);

    return r[table];
  }

  private getValuesList(filterObj: any): any {
    const list = [];
    for (const k in filterObj) {
      const v = filterObj[k];
      if (v instanceof ArrayIn) {
        // list.push(v.value);
      } else if (v instanceof ArrayLike) {
        list.push(v.value);
      } else if (v instanceof Array) {
        list.push(...v)
      } else {
        list.push(v);
      }
    }
    return list;
  }

  public async getAndUpdateTx<TM>(
    getQueries: Record<string, Record<string, any>>,
    processGetFn: (
      results: Record<string, dom.Value[]>
    ) => [Record<string, any>, Record<string, any>, Record<string, any>]
  ): Promise<Record<string, dom.Value[]>> {
    this.logger.log(`getQueries: ${JSON.stringify(getQueries)}`);

    let updateResults = {};
    const client = await this.dbCon.connect();
    try {
      const getTxElements = {};
      for (const t in getQueries) {
        console.log("getQueries t", t);
        if (getQueries.hasOwnProperty(t)) {
          const isHistoryQuery = t.includes("history(");
          let table = t;
          if (isHistoryQuery) {
            table = t.replace("history(", "").replace(")", "");
          }
          let j = 0;
          const wc = Object.keys(getQueries[t])
            .map((k, i) => {
              if (isHistoryQuery) {
                k = k.replace("data.", "");
              }
              if (getQueries[t][k] instanceof Array) {
                return `data->>'${k}' in (${getQueries[t][k].map((e) => {
                  j += 1;
                  return "$" + j;
                }).join(', ')})`;
              } else if (getQueries[t][k] instanceof ArrayIn) {
                // j += 1;
                return `data @> '{"${k}": [${getQueries[t][k].value}]}'`;
              } else if (getQueries[t][k] instanceof ArrayLike) {
                j += 1;
                return `data->>'${k}' LIKE $${j}`;
              }
              j += 1;
              return `data->>'${k}' = $${j}`;
            })
            .join(" and ");
          // const fieldList = Object.keys(getQueries[t])
          //   .map((k) => {
          //     if (isHistoryQuery) {
          //       k = k.replace("data.", "");
          //     }
          //     return `data->>'${k}'`;
          //   })
          //   .join(", ");

          let sql = ''
          if (isHistoryQuery) {
            sql = `SELECT data FROM ${table} WHERE ${wc} order by ${this.getUniqueIndex(table)}, hash desc`
          } else {
            sql = `select * from (SELECT ${`DISTINCT ON (${this.getUniqueIndex(table)})`
            } data FROM ${table} order by ${this.getUniqueIndex(table)}, hash desc) x where ${wc}`
          }
          getTxElements[t] = {
            sql: sql,
            params: this.getValuesList(getQueries[t]),
          };
        }
      }
      console.log("Get elements", getTxElements);
      const list = await this.executeTxn(client, getTxElements);

      const mapped = {};
      for (const el in list) {
        mapped[el] = list[el]?.rows.map((e) => e.data);
      }
      let [update, updateWhere, insert] = processGetFn(mapped);

      console.log("processGetFn", update, updateWhere, insert);
      const updateGetElements = {};

      if (update && Object.keys(update).length > 0) {
        for (const t in updateWhere) {
          const tableName = t.split("#")[0];
          if (updateWhere.hasOwnProperty(t)) {
            let j = 0;
            const wc = Object.keys(updateWhere[t])
              .map((k, i) => {
                if (updateWhere[t][k] instanceof Array) {
                  return `data->>'${k}' in (${updateWhere[t][k].map((e) => {
                    j += 1;
                    return "$" + j;
                  }).join(', ')})`;
                } else if (updateWhere[t][k] instanceof ArrayIn) {
                  // j += 1;
                  return `data @> '{"${k}": [${updateWhere[t][k].value}]}'`;
                } else if (updateWhere[t][k] instanceof ArrayLike) {
                  j += 1;
                  return `data->>'${k}' LIKE $${j}`;
                }
                j += 1;
                return `data->>'${k}' = $${j}`;
              })
              .join(" and ");
            // const fieldList = Object.keys(updateWhere[t])
            //   .map((k) => `data->>'${k}'`)
            //   .join(", ");
            updateGetElements[t] = {
              sql: `select * from (SELECT DISTINCT ON (${this.getUniqueIndex(tableName)}) data FROM ${tableName} order by ${this.getUniqueIndex(tableName)}, hash desc) x where ${wc}`,
              params: this.getValuesList(updateWhere[t]),
            };
          }
        }

        console.log("TEST", updateGetElements);
        const obj = await this.executeTxn(client, updateGetElements);
        const updatingObj = {};
        for (const el in obj) {
          updatingObj[el] = obj[el]?.rows.map((e) => e.data);
          console.log('updateGetElements TEST', el, JSON.stringify(obj[el]))
        }

        if (!insert) {
          insert = {};
        }

        console.log("Update property", updatingObj, update);
        for (const t in updatingObj) {
          if (updatingObj.hasOwnProperty(t)) {
            if (updatingObj[t]) {
              console.log("Length", updatingObj[t].length);
              for (const o of updatingObj[t]) {
                if (update[t]) {
                  for (const f in update[t]) {
                    o[f] = update[t][f];
                  }
                  insert[t] = o;
                }
              }
            }
          }
        }
        console.log("Updated prop", insert);
      }

      const updateTxElements = {};
      this.logger.log(`Insert queries`, JSON.stringify(insert));
      for (const qk in insert) {
        const tableName = qk.split("#")[0];
        if (insert.hasOwnProperty(qk)) {
          updateTxElements[qk] = {
            sql: `INSERT INTO "${
              tableName ? tableName : this.tableName
            }" ("data", "meta") VALUES ($1, $2)`,
            params: [
              insert[qk],
              {
                version: 0,
                txTime: new Date(),
              },
            ],
          };
        }
      }
      updateResults = await this.executeTxn(client, updateTxElements);
    } finally {
      client.release();
    }
    this.logger.debug("Response", JSON.stringify(updateResults));

    const processedResponse = {};
    for (const k in updateResults) {
      processedResponse[k] = Array(updateResults[k]?.rowCount).fill(0);
    }
    return processedResponse;
  }
}
