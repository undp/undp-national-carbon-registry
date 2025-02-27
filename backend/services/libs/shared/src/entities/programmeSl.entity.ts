import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TxType } from "../enum/txtype.enum";
import { EntitySubject } from "./entity.subject";
import { ProjectGeography } from "../enum/projectGeography.enum";
import { ProjectCategory } from "../enum/projectCategory.enum";
import { ProjectStatus } from "../enum/projectStatus.enum";
import { CreditType } from "../enum/creditType.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";

@Entity()
export class ProgrammeSl implements EntitySubject {
  @PrimaryColumn()
  programmeId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  serialNo?: string;

  @Column({
    type: "enum",
    enum: ProjectCategory,
    array: false,
  })
  projectCategory: ProjectCategory;

  @Column({ nullable: true })
  otherProjectCategory?: string;

  @Column()
  province: string;

  @Column()
  district: string;

  @Column()
  dsDivision: string;

  @Column()
  city: string;

  @Column()
  community: string;

  @Column({
    type: "jsonb",
    array: false,
  })
  geographicalLocationCoordinates: [];

  @Column({
    type: "enum",
    enum: ProjectGeography,
    array: false,
  })
  projectGeography: ProjectGeography;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true, array: true })
  landExtent?: number[];

  @Column({ nullable: true })
  proposedProjectCapacity?: string;

  @Column({ nullable: true })
  speciesPlanted?: string;

  @Column()
  projectDescription: string;

  @Column("text", { array: true, nullable: true })
  additionalDocuments?: string[];

  @Column({
    type: "enum",
    enum: ProjectStatus,
    array: false,
  })
  projectStatus: ProjectStatus; //this status is maintained for SLCF

  @Column({ nullable: true })
  projectStatusDescription?: string;

  @Column({
    type: "enum",
    enum: ProjectProposalStage,
    array: false,
  })
  projectProposalStage: ProjectProposalStage; //this is for the development purposes to update current proposal stage

  @Column({
    type: "enum",
    enum: CreditType,
    array: false,
  })
  purposeOfCreditDevelopment: CreditType;

  @Column({ nullable: true })
  creditStartSerialNumber?: string;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditEst: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditBalance: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditChange: number;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditIssued?: number;

  @Column("real", { nullable: true })
  creditRetired: number;

  @Column("real", { nullable: true })
  creditFrozen: number;

  @Column("real", { nullable: true })
  creditTransferred: number;

  @Column("real", { nullable: true })
  estimatedProjectCost?: number;

  @Column({ type: "bigint" })
  startDate: number;

  @Column({ type: "bigint" })
  companyId: number;

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
    nullable: true,
  })
  txType: TxType;

  @Column({ nullable: true })
  txRef: string;

  @Column({ type: "bigint" })
  txTime: number;

  @Column({ nullable: true })
  registrationCertificateUrl: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhoneNo: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;

  @Column({ type: "bigint", nullable: true })
  creditUpdatedTime?: number;

  @Column({ type: "bigint", nullable: true })
  authorisedCreditUpdatedTime?: number;

  @Column({ type: "bigint", nullable: true })
  issuedCreditUpdatedTime?: number;

  @Column({ type: "bigint", nullable: true })
  transferredCreditUpdatedTime?: number;

  @Column({ type: "bigint", nullable: true })
  retiredCreditUpdatedTime?: number;

  @Column({ type: "bigint", nullable: true })
  proposalStageUpdatedTime?: number;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
