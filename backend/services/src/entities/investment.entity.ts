import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { Instrument } from "../enum/instrument.enum";
import { InvestmentType } from "../enum/investment.type";
import { InvestmentLevel } from "../enum/investment.level";
import { InvestmentStream } from "../enum/investment.stream";
import { ESGType } from "../enum/esg.type";
import { InvestmentStatus } from "../enum/investment.status";
import { InvestmentCategoryEnum } from "../enum/investment.category.enum";
import { GuaranteePayback, InsurancePayback } from "../enum/investment.payback.enum";

@Entity()
export class Investment implements EntitySubject {

  @PrimaryGeneratedColumn()
  requestId: number;

  @Column({nullable: true})
  programmeId: string;

  @Column({type: 'double precision'})
  amount: number;

  @Column({
    type: "enum",
    enum: Instrument,
    array: true,
    nullable: true
  })
  instrument: Instrument[];

  @Column({nullable: true, type: 'double precision'})
  interestRate?: number;

  @Column({nullable: true})
  resultMetric?: string;

  @Column({nullable: true, type: 'double precision' })
  paymentPerMetric?: number;

  @Column({nullable: true})
  comments?: string;

  @Column({
    type: "enum",
    enum: InvestmentType,
    array: false,
    nullable: true
  })
  type: InvestmentType;

  @Column({
    type: "enum",
    enum: GuaranteePayback,
    array: false,
    nullable: true
  })
  guaranteePayback: GuaranteePayback;

  @Column({
    type: "enum",
    enum: InsurancePayback,
    array: false,
    nullable: true
  })
  insurancePayback: InsurancePayback;

  @Column({
    type: "enum",
    enum: InvestmentLevel,
    array: false,
    nullable: true
  })
  level: InvestmentLevel;

  @Column({
    type: "enum",
    enum: InvestmentStream,
    array: false,
    nullable: true
  })
  stream: InvestmentStream;

  @Column({
    type: "enum",
    enum: ESGType,
    array: false,
    nullable: true
  })
  esgClassification: ESGType;

  @Column({
    type: "enum",
    enum: InvestmentStatus,
    array: false,
  })
  status: InvestmentStatus;

  @Column({nullable: true})
  fromCompanyId: number;

  @Column("real",{nullable: true})
  percentage: number;

  @Column({ type: "bigint", nullable: true })
  startOfPayback: number;

  @Column("bigint", { array: true, nullable: true })
  period: number[];

  @Column("real", {nullable: true})
  shareFromOwner: number;

  @Column()
  toCompanyId: number;

  @Column()
  initiator: number;

  @Column()
  initiatorCompanyId: number;

  @Column({type: "bigint"})
  txTime: number;

  @Column({type: "bigint"})
  createdTime: number;

  @Column({nullable: true})
  txRef: string;

  @Column({
    nullable: true,
    default: InvestmentCategoryEnum.Project,
    enum: InvestmentCategoryEnum
  })
  category: InvestmentCategoryEnum

  @Column({
    nullable: true,
  })
  investmentName:string

  @Column({
    nullable: true,
  })
  nationalInvestmentId:number
}
