import { PRECISION } from 'carbon-credit-calculator/dist/esm/calculator';
import { SectoralScope } from 'serial-number-gen';
import { Entity, Column, PrimaryColumn } from 'typeorm';
import { AgricultureProperties } from '../dto/agriculture.properties';
import { ProgrammeProperties } from '../dto/programme.properties';
import { SolarProperties } from '../dto/solar.properties';
import { Sector } from '../enum/sector.enum';
import { TxType } from '../enum/txtype.enum';
import { TypeOfMitigation } from '../enum/typeofmitigation.enum';
import { ProgrammeStage } from '../enum/programme-status.enum';
import { EntitySubject } from './entity.subject';

@Entity()
export class Programme implements EntitySubject {

    @PrimaryColumn()
    programmeId: string;

    @Column({nullable: true})
    serialNo: string;

    @Column()
    title: string;

    @Column({unique: true, nullable: true})
    externalId: string;

    @Column({
        type: "enum",
        enum: SectoralScope,
        array: false
    })
    sectoralScope: SectoralScope;

    @Column()
    sector: Sector;

    @Column()
    countryCodeA2: string;

    @Column({
        type: "enum",
        enum: ProgrammeStage,
        array: false,
        default: ProgrammeStage.AWAITING_AUTHORIZATION
    })
    currentStage: ProgrammeStage;

    @Column({
        type: "enum",
        enum: TypeOfMitigation,
        array: false
    })
    typeOfMitigation: TypeOfMitigation;

    @Column({type: 'bigint'})
    startTime: number;

    @Column({type: 'bigint'})
    endTime: number;

    @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    creditEst: number;

    @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    creditChange: number;

    @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    creditIssued: number;

    // @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    // creditPending: number;

    @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    creditBalance: number;

    @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    creditRetired: number;

    @Column("real", { array: true, nullable: true })
    creditFrozen: number[];

    @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
    creditTransferred: number;

    @Column({nullable: true})
    constantVersion: string;

    @Column("varchar", { array: true })
    proponentTaxVatId: string[];

    @Column("bigint", { array: true })
    companyId: number[];

    @Column("real", { array: true, nullable: true })
    proponentPercentage: number[];

    @Column("real", { array: true, nullable: true })
    creditOwnerPercentage: number[];

    @Column("bigint", { array: true, nullable: true })
    certifierId: number[];

    @Column("bigint", { array: true, nullable: true })
    revokedCertifierId: number[];

    @Column()
    creditUnit: string;

    @Column({
        type: 'jsonb',
        array: false
    })
    programmeProperties: ProgrammeProperties;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true
    })
    agricultureProperties: AgricultureProperties;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true
    })
    solarProperties: SolarProperties;

    @Column({type: "bigint"})
    txTime: number;

    @Column({type: "bigint"})
    createdTime: number;

    @Column({nullable: true})
    txRef: string;
    
    @Column({
        type: "enum",
        enum: TxType,
        array: false,
        nullable: true
    })
    txType: TxType;
    
}
