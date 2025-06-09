import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { dom } from "ion-js";
import { plainToClass } from "class-transformer";
import { ConfigService } from "@nestjs/config";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { ProcessEventService } from "./process.event.service";
import { Programme } from "../entities/programme.entity";
import { CreditOverall } from "../entities/credit.overall.entity";

const computeChecksums = true;
const REVISION_DETAILS = "REVISION_DETAILS";
const deagg = require("aws-kinesis-agg");

@Injectable()
export class QLDBKinesisReplicatorService implements LedgerReplicatorInterface{
  constructor(
    private logger: Logger,
    private eventProcessor: ProcessEventService,
    private configService: ConfigService
  ) {}

  async processRecords(records) {
    return await Promise.all(
      records.map(async (record) => {
        // Kinesis data is base64 encoded so decode here
        const payload = Buffer.from(record.data, "base64");

        // payload is the actual ion binary record published by QLDB to the stream
        const ionRecord = dom.load(payload);
        // Only process records where the record type is REVISION_DETAILS
        if (ionRecord.get("recordType").stringValue() !== REVISION_DETAILS) {
          this.logger.log(
            `Skipping record of type ${ionRecord
              .get("recordType")
              .stringValue()}`
          );
        } else {
          this.logger.log("ION Record", JSON.stringify(ionRecord));
          const tableName = ionRecord
            .get("payload")
            .get("tableInfo")
            .get("tableName");
          if (tableName == this.configService.get("ledger.table")) {
            const payload = ionRecord
              .get("payload")
              .get("revision")
              .get("data");

            const programme: Programme = plainToClass(
              Programme,
              JSON.parse(JSON.stringify(payload))
            );
            await this.eventProcessor.process(programme, undefined, 0, 0)
          } else if (
            tableName == this.configService.get("ledger.companyTable")
          ) {

            const meta = JSON.parse(
              JSON.stringify(
                ionRecord.get("payload").get("revision").get("metadata")
              )
            );

            const payload = ionRecord
              .get("payload")
              .get("revision")
              .get("data");

            const overall: CreditOverall = plainToClass(
              CreditOverall,
              JSON.parse(JSON.stringify(payload))
            );

            await this.eventProcessor.process(undefined, overall, parseInt(meta["version"]), new Date(meta.txTime).getTime())
          }
        }
      })
    );
  }

  async promiseDeaggregate(record) {
    return new Promise((resolve, reject) => {
      deagg.deaggregateSync(record, computeChecksums, (err, responseObject) => {
        if (err) {
          //handle/report error
          return reject(err);
        }
        return resolve(responseObject);
      });
    });
  }

  async replicate(event): Promise<any> {
    this.logger.log("Event received", JSON.stringify(event));
    return await Promise.all(
      event.Records.map(async (kinesisRecord) => {
        const records = await this.promiseDeaggregate(kinesisRecord.kinesis);
        return await this.processRecords(records);
      })
    );
  }
}
