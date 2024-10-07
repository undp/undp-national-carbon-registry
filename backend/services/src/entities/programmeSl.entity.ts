import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";
import { SectoralScope } from "@undp/serial-number-gen";
import { Entity, Column, PrimaryColumn, BeforeInsert, BeforeUpdate } from "typeorm";
import { ProgrammeProperties } from "../dto/programme.properties";
import { Sector } from "../enum/sector.enum";
import { TxType } from "../enum/txtype.enum";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { EntitySubject } from "./entity.subject";
import { MitigationProperties } from "../dto/mitigation.properties";
import { ProjectGeography } from "../enum/projectGeography.enum";
import { ProjectCategory } from "../enum/projectCategory.enum";
import { ProjectStatus } from "../enum/projectStatus.enum";
import { PurposeOfCreditDevelopment } from "../enum/purposeOfCreditDevelopment.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";

@Entity()
export class ProgrammeSl implements EntitySubject {
  @PrimaryColumn()
  programmeId: string;

  @Column()
  title: string;

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

  @Column("bigint", { array: true, nullable: true })
  landExtent?: number[];

  @Column({ nullable: true })
  proposedProjectCapacity?: number;

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
  projectStatus: ProjectStatus;

  @Column({
    type: "enum",
    enum: ProjectProposalStage,
    array: false,
  })
  projectProposalStage: ProjectProposalStage;

  @Column({
    type: "enum",
    enum: PurposeOfCreditDevelopment,
    array: false,
  })
  purposeOfCreditDevelopment: PurposeOfCreditDevelopment;

  @Column({ type: "bigint" })
  startDate: number;

  @Column("bigint", { array: true })
  companyId: number[];

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
    nullable: true,
  })
  txType: TxType;

  @Column({ type: "bigint" })
  txTime: number;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;

  // @BeforeInsert()
  // async createTime() {
  //   this.createdTime = new Date().getTime();
  // }

  // @BeforeUpdate()
  // async updateTime() {
  //   this.updatedTime = new Date().getTime();
  // }
}
