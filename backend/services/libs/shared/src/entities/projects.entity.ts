import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";
import { ActivityEntity } from "./activity.entity";

@Entity()
export class ProjectEntity {
  @PrimaryColumn()
  refId: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column()
  title: string;

  @Column({ type: "bigint" })
  companyId: number;

  @Column("bigint", { array: true, nullable: false })
  independentCertifiers: number[];

  @Column({
    type: "enum",
    enum: ProjectProposalStage,
    array: false,
    nullable: true,
  })
  projectProposalStage: ProjectProposalStage;

  @Column({ nullable: true })
  noObjectionLetterUrl?: string;

  @Column({ nullable: true })
  letterOfAuthorizationUrl?: string;

  @Column()
  sectoralScope: string;

  @Column("jsonb", { array: false, nullable: true })
  activities?: ActivityEntity[];

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
  })
  txType: TxType;

  @Column({ nullable: true })
  txRef: string;

  @Column({ type: "bigint" })
  txTime: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createTime: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  updateTime: number;

  @Column({ default: 0 })
  creditEst: number;

  @Column({ default: 0 })
  creditBalance: number;

  @Column({ default: 0 })
  creditRetired: number;

  @Column({ default: 0 })
  creditTransferred: number;

  @Column({ default: 0 })
  creditIssued: number;

  @Column({ default: 0 })
  creditChange: number;
}
