import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programme } from '../shared/entities/programme.entity';
import { dom } from "ion-js";
import { plainToClass } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { CreditOverall } from '../shared/entities/credit.overall.entity';
import { Company } from '../shared/entities/company.entity';
import { TxType } from '../shared/enum/txtype.enum';

const computeChecksums = true;
const REVISION_DETAILS = "REVISION_DETAILS";
const deagg = require('aws-kinesis-agg');

@Injectable()
export class LedgerReplicatorService {

    constructor(@InjectRepository(Programme) private programmeRepo: Repository<Programme>, @InjectRepository(Company) private companyRepo: Repository<Company>, private logger: Logger, private configService: ConfigService) {

    }

    async processRecords(records) {
        return await Promise.all(
            records.map(async (record) => {
                // Kinesis data is base64 encoded so decode here
                const payload = Buffer.from(record.data, "base64");

                // payload is the actual ion binary record published by QLDB to the stream
                const ionRecord = dom.load(payload);
                // Only process records where the record type is REVISION_DETAILS
                if (ionRecord.get('recordType').stringValue() !== REVISION_DETAILS) {
                    this.logger.log(`Skipping record of type ${ionRecord.get('recordType').stringValue()}`);
                } else {
                    this.logger.log('ION Record', JSON.stringify(ionRecord))

                    const tableName = ionRecord.get("payload").get("tableInfo").get("tableName");
                    if (tableName == this.configService.get('ledger.table')) {
                        const payload = ionRecord.get("payload").get("revision").get("data");
        
                        const programme: Programme = plainToClass(Programme, JSON.parse(JSON.stringify(payload)));

                        const columns = this.programmeRepo.manager.connection.getMetadata("Programme").columns;
                        const columnNames = columns.filter(function (item) {
                            return item.propertyName !== 'programmeId';
                        }).map( e => e.propertyName)
                        this.logger.debug(`${columnNames} ${JSON.stringify(programme)}`);
                        return await this.programmeRepo.createQueryBuilder()
                            .insert()
                            .values(programme)
                            .orUpdate(columnNames, ['programmeId'])
                            .execute();

                    } else if (tableName == this.configService.get('ledger.companyTable')){
                        const payload = ionRecord.get("payload").get("revision").get("data");

                        const overall: CreditOverall = plainToClass(CreditOverall, JSON.parse(JSON.stringify(payload)));
                        const company = await this.companyRepo.findOneBy({
                            companyId: parseInt(overall.txId),
                          });
                        const meta = JSON.parse(JSON.stringify(ionRecord.get("payload").get("revision").get("metadata")));
                        
                        if (company && meta["version"]) {
                            if (company.lastUpdateVersion >= parseInt(meta["version"])) {
                                return
                            }
                        }
                        const response = await this.companyRepo
                        .update(
                            {
                                companyId: parseInt(overall.txId),
                            },
                            {
                                creditBalance: overall.credit,
                                programmeCount: Number(company.programmeCount) + (overall.txType == TxType.ISSUE ? 1 : 0),
                                lastUpdateVersion: parseInt(meta["version"])
                            }
                        )
                        .catch((err: any) => {
                            this.logger.error(err);
                            return err;
                        });
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
        this.logger.log('Event received', JSON.stringify(event));
        return await Promise.all(
            event.Records.map(async (kinesisRecord) => {
                const records = await this.promiseDeaggregate(kinesisRecord.kinesis);
                return await this.processRecords(records);
            })
        );
    }
}
