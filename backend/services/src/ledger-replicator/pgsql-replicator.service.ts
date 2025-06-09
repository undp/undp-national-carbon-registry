import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { Pool } from "pg";
import { plainToClass } from "class-transformer";
import { ProcessEventService } from "./process.event.service";
import { Counter } from "../entities/counter.entity";
import { CounterType } from "../util/counter.type.enum";
import { Programme } from "../entities/programme.entity";
import { CreditOverall } from "../entities/credit.overall.entity";
import { DataImporterService } from "../data-importer/data-importer.service";

@Injectable()
export class PgSqlReplicatorService implements LedgerReplicatorInterface {
  constructor(
    private logger: Logger,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    private configService: ConfigService,
    private eventProcessor: ProcessEventService,
    private dataImportService : DataImporterService
  ) {}
  
  async replicate(event): Promise<any> {
    this.logger.log('Start received', JSON.stringify(event));

    let dbc = this.configService.get<any>('database');
    const config = {
      host: dbc['host'],
      port: dbc['port'],
      user: dbc['username'],
      password: dbc['password'],
      database: dbc['database'] + 'Events',
    };
    const dbCon = new Pool(config);

    let retryCountTable = 0;
    let retryCountCTable = 0;
    const retryLimit = 10;

    const replicateActions = async () => {

      const tableName = this.configService.get<string>('ledger.table');
      const companyTableName = this.configService.get<string>('ledger.companyTable');

      try {
        const seqObj = await this.counterRepo.findOneBy({
          id: CounterType.REPLICATE_SEQ
        });
  
        let lastSeq = 0;
        if (seqObj) {
          lastSeq = seqObj.counter;
        }

        const sql = `select data, hash from ${tableName} where hash > $1 order by hash`;
        const results = await dbCon.query(sql,[lastSeq]);
        this.logger.log(`Query for new data ${sql} ${lastSeq}`);
        this.logger.log(`Periodical replicate check - last seq:${lastSeq} new events: ${results?.rows?.length}`);

        if (results) {
          let newSeq = 0;
          for (const row of results.rows) {
            const data = row.data;
            const programme: Programme = plainToClass(
              Programme,
              JSON.parse(JSON.stringify(data))
            );
            await this.eventProcessor.process(programme, undefined, 0, 0);
            newSeq = row.hash;
            await this.counterRepo.save({id: CounterType.REPLICATE_SEQ, counter: newSeq});
          }
        }
        retryCountTable = 0;
      } catch (exception) {
        this.logger.log(`Failed Executing Ops for : ${tableName}`, exception);
        if (retryCountTable > retryLimit) {
          this.logger.log('Ledger Replicator terminated');
          return;
        } else {
          retryCountTable += 1; //ref
          replicateActions;
        }
      }

      try{
        const seqObjComp = await this.counterRepo.findOneBy({
          id: CounterType.REPLICATE_SEQ_COMP,
        });
  
        let lastSeqComp = 0;
        if (seqObjComp) {
          lastSeqComp = seqObjComp.counter;
        }
  
        const companySql = `select * from ${companyTableName} where hash > $1 order by hash`;
        const resultsCompany = await dbCon.query(companySql, [lastSeqComp]);
  
        if (resultsCompany) {
          let newSeq = 0;
          for (const row of resultsCompany.rows) {
            const data = row.data;
            const creditOverall: CreditOverall = plainToClass(
              CreditOverall,
              JSON.parse(JSON.stringify(data))
            );
            newSeq = row.hash;
            await this.eventProcessor.process(undefined, creditOverall, row.hash, new Date(row.meta.txTime).getTime());
            await this.counterRepo.save({id: CounterType.REPLICATE_SEQ_COMP, counter: newSeq});
          }
        }
        retryCountCTable = 0;
      }catch (exception){
        this.logger.log(`Failed Executing Ops for : ${tableName}`, exception);
        if (retryCountCTable > retryLimit) {
          this.logger.log('Ledger Replicator terminated');
          return;
        } else {
          retryCountCTable += 1; //ref
          replicateActions;
        }
      }

      if(this.configService.get('ITMOSystem.enable')){
        const date = new Date(); 
        const year = String(date.getFullYear());
        const diff = Number(date) - Number(new Date(date.getFullYear(), 0, 0));
        const dayOfYear = String(Math.floor(diff / (1000 * 60 * 60 * 24)));
        const today = Number(year+dayOfYear)
        const lastItmoseq = await this.counterRepo.findOneBy({
          id: CounterType.ITMO_SYSTEM,
        });
        let lastDate = 0
        if (lastItmoseq) {
          lastDate = lastItmoseq.counter;
        }
        if(today>lastDate){
          await this.dataImportService.importData({importTypes:"ITMO_SYSTEM"})
          await this.counterRepo.save({ id: CounterType.ITMO_SYSTEM, counter:  today})
        }
      }
      setTimeout( replicateActions , 1000)
    }
    await replicateActions()
  }
}
