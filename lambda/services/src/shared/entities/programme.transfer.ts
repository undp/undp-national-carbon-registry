import { PRECISION } from 'carbon-credit-calculator/dist/esm/calculator';
import { SectoralScope } from 'serial-number-gen';
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';
import { AgricultureProperties } from '../dto/agriculture.properties';
import { ProgrammeProperties } from '../dto/programme.properties';
import { SolarProperties } from '../dto/solar.properties';
import { Sector } from '../enum/sector.enum';
import { TransferStatus } from '../enum/transform.status.enum';
import { ProgrammeStage } from '../enum/programme-status.enum';
import { EntitySubject } from './entity.subject';
import { BasicCompany } from '../dto/BasicCompany.dto';

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
    initiator: number;

    @Column()
    initiatorCompanyId: number;

    @Column()
    toCompanyId: number;

    @Column({nullable: true})
    toAccount: string;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true
    })
    toCompanyMeta: BasicCompany;

    @Column()
    fromCompanyId: number;

    @Column("real")
    creditAmount: number;

    @Column({nullable: true})
    comment: string;

    @Column({type: "bigint"})
    txTime: number;
    
    @Column({
        type: "enum",
        enum: TransferStatus,
        array: false
    })
    status: TransferStatus;

    @Column({nullable: true, default: false})
    isRetirement: boolean;
}
