import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Programme } from "../shared/entities/programme.entity";
import { dom } from "ion-js";
import { plainToClass } from "class-transformer";
import { ConfigService } from "@nestjs/config";
import { CreditOverall } from "../shared/entities/credit.overall.entity";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { ProcessEventService } from "./process.event.service";

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

  async forwardGeocoding(address: any[]) {
    console.log("addresses passed to forwardGeocoding function -> ", address);
    let geoCodinates: any[] = [];
    const ACCESS_TOKEN =
      "";

    for (let index = 0; index < address.length; index++) {
      const url =
        "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        encodeURIComponent(address[index]) +
        ".json?access_token=" +
        ACCESS_TOKEN +
        "&limit=1" +
        `&country=${this.configService.get(
          "systemCountry"
        )}&autocomplete=false&types=region%2Cdistrict`;
      console.log("geocoding request urls -> ", index, url);
      await axios
        .get(url)
        .then(function (response) {
          // handle success
          console.log(
            "cordinates data in replicator -> ",
            response?.data?.features[0],
            response?.data?.features[0]?.center
          );
          if (response?.data?.features.length > 0) {
            geoCodinates.push([...response?.data?.features[0]?.center]);
          } else {
            geoCodinates.push(null);
          }
        })
        .catch((err) => {
          this.logger.error("Geocoding failed - ", err);
          return err;
        });
    }

    return geoCodinates;
  }

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
