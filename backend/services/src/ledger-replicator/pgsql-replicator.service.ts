import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { Counter } from "../shared/entities/counter.entity";
import { CounterType } from "../shared/util/counter.type.enum";
import { Pool } from "pg";
import { Programme } from "../shared/entities/programme.entity";
import { plainToClass } from "class-transformer";
import { ProcessEventService } from "./process.event.service";
import { CreditOverall } from "../shared/entities/credit.overall.entity";


@Injectable()
export class PgSqlReplicatorService implements LedgerReplicatorInterface {
  constructor(
    private logger: Logger,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    private configService: ConfigService,
    private eventProcessor: ProcessEventService,
  ) {}

  async replicate(event): Promise<any> {
    this.logger.log("Start received", JSON.stringify(event));

    setInterval(async () => {
      const seqObj = await this.counterRepo.findOneBy({
        id: CounterType.REPLICATE_SEQ,
      });

      let lastSeq = 0;
      if (seqObj) {
        lastSeq = seqObj.counter;
      }

      const tableName = this.configService.get<string>("ledger.table");
      const companyTableName = this.configService.get<string>(
        "ledger.companyTable"
      );

      let dbc = this.configService.get<any>("database");

      const config = {
        host: dbc['host'],
        port: dbc['port'],
        user: dbc['username'],
        password: dbc['password'],
        database: dbc["database"] + "Events"
      }
      const dbCon = new Pool(config);
      // const client = await dbCon.connect();
      const sql = `select data, hash from ${tableName} where hash > $1 order by hash`
      const results = await dbCon.query(
        sql,
        [lastSeq]
      );

      this.logger.log(`Query for new data ${sql} ${lastSeq}`)
      this.logger.log(`Periodical replicate check - last seq:${lastSeq} new events: ${results?.rows?.length}`);

      if (results) {
        let newSeq = 0;
        for (const row of results.rows) {
          const data = row.data;
          console.log('Data', data)
          const programme: Programme = plainToClass(
            Programme,
            JSON.parse(JSON.stringify(data))
          );
          await this.eventProcessor.process(programme, undefined, 0, 0)
          newSeq = row.hash
        }
        if (newSeq != 0) {
          await this.counterRepo.save({ id: CounterType.REPLICATE_SEQ, counter:  newSeq})
        }
      }
      
      const seqObjComp = await this.counterRepo.findOneBy({
        id: CounterType.REPLICATE_SEQ_COMP,
      });

      let lastSeqComp = 0;
      if (seqObjComp) {
        lastSeqComp = seqObjComp.counter;
      }

      const resultsCompany = await dbCon.query(
        `select * from ${companyTableName} where hash > $1 order by hash`,
        [lastSeqComp]
      );

      if (resultsCompany) {
        let newSeq = 0;
        for (const row of resultsCompany.rows) {
          const data = row.data;
          const creditOverall: CreditOverall = plainToClass(
            CreditOverall,
            JSON.parse(JSON.stringify(data))
          );
          newSeq = row.hash
          await this.eventProcessor.process(undefined, creditOverall, row.hash, new Date(row.meta.txTime).getTime())
        }
        if (newSeq != 0) {
          await this.counterRepo.save({ id: CounterType.REPLICATE_SEQ_COMP, counter:  newSeq})
        }
      }
    }, 1000);
  }
}
