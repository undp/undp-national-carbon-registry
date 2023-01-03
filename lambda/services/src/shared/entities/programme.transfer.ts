import { PRECISION } from 'carbon-credit-calculator/dist/esm/calculator';
import { SectoralScope } from 'serial-number-gen';
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';
import { AgricultureProperties } from '../dto/agriculture.properties';
import { ProgrammeProperties } from '../dto/programme.properties';
import { SolarProperties } from '../dto/solar.properties';
import { Sector } from '../enum/sector.enum';
import { TransferStatus } from '../enum/transform.status.enum';
import { ProgrammeStage } from '../programme-ledger/programme-status.enum';
import { EntitySubject } from './entity.subject';

export const bigint: ValueTransformer = {
    to: (entityValue: number) => entityValue,
    from: (databaseValue: string[]): number[] => databaseValue.map( v => parseInt(v, 10))
  }
  
@Entity()
export class ProgrammeTransfer implements EntitySubject {

    @PrimaryGeneratedColumn()
    requestId: number;

    @Column()
    programmeId: string;

    @Column()
    requesterId: number;

    @Column()
    requesterCompanyId: number;

    @Column("real")
    creditAmount: number;

    @Column()
    comment: string;

    @Column({type: "bigint"})
    txTime: number;

    @Column("bigint", { array: true, transformer: [bigint] })
    companyId: number[];

    @Column({
        type: "enum",
        enum: TransferStatus,
        array: false
    })
    status: TransferStatus;
}
