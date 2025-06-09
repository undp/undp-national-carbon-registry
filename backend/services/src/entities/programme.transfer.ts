import { Entity, Column, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';
import { TransferStatus } from '../enum/transform.status.enum';
import { EntitySubject } from './entity.subject';
import { BasicOrgInfo } from '../dto/basic.organisation.dto';
import { RetireType } from '../enum/retire.type.enum';

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
    toCompanyMeta: BasicOrgInfo;

    @Column({
        type: "enum",
        enum: RetireType,
        array: false,
        nullable: true
    })
    retirementType: RetireType;

    @Column()
    fromCompanyId: number;

    @Column("real")
    creditAmount: number;

    @Column({nullable: true})
    comment: string;

    @Column({nullable: true})
    txRef: string;

    @Column({type: "bigint"})
    txTime: number;

    @Column({type: "bigint", nullable: true})
    createdTime: number;

    @Column({type: "bigint", nullable: true})
    authTime: number;

    @Column({
        type: "enum",
        enum: TransferStatus,
        array: false
    })
    status: TransferStatus;

    @Column({nullable: true, default: false})
    isRetirement: boolean;

    @Column({type: "bigint", nullable: true, default:0})
    omgePercentage: number;
}
