import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";
import { SectoralScope } from "@undp/serial-number-gen";
import { Entity, Column, PrimaryColumn } from "typeorm";
import { ProgrammeProperties } from "../dto/programme.properties";
import { Sector } from "../enum/sector.enum";
import { TxType } from "../enum/txtype.enum";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { EntitySubject } from "./entity.subject";
import { MitigationProperties } from "../dto/mitigation.properties";

@Entity()
export class Programme implements EntitySubject {
  @PrimaryColumn()
  programmeId: string;

  @Column({ nullable: true })
  serialNo: string;

  @Column()
  title: string;

  @Column({ unique: true, nullable: true })
  externalId: string;

  @Column({
    type: "enum",
    enum: SectoralScope,
    array: false,
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
    default: ProgrammeStage.AWAITING_AUTHORIZATION,
  })
  currentStage: ProgrammeStage;

  @Column({ type: "bigint" })
  startTime: number;

  @Column({ type: "bigint" })
  endTime: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditEst: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  emissionReductionExpected: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  emissionReductionAchieved: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditChange: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditIssued: number;

  // @Column({type: "decimal", precision: 10, scale: PRECISION, nullable: true})
  // creditPending: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditBalance: number;

  @Column("real", { array: true, nullable: true })
  creditRetired: number[];

  @Column("real", { array: true, nullable: true })
  creditFrozen: number[];

  @Column("real", { array: true, nullable: true })
  creditTransferred: number[];

  @Column({ nullable: true })
  constantVersion: string;

  @Column("varchar", { array: true })
  proponentTaxVatId: string[];

  @Column("bigint", { array: true })
  companyId: number[];

  @Column({ type: "boolean", nullable: false, default: true })
  article6trade: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  article68trade: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  article64trade: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  article62trade: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  mvcAdjust: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  mvcUnadjusted: boolean;

  @Column("bigint", { array: false, nullable: true })
  implementinguser: number;

  @Column("bigint", { array: true, nullable: true })
  supportingowners: number[];

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
    type: "jsonb",
    array: false,
  })
  programmeProperties: ProgrammeProperties;

  @Column("jsonb", { array: false, nullable: true })
  mitigationActions?: MitigationProperties[];

  @Column({ type: "bigint" })
  txTime: number;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint", nullable: true })
  authTime: number;

  @Column({ type: "bigint", nullable: true })
  creditUpdateTime: number;

  @Column({ type: "bigint", nullable: true })
  statusUpdateTime: number;

  @Column({ type: "bigint", nullable: true })
  certifiedTime: number;

  @Column({ nullable: true })
  txRef: string;

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
    nullable: true,
  })
  txType: TxType;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  geographicalLocationCordintes: any;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  projectLocation: [];

  @Column({ nullable: true })
  cadtId: string;

  // @Column("string", { array: true, nullable: true  })
  // cadtUnitId: string[];

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  blockBounds: any;

  @Column({ unique: true, nullable: true })
  environmentalAssessmentRegistrationNo: string;

  @Column({ type: "timestamptz", nullable: true })
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  updatedAt: Date;
}
