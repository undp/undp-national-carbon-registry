import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { BasicFieldsEntity } from "./basic.fields.entity";

@Entity()
export class ProjectEntity extends BasicFieldsEntity {
  @PrimaryColumn()
  refId: string;

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

  @Column()
  sectoralScope: string;

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

  @Column({ type: "bigint", default: 0 })
  creditBalance: number;

  @Column({ type: "bigint", default: 0 })
  creditRetired: number;
}
